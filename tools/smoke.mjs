// Otomatik duman testi: yayından önce her oyunu ve oyun sayfasını dener.
//   Kurulum (bir kez):  npm i -D playwright && npx playwright install chromium
//   Çalıştırma:         node tools/smoke.mjs            (hepsi)
//                       node tools/smoke.mjs kurt-kosusu (tek oyun)
// Oyun dosyaları (oyun-*.html) masaüstü + telefon boyutunda açılır, tuşa/dokunmaya cevap verir mi ve hata çıkarıyor mu bakılır.
// g/*.html sayfalarında başlık, açıklama, canonical ve JSON-LD denetlenir.
import http from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const pw = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const { chromium } = pw.chromium ? pw : pw.default;
const only = process.argv[2];
const ROOT = process.cwd();
const games = JSON.parse(readFileSync('tools/games.json', 'utf8'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };

const server = http.createServer((q, r) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/') u = '/index.html';
  let f = normalize(join(ROOT, u));
  if (!f.startsWith(ROOT)) { r.writeHead(403); return r.end(); }
  if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
  if (!existsSync(f) || statSync(f).isDirectory()) { r.writeHead(404); return r.end('404'); }
  r.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
  r.end(readFileSync(f));
});
await new Promise((ok) => server.listen(0, ok));
const base = `http://localhost:${server.address().port}`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--no-sandbox'] });
const results = [];
const fail = (name, why) => results.push({ name, ok: false, why });
const pass = (name, note = '') => results.push({ name, ok: true, why: note });

async function tryGame(g, mode) {
  const label = `${g.title} [${mode}]`;
  const ctx = await browser.newContext(mode === 'mobil'
    ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
    : { viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('JS hatası: ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|ERR_/.test(m.text())) errs.push('konsol: ' + m.text().slice(0, 160)); });
  try {
    await p.goto(base + g.file, { waitUntil: 'load', timeout: 20000 });
    await p.waitForTimeout(1500);
    const shot1 = (await p.screenshot()).length;
    // Dokun/tıkla ve tuşlara bas
    const c = mode === 'mobil' ? p.touchscreen : null;
    for (const k of ['Space', 'ArrowUp', 'ArrowRight', 'KeyW', 'KeyA', 'Enter']) { await p.keyboard.press(k).catch(() => {}); await p.waitForTimeout(120); }
    if (c) { await c.tap(195, 420).catch(() => {}); await c.tap(120, 600).catch(() => {}); } else { await p.mouse.click(640, 360).catch(() => {}); }
    await p.waitForTimeout(1500);
    const shot2 = (await p.screenshot()).length;
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    if (shot1 < 6000 && shot2 < 6000) fail(label, 'ekran boş görünüyor');
    else if (errs.length) fail(label, errs[0]);
    else if (mode === 'mobil' && g.mobile && overflow) fail(label, 'telefonda yatay taşma var');
    else pass(label, shot1 !== shot2 ? 'girdiye cevap verdi' : 'görüntü değişmedi (kontrol et)');
  } catch (e) { fail(label, 'açılamadı: ' + e.message.slice(0, 120)); }
  await ctx.close();
}

// 1) Oyun dosyaları
for (const g of games) {
  if (only && !g.file?.includes(only)) continue;
  if (!g.file) continue; // harici adreste barınan oyunlar ayrıca test edilir
  await tryGame(g, 'masaüstü');
  if (g.mobile) await tryGame(g, 'mobil');
}

// 2) Statik SEO sayfaları
if (!only) {
  for (const f of readdirSync('g').filter((x) => x.endsWith('.html'))) {
    const h = readFileSync(join('g', f), 'utf8');
    const name = `g/${f}`;
    const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    const desc = ((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    const canon = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || '';
    const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    let ldOk = ld.length > 0; try { ld.forEach((m) => JSON.parse(m[1])); } catch { ldOk = false; }
    const probs = [];
    if (title.length < 20 || title.length > 70) probs.push(`başlık uzunluğu ${title.length}`);
    if (desc.length < 50 || desc.length > 165) probs.push(`açıklama uzunluğu ${desc.length}`);
    if (!canon.endsWith('/g/' + f.replace('.html', ''))) probs.push('canonical yanlış');
    if (!ldOk) probs.push('JSON-LD bozuk');
    if (!/<h1[^>]*>[^<]{3,}<\/h1>/.test(h)) probs.push('h1 boş');
    if (!/id="g-desc">[^<]{20,}<\/p>/.test(h)) probs.push('açıklama metni sayfada yok');
    probs.length ? fail(name, probs.join(', ')) : pass(name);
  }
}

await browser.close(); server.close();
const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.why ? ' — ' + r.why : ''}`);
console.log(`\n${results.length - bad.length}/${results.length} geçti`);
process.exit(bad.length ? 1 : 0);
