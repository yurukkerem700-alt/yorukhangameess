// Oyun kapaklarına kısa oynanış klipleri (sessiz, döngülü MP4).
// Sayfadaki /oyun-<ad>.jpg kapaklarını bulur ve klibi olan oyunlarda görselin üstüne bir <video> ekler.
//  - Vitrin (hero): o an görünen slaytın klibi oynar
//  - Oyun sayfası: OYNA kapağının arkasında klip oynar
//  - Kartlar: bilgisayarda fareyle üzerine gelince, telefonda kart ekranda tam görününce (aynı anda en fazla 2)
// Veri tasarrufu açıksa ya da "az hareket" tercih edilmişse klipler hiç yüklenmez.
const CLIPS = new Set(['boru', 'kapkac', 'nazar-degmesin', 'stack-up', 'scorpy', 'restore-and-sell', 'halat-cekme', 'refleks-duellosu', 'kurt-kosusu', 'gok-savascisi', 'kilim-bloklari', 'yilan', 'birlestir', 'kartal', 'hafiza']);
const SVG_CLIPS = new Set(['ruzgar-limani', 'golge-laboratuvari', 'akvaryum-seferi']);
const RX = /\/oyun-([a-z0-9-]+?)(?:-genis)?\.(?:jpg|jpeg|png|webp|svg)(?:$|\?)/;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const MAX_TOUCH = 2;

const css = document.createElement('style');
css.textContent = `
.yg-clip { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; pointer-events: none; background: transparent; }
.yg-clip.on { opacity: 1; }
.player-cover .yg-clip.on { opacity: .75; filter: brightness(.7); }
.gcard .thumb .clip-badge { position: absolute; left: 8px; bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: .5px; background: rgba(0,0,0,.6); color: #fff; padding: 3px 7px; border-radius: 6px; pointer-events: none; z-index: 2; }
.gcard .thumb .clip-badge::before { content: '▶ '; color: #ff8a1f; }
.gcard:hover .thumb .clip-badge { opacity: 0; }
`;
document.head.appendChild(css);

function slugOf(img) { const m = RX.exec(img.getAttribute('src') || ''); return m && (CLIPS.has(m[1]) || SVG_CLIPS.has(m[1])) ? m[1] : null; }

function play(v) {
  if (!v.src) v.src = v.dataset.src;
  const p = v.play(); if (p && p.catch) p.catch(() => {});
}
function stop(v) { v.pause(); v.classList.remove('on'); }

const touchPlaying = new Set();
const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
  for (const e of entries) {
    const v = e.target._clip; if (!v) continue;
    if (e.intersectionRatio >= 0.75) {
      if (touchPlaying.size >= MAX_TOUCH) continue;
      touchPlaying.add(v);
      if (v.tagName === 'VIDEO') play(v); else v.classList.add('on');
    } else if (touchPlaying.has(v)) { touchPlaying.delete(v); if (v.tagName === 'VIDEO') stop(v); else v.classList.remove('on'); }
  }
}, { threshold: [0, 0.75] }) : null;

function attach(img) {
  if (img._clipDone) return; img._clipDone = true;
  const slug = slugOf(img); if (!slug) return;
  const host = img.parentElement; if (!host) return;
  let v;
  if (SVG_CLIPS.has(slug)) {
    v = document.createElement('img');
    v.className = 'yg-clip yg-clip-img';
    v.src = `/klip-${slug}.svg`;
    v.alt = '';
    v.setAttribute('aria-hidden', 'true');
    v.addEventListener('load', () => v.classList.add('on'));
    v.addEventListener('error', () => v.remove());
    img.insertAdjacentElement('afterend', v);
    if (host.classList.contains('slide')) {
      const sync = () => v.classList.toggle('on', host.classList.contains('active'));
      new MutationObserver(sync).observe(host, { attributes: true, attributeFilter: ['class'] }); sync();
    } else if (host.classList.contains('player-cover')) {
      v.classList.add('on');
    } else if (host.classList.contains('thumb')) {
      const card = host.closest('a, .gcard') || host;
      if (host.closest('.gcard') && !host.querySelector('.clip-badge')) host.insertAdjacentHTML('beforeend', '<span class="clip-badge">KLİP</span>');
      if (canHover) { card.addEventListener('mouseenter', () => v.classList.add('on')); card.addEventListener('mouseleave', () => v.classList.remove('on')); }
      else if (io) { host._clip = v; io.observe(host); }
    }
    return;
  }
  const v2 = document.createElement('video');
  v2.className = 'yg-clip'; v2.muted = true; v2.defaultMuted = true; v2.loop = true; v2.playsInline = true;
  v2.setAttribute('muted', ''); v2.setAttribute('playsinline', ''); v2.setAttribute('aria-hidden', 'true');
  v2.preload = 'none'; v2.dataset.src = `/klip-${slug}.mp4`;
  v2.addEventListener('playing', () => v2.classList.add('on'));
  v2.addEventListener('error', () => v2.remove());
  img.insertAdjacentElement('afterend', v2);

  if (host.classList.contains('slide')) {
    const sync = () => host.classList.contains('active') ? play(v2) : stop(v2);
    new MutationObserver(sync).observe(host, { attributes: true, attributeFilter: ['class'] }); sync();
  } else if (host.classList.contains('player-cover')) {
    play(v2);
  } else if (host.classList.contains('thumb')) {
    const card = host.closest('a, .gcard') || host;
    if (host.closest('.gcard') && !host.querySelector('.clip-badge')) host.insertAdjacentHTML('beforeend', '<span class="clip-badge">KLİP</span>');
    if (canHover) { card.addEventListener('mouseenter', () => play(v2)); card.addEventListener('mouseleave', () => stop(v2)); }
    else if (io) { host._clip = v2; io.observe(host); }
  }
}

function scan(root) {
  if (saveData || reduced) return;
  (root.querySelectorAll ? root : document).querySelectorAll('.slide img, .thumb img, .player-cover img').forEach(attach);
}
new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n.matches && n.matches('img') ? n.parentElement || n : n); })
  .observe(document.documentElement, { childList: true, subtree: true });
scan(document);
// Sekme arka plandayken klipler dursun (pil ve veri)
document.addEventListener('visibilitychange', () => { if (document.hidden) document.querySelectorAll('video.yg-clip').forEach(v => v.pause()); else document.querySelectorAll('.slide.active video.yg-clip, .player-cover video.yg-clip').forEach(play); });

// Yeni resmi oyunlar için SVG önizlemeleri video altyapısıyla aynı kart davranışını kullanır.
