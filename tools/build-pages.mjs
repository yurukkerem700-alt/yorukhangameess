// Her resmi oyun için Google'ın okuyabileceği statik sayfa (g/<slug>.html) ve sitemap.xml üretir.
// Kullanım (repo kökünden):  node tools/build-pages.mjs
// Yeni oyun eklenince tools/games.json'a satır ekle, bu betiği çalıştır, çıkan dosyaları commit'le.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://yorukhangameess.vercel.app'; // Özel alan adı alınınca burayı değiştir, betiği yeniden çalıştır
const BRAND = 'YÖRÜKHAN GAMES';
const CATS = { aksiyon: 'Aksiyon', arcade: 'Arcade', bulmaca: 'Bulmaca', nisanci: 'Nişancı', macera: 'Macera', yaris: 'Yarış', strateji: 'Strateji', spor: 'Spor', egitici: 'Eğitici', diger: 'Diğer' };

export const slugify = (t) => t
  .replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase()
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[âàá]/g, 'a').replace(/[î]/g, 'i').replace(/[û]/g, 'u')
  .replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const abs = (p) => (/^https?:/.test(p) ? p : SITE + p);
const cut = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…');

const games = JSON.parse(readFileSync('tools/games.json', 'utf8'));
const tpl = readFileSync('oyun.html', 'utf8');
mkdirSync('g', { recursive: true });

function build(g, all) {
  const slug = slugify(g.title);
  const url = `${SITE}/g/${slug}`;
  const cat = CATS[g.category] || 'Diğer';
  const title = cut(`${g.title} Oyna — Ücretsiz ${cat} Oyunu | ${BRAND}`, 65);
  const desc = cut(`${g.title}: ${g.description}`, 158);
  const related = all.filter((x) => x.id !== g.id && x.category === g.category).concat(all.filter((x) => x.id !== g.id && x.category !== g.category)).slice(0, 6);

  const ld = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: g.title, url, description: g.description,
    image: abs(g.thumb), genre: cat, inLanguage: 'tr', gamePlatform: g.mobile ? ['Web tarayıcısı', 'Mobil', 'Masaüstü'] : ['Web tarayıcısı', 'Masaüstü'],
    applicationCategory: 'Game', operatingSystem: 'Any', datePublished: g.date,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY', availability: 'https://schema.org/InStock' },
    publisher: { '@type': 'Organization', name: 'Yörükhan Stüdyo', url: SITE + '/' },
  };
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Keşfet', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: cat, item: `${SITE}/?kategori=${g.category}` },
      { '@type': 'ListItem', position: 3, name: g.title, item: url },
    ],
  };

  let h = tpl;
  const rep = (re, to) => { if (!re.test(h)) throw new Error('şablonda bulunamadı: ' + re); h = h.replace(re, typeof to === 'function' ? to : () => to); };
  rep(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  rep(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`);
  rep(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(`${g.title} — ${BRAND}`)}">`);
  rep(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">\n<meta property="og:url" content="${url}">`);
  rep(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${abs(g.thumb)}">\n<meta name="twitter:title" content="${esc(g.title)} — ${BRAND}">\n<meta name="twitter:image" content="${abs(g.thumb)}">\n<link rel="canonical" href="${url}">`);
  rep(/<\/head>/, `<script type="application/ld+json">${JSON.stringify([ld, crumbs])}</script>\n</head>`);
  // Google'ın JS çalıştırmadan da okuyabilmesi için içerik önceden yazılı; oyun.js aynı alanları sonra günceller.
  rep(/(<h1 class="g-title" id="g-title">)[\s\S]*?(<\/h1>)/, (m, a, b) => a + esc(g.title) + b);
  rep(/(<p id="g-desc">)(<\/p>)/, (m, a, b) => a + esc(g.description) + b);
  rep(/(<div class="kbd hidden" id="controls-box"><span class="ico">🎮<\/span><div><b>Nasıl oynanır\?<\/b><span id="g-controls">)(<\/span>)/, (m, a, b) => a + esc(g.controls) + b);
  rep(/<section class="section" id="related-sec"><\/section>/, `<section class="section" id="related-sec"><div class="sec-head"><h2>Bunları da sevebilirsin</h2></div><ul class="seo-links">${related.map((r) => `<li><a href="/g/${slugify(r.title)}">${esc(r.title)}</a></li>`).join('')}</ul></section>`);
  rep(/<script type="module" src="\/game\.js"><\/script>/, `<script>window.YG_GAME_ID=${JSON.stringify(g.id)};</script>\n<script type="module" src="/game.js"></script>`);
  writeFileSync(`g/${slug}.html`, h);
  return slug;
}

const slugs = games.map((g) => build(g, games));
if (new Set(slugs).size !== slugs.length) throw new Error('çakışan slug var');

const today = new Date().toISOString().slice(0, 10);
let sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
sm += `  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
sm += `  <url><loc>${SITE}/?liste=tum</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
for (const [i, g] of games.entries()) sm += `  <url><loc>${SITE}/g/${slugs[i]}</loc><lastmod>${g.date}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
for (const [p, pr, cf] of [['yukle', '0.5', 'monthly'], ['hakkinda', '0.4', 'monthly'], ['gizlilik', '0.2', 'yearly'], ['kosullar', '0.2', 'yearly']]) sm += `  <url><loc>${SITE}/${p}</loc><changefreq>${cf}</changefreq><priority>${pr}</priority></url>\n`;
sm += '</urlset>\n';
writeFileSync('sitemap.xml', sm);
writeFileSync('slugs.js', '// tools/build-pages.mjs tarafından üretilir — elle değiştirme\nexport const STATIC_SLUGS = ' + JSON.stringify(Object.fromEntries(games.map((g, i) => [g.id, slugs[i]])), null, 1) + ';\n');
console.log(`${slugs.length} oyun sayfası + sitemap üretildi:`, slugs.join(', '));
