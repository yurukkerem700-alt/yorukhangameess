// Oyun kapaklarına kısa oynanış klipleri (sessiz, döngülü MP4).
// Sayfadaki /oyun-<ad>.jpg kapaklarını bulur ve klibi olan oyunlarda görselin üstüne bir <video> ekler.
//  - Vitrin (hero): o an görünen slaytın klibi oynar
//  - Oyun sayfası: OYNA kapağının arkasında klip oynar
//  - Kartlar: bilgisayarda fareyle üzerine gelince, telefonda kart ekranda tam görününce (aynı anda en fazla 2)
// Veri tasarrufu açıksa ya da "az hareket" tercih edilmişse klipler hiç yüklenmez.
const CLIPS = new Set(['boru', 'kapkac', 'nazar-degmesin', 'stack-up', 'scorpy', 'restore-and-sell', 'halat-cekme', 'refleks-duellosu', 'kurt-kosusu', 'gok-savascisi', 'kilim-bloklari', 'yilan', 'birlestir', 'kartal', 'hafiza']);
const RX = /\/oyun-([a-z0-9-]+?)(?:-genis)?\.jpg(?:$|\?)/;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const MAX_TOUCH = 2;

const css = document.createElement('style');
css.textContent = `
video.yg-clip { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .35s ease; pointer-events: none; background: transparent; }
video.yg-clip.on { opacity: 1; }
.player-cover video.yg-clip.on { opacity: .75; filter: brightness(.7); }
.gcard .thumb .clip-badge { position: absolute; left: 8px; bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: .5px; background: rgba(0,0,0,.6); color: #fff; padding: 3px 7px; border-radius: 6px; pointer-events: none; z-index: 2; }
.gcard .thumb .clip-badge::before { content: '▶ '; color: #ff8a1f; }
.gcard:hover .thumb .clip-badge { opacity: 0; }
`;
document.head.appendChild(css);

function slugOf(img) { const m = RX.exec(img.getAttribute('src') || ''); return m && CLIPS.has(m[1]) ? m[1] : null; }

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
      touchPlaying.add(v); play(v);
    } else if (touchPlaying.has(v)) { touchPlaying.delete(v); stop(v); }
  }
}, { threshold: [0, 0.75] }) : null;

function attach(img) {
  if (img._clipDone) return; img._clipDone = true;
  const slug = slugOf(img); if (!slug) return;
  const host = img.parentElement; if (!host) return;
  const v = document.createElement('video');
  v.className = 'yg-clip'; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
  v.preload = 'none'; v.dataset.src = `/klip-${slug}.mp4`;
  v.addEventListener('playing', () => v.classList.add('on'));
  v.addEventListener('error', () => v.remove());
  img.insertAdjacentElement('afterend', v);

  if (host.classList.contains('slide')) {
    // Vitrin: aktif slayt değişince klip de değişir
    const sync = () => host.classList.contains('active') ? play(v) : stop(v);
    new MutationObserver(sync).observe(host, { attributes: true, attributeFilter: ['class'] }); sync();
  } else if (host.classList.contains('player-cover')) {
    play(v);
  } else if (host.classList.contains('thumb')) {
    const card = host.closest('a, .gcard') || host;
    if (host.closest('.gcard') && !host.querySelector('.clip-badge')) host.insertAdjacentHTML('beforeend', '<span class="clip-badge">' + (window.YG_LANG === 'en' ? 'CLIP' : 'KLİP') + '</span>');
    if (canHover) { card.addEventListener('mouseenter', () => play(v)); card.addEventListener('mouseleave', () => stop(v)); }
    else if (io) { host._clip = v; io.observe(host); }
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
