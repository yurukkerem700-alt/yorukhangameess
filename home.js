import { sb, CONFIG, $, $$, esc, fmtNum, catById, gameCard, skeletonCards, GAME_SELECT, mountAds, gameUrl, imgHTML, fallbackThumb, setCategoryCounts, PLAY_ICON, devName } from './common.js';

const P = new URLSearchParams(location.search);
const Q = (P.get('q') || '').trim(), CAT = P.get('kategori') || '', LIST = P.get('liste') || '';
const BROWSE = !!(Q || CAT || LIST);
const CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>';
const CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>';

const by = {
  popular: (a, b) => b.plays - a.plays || b.likes - a.likes,
  new: (a, b) => new Date(b.approved_at || b.created_at) - new Date(a.approved_at || a.created_at),
  liked: (a, b) => b.likes - a.likes || b.plays - a.plays,
  az: (a, b) => a.title.localeCompare(b.title, 'tr'),
};
const sorted = (arr, k) => [...arr].sort(by[k]);

async function loadGames() {
  const { data, error } = await sb.from('yg_games').select(GAME_SELECT).eq('status', 'approved').limit(1000);
  if (error) throw error;
  return data || [];
}

// ============ KEŞFET ============
function heroSlides(games) {
  const pick = [];
  const add = g => { if (g && !pick.includes(g) && pick.length < 6) pick.push(g); };
  sorted(games.filter(g => g.featured), 'popular').forEach(add);
  sorted(games.filter(g => g.is_official), 'popular').forEach(add);
  sorted(games, 'popular').forEach(add);
  return pick;
}

function renderHero(list) {
  const stage = $('#hero-stage'), side = $('#hero-list'), dots = $('#hero-dots'), hero = $('#hero');
  if (!list.length) {
    stage.innerHTML = `<div class="slide active"><div style="position:absolute;inset:0;background:radial-gradient(700px 400px at 80% 30%,rgba(255,138,31,.45),transparent 60%),linear-gradient(135deg,#231a2e,#121118)"></div>
      <div class="fade"></div><div class="slide-body"><div class="slide-kicker">Hoş geldin</div><div class="slide-title">İlk oyunu sen yükle!</div>
      <p class="slide-desc">YÖRÜKHAN GAMES'e oyununu yükle, binlerce oyuncuya ulaş.</p><div class="slide-actions"><a class="btn btn-white btn-lg" href="/yukle.html">Oyun Yükle</a></div></div></div>`;
    side.remove(); return;
  }
  stage.innerHTML = list.map((g, i) => {
    const img = g.banner_url || g.thumb_url;
    const kicker = g.featured ? '🔥 Öne çıkan' : g.is_official ? '◆ Yörükhan Orijinal' : '★ Popüler';
    return `<div class="slide ${i ? '' : 'active'}">
      ${img ? `<img src="${esc(img)}" alt="" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>` : `<div style="position:absolute;inset:0">${fallbackThumb(g.title)}</div>`}
      <div class="fade"></div>
      <div class="slide-body">
        <div class="slide-kicker">${kicker}</div>
        <div class="slide-title">${esc(g.title)}</div>
        <p class="slide-desc">${esc(g.description || '')}</p>
        <div class="slide-actions">
          <a class="btn btn-white btn-lg" href="${gameUrl(g)}&oyna=1">${PLAY_ICON} Hemen Oyna</a>
          <a class="btn btn-ghost btn-lg" href="${gameUrl(g)}">Detaylar</a>
        </div>
      </div>
    </div>`;
  }).join('');
  side.innerHTML = list.map((g, i) => `<button class="hero-item ${i ? '' : 'active'}" data-i="${i}"><span class="bar"></span>${(g.banner_url || g.thumb_url) ? `<img src="${esc(g.banner_url || g.thumb_url)}" alt="">` : fallbackThumb(g.title)}<span>${esc(g.title)}</span></button>`).join('');
  // yedek küçük resimlerin stili düzgün birleşsin
  side.querySelectorAll('.thumb-fb').forEach(el => { el.style.cssText += ';width:52px;height:68px;border-radius:8px;font-size:20px;flex:none'; });
  dots.innerHTML = list.map((_, i) => `<button class="${i ? '' : 'active'}" data-i="${i}" aria-label="${i + 1}. oyun"></button>`).join('');

  const DUR = 7000;
  hero.style.setProperty('--dur', DUR + 'ms');
  let cur = 0, timer = null, paused = false;
  const slides = $$('.slide', stage), items = $$('.hero-item', side), dts = $$('button', dots);
  function go(i) {
    cur = (i + list.length) % list.length;
    slides.forEach((s, k) => s.classList.toggle('active', k === cur));
    dts.forEach((d, k) => d.classList.toggle('active', k === cur));
    items.forEach((it, k) => { it.classList.remove('active'); if (k === cur) { void it.offsetWidth; it.classList.add('active'); } });
    schedule();
  }
  function schedule() { clearTimeout(timer); if (!paused && list.length > 1) timer = setTimeout(() => go(cur + 1), DUR); }
  items.forEach(it => it.onclick = () => go(+it.dataset.i));
  dts.forEach(d => d.onclick = () => go(+d.dataset.i));
  hero.addEventListener('mouseenter', () => { paused = true; hero.classList.add('paused'); clearTimeout(timer); });
  hero.addEventListener('mouseleave', () => { paused = false; hero.classList.remove('paused'); go(cur); });
  // kaydırma (telefon)
  let sx = null, swiped = false;
  stage.addEventListener('pointerdown', e => { sx = e.clientX; swiped = false; });
  stage.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) { swiped = true; go(cur + (dx < 0 ? 1 : -1)); } });
  stage.addEventListener('click', e => { if (swiped || e.target.closest('a')) return; location.href = gameUrl(list[cur]); });
  stage.style.cursor = 'pointer';
  schedule();
}

function railSection(title, link, games, id) {
  if (!games.length) return '';
  return `<section class="section" id="${id}">
    <div class="sec-head"><h2>${link ? `<a href="${link}">${title}${CHEV}</a>` : title}</h2><span class="spacer"></span>
      <div class="arrows"><button class="arrow" data-dir="-1" aria-label="Geri">${CHEV_L}</button><button class="arrow" data-dir="1" aria-label="İleri">${CHEV}</button></div></div>
    <div class="rail">${games.map(gameCard).join('')}</div>
  </section>`;
}

function originalsSection(games) {
  if (!games.length) return '';
  return `<section class="section originals">
    <div class="sec-head"><h2><a href="/?liste=orijinal">Yörükhan Orijinal${CHEV}</a><span class="badge">ÜCRETSİZ</span></h2></div>
    <div class="orig-grid">${games.slice(0, 3).map(g => `<a class="orig-card" href="${gameUrl(g)}">
      <div class="thumb">${imgHTML(g)}<div class="ribbon">▶ Şimdi oyna</div></div>
      <div><div class="t">${esc(g.title)}</div><div class="m">${catById(g.category).icon} ${catById(g.category).name} · ▶ ${fmtNum(g.plays)} oynanma</div></div>
    </a>`).join('')}</div>
  </section>`;
}

function topsSection(games) {
  const col = (title, link, list, meta) => `<div class="top-col"><h3>${title}<a href="${link}">Tümü</a></h3>
    ${list.slice(0, 5).map((g, i) => `<a class="top-item" href="${gameUrl(g)}"><span class="rank">${i + 1}</span><div class="thumb">${imgHTML(g)}</div>
      <div><div class="t">${esc(g.title)}</div><div class="m">${meta(g)}</div></div></a>`).join('')}</div>`;
  return `<section class="section"><div class="tops">
    ${col('En Çok Oynanan', '/?liste=populer', sorted(games, 'popular'), g => `▶ ${fmtNum(g.plays)} oynanma`)}
    ${col('En Beğenilen', '/?liste=tum&sirala=liked', sorted(games, 'liked'), g => `❤ ${fmtNum(g.likes)} beğeni`)}
    ${col('Yeni Çıkanlar', '/?liste=yeni', sorted(games, 'new'), g => `${catById(g.category).name} · ${esc(devName(g))}`)}
  </div></section>`;
}

function catsSection(counts) {
  return `<section class="section"><div class="sec-head"><h2>Kategoriler</h2></div><div class="cats">
    ${CONFIG.CATEGORIES.map(c => `<a class="cat-tile" href="/?kategori=${c.id}" style="background:linear-gradient(135deg,${c.color[0]},${c.color[1]})">
      <span class="e">${c.icon}</span><b>${esc(c.name)}</b><span>${counts[c.id] || 0} oyun</span></a>`).join('')}
  </div></section>`;
}

const CTA = `<section class="section cta-band">
  <div><h2>Oyun mu yaptın? Burada yayınla.</h2>
    <p>HTML5 oyununu yükle, binlerce oyuncuya ulaş. Ücretsiz, hızlı ve oyunun her zaman senin.</p>
    <a class="btn btn-primary btn-lg" href="/yukle.html">Oyununu Yükle</a></div>
  <div class="steps">
    <div class="step"><i>1</i><div><b>Ücretsiz hesap aç</b><span>30 saniye sürer</span></div></div>
    <div class="step"><i>2</i><div><b>.html dosyanı yükle</b><span>Kapak resmi ve açıklama ekle</span></div></div>
    <div class="step"><i>3</i><div><b>Yayına gir</b><span>İncelemeden sonra herkes oynasın</span></div></div>
  </div>
</section>`;

function renderDiscover(games, counts) {
  renderHero(heroSlides(games));
  const pop = sorted(games, 'popular'), fresh = sorted(games, 'new');
  let html = '';
  if (!games.length) {
    html = `<section class="section empty"><div class="big">🎮</div><h3>Henüz oyun yok</h3><p>İlk oyunu sen yükle, vitrinde ilk sen ol!</p></section>` + catsSection(counts) + CTA;
  } else {
    html += railSection('Popüler Oyunlar', '/?liste=populer', pop.slice(0, 15), 'r-pop');
    html += originalsSection(sorted(games.filter(g => g.is_official), 'popular'));
    html += railSection('Yeni Eklenenler', '/?liste=yeni', fresh.slice(0, 15), 'r-new');
    html += `<div class="ad ad-wide" data-slot="feed"></div>`;
    if (games.length >= 4) html += topsSection(games);
    const bigCats = CONFIG.CATEGORIES.filter(c => (counts[c.id] || 0) >= 3).sort((a, b) => counts[b.id] - counts[a.id]).slice(0, 3);
    bigCats.forEach(c => { html += railSection(`${c.icon} ${c.name} Oyunları`, `/?kategori=${c.id}`, sorted(games.filter(g => g.category === c.id), 'popular'), 'r-' + c.id); });
    html += catsSection(counts);
    html += CTA;
  }
  $('#sections').innerHTML = html;
  initRails();
  mountAds($('#sections'));
}

function initRails() {
  $$('.section').forEach(sec => {
    const rail = $('.rail', sec); if (!rail) return;
    const [prev, next] = $$('.arrow', sec);
    const upd = () => { prev.disabled = rail.scrollLeft < 8; next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8; };
    [prev, next].forEach(b => b.onclick = () => rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.9 }));
    rail.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  });
}

// ============ GÖZ AT ============
function renderBrowse(games) {
  $('#discover').hidden = true; $('#browse').hidden = false;
  const titles = { tum: 'Tüm Oyunlar', populer: 'Popüler Oyunlar', yeni: 'Yeni Çıkanlar', orijinal: 'Yörükhan Orijinal' };
  let title = titles[LIST] || 'Tüm Oyunlar';
  if (CAT) title = `${catById(CAT).icon} ${catById(CAT).name} Oyunları`;
  if (Q) title = `“${Q}” için sonuçlar`;
  $('#browse-title').textContent = title;
  document.title = title + ' | YÖRÜKHAN GAMES';

  const sortSel = $('#sort');
  sortSel.value = P.get('sirala') || (LIST === 'yeni' ? 'new' : 'popular');
  $('#chips').innerHTML = [{ id: '', name: 'Tümü', icon: '🎮' }, ...CONFIG.CATEGORIES].map(c => {
    const p = new URLSearchParams(); if (Q) p.set('q', Q); if (LIST && !c.id) p.set('liste', LIST); if (c.id) p.set('kategori', c.id); if (!c.id && !Q && !LIST) p.set('liste', 'tum');
    return `<a class="chip ${c.id === CAT ? 'active' : ''}" href="/?${p}">${c.icon} ${esc(c.name)}</a>`;
  }).join('');

  const norm = s => String(s || '').toLocaleLowerCase('tr');
  let list = games;
  if (LIST === 'orijinal') list = list.filter(g => g.is_official);
  if (CAT) list = list.filter(g => g.category === CAT);
  if (Q) { const q = norm(Q); list = list.filter(g => norm(g.title).includes(q) || norm(g.description).includes(q) || norm(devName(g)).includes(q)); }

  const draw = () => {
    const l = sorted(list, sortSel.value);
    if (!l.length) {
      $('#browse-grid').innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div><h3>Burada henüz oyun yok</h3><p>Başka bir kategori ya da arama dene.</p><a class="btn btn-white" href="/?liste=tum" style="margin-top:12px">Tüm oyunlar</a></div>`;
      return;
    }
    let html = '';
    l.forEach((g, i) => { html += gameCard(g); if ((i + 1) % 15 === 0 && i < l.length - 1) html += '<div class="ad ad-wide" data-slot="feed" style="grid-column:1/-1;margin:0"></div>'; });
    $('#browse-grid').innerHTML = html;
    mountAds($('#browse-grid'));
  };
  sortSel.onchange = () => {
    const p = new URLSearchParams(location.search); p.set('sirala', sortSel.value); history.replaceState(null, '', '/?' + p); draw();
  };
  draw();
}

(async () => {
  if (BROWSE) { $('#discover').hidden = true; $('#browse').hidden = false; $('#browse-grid').innerHTML = skeletonCards(10); }
  else $('#sections').innerHTML = `<section class="section"><div class="rail">${skeletonCards(5)}</div></section>`;
  let games = [];
  try { games = await loadGames(); }
  catch (e) {
    const box = BROWSE ? $('#browse-grid') : $('#sections');
    box.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">⚠️</div><h3>Oyunlar yüklenemedi</h3><p>${esc(e.message)}</p></div>`;
    return;
  }
  const counts = {};
  games.forEach(g => counts[g.category] = (counts[g.category] || 0) + 1);
  setCategoryCounts(counts);
  BROWSE ? renderBrowse(games) : renderDiscover(games, counts);
})();
