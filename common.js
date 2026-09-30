// Ortak parçalar: veritabanı bağlantısı, oturum, menüler, kartlar, reklamlar
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { CONFIG } from './config.js';
import './clips.js';

export { CONFIG };
export const sb = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function fmtNum(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '').replace('.', ',') + ' mn';
  if (n >= 1e4) return Math.round(n / 1e3) + ' bin';
  return n.toLocaleString('tr-TR');
}
export function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  for (const [sec, name] of [[31536000, 'yıl'], [2592000, 'ay'], [604800, 'hafta'], [86400, 'gün'], [3600, 'saat'], [60, 'dakika']])
    if (s >= sec) return `${Math.floor(s / sec)} ${name} önce`;
  return 'az önce';
}
export const fmtDate = iso => new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
export const catById = id => CONFIG.CATEGORIES.find(c => c.id === id) || { id, name: id || 'Diğer', icon: '🎮', color: ['#444', '#222'] };
export const isNew = g => { const t = g.approved_at || g.created_at; return t && Date.now() - new Date(t).getTime() < 10 * 864e5; };
export const gameUrl = g => `/oyun.html?id=${g.id}`;
export const devName = g => g.yg_profiles?.username || 'Yörükhan';

export function fallbackThumb(title) {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const a = h % 360, b = (a + 45) % 360;
  const letter = esc((String(title).trim()[0] || '?').toLocaleUpperCase('tr'));
  return `<div class="thumb-fb" style="background:linear-gradient(135deg,hsl(${a} 65% 42%),hsl(${b} 70% 22%))">${letter}</div>`;
}
export const imgHTML = (g, cls = '') => g.thumb_url
  ? `<img class="${cls}" src="${esc(g.thumb_url)}" alt="${esc(g.title)}" loading="lazy" onerror="this.remove()">`
  : fallbackThumb(g.title);
export const thumbHTML = g => imgHTML(g);

const PLAY_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>';
export function gameCard(g) {
  const cat = catById(g.category);
  return `<a class="gcard" href="${gameUrl(g)}">
    <div class="thumb">${imgHTML(g)}
      ${isNew(g) && !g.is_official ? '<span class="tag tag-new">Yeni</span>' : ''}
      <div class="play-hover"><span>${PLAY_SVG}</span></div>
    </div>
    <div class="info"><div class="t">${esc(g.title)}</div>
      <div class="m"><span>${cat.name}</span><span class="dot"></span><span>▶ ${fmtNum(g.plays)}</span></div></div>
  </a>`;
}
export function skeletonCards(n = 5) {
  return Array.from({ length: n }, () => `<div class="gcard"><div class="thumb skel"></div><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:12px;width:45%"></div></div>`).join('');
}
export const PLAY_ICON = PLAY_SVG;

export const GAME_SELECT = 'id,title,description,category,controls,mobile_friendly,source_type,file_path,game_url,thumb_url,banner_url,status,reject_reason,featured,is_official,plays,likes,created_at,approved_at,owner_id,yg_profiles(username)';

// ---------- Oturum ----------
let _me = null;
export async function getMe() {
  if (_me) return _me;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return (_me = { user: null, profile: null, isAdmin: false });
  const user = session.user;
  const [p, a] = await Promise.all([
    sb.from('yg_profiles').select('*').eq('id', user.id).maybeSingle(),
    sb.from('yg_admins').select('user_id').eq('user_id', user.id).maybeSingle(),
  ]);
  _me = { user, profile: p.data, isAdmin: !!a.data };
  return _me;
}
export async function requireLogin() {
  const me = await getMe();
  if (!me.user) { location.href = '/giris.html?next=' + encodeURIComponent(location.pathname + location.search); return null; }
  return me;
}

// ---------- Menüler ----------
function renderSideCats(counts = {}) {
  const box = $('#side-cats');
  if (!box) return;
  const cur = new URLSearchParams(location.search).get('kategori');
  box.innerHTML = CONFIG.CATEGORIES.map(c => `<a href="/?kategori=${c.id}" class="${cur === c.id ? 'active' : ''}"><span class="ico">${c.icon}</span>${esc(c.name)}${counts[c.id] ? `<span class="side-count">${counts[c.id]}</span>` : ''}</a>`).join('');
}
export const setCategoryCounts = renderSideCats;

async function renderAuth() {
  const box = $('#nav-auth');
  const me = await getMe();
  const tabMe = $('#tab-me');
  if (!me.user) {
    if (box) box.innerHTML = `<a class="btn btn-primary btn-sm up-btn" href="/yukle.html">Oyun Yükle</a><a class="btn btn-white btn-sm" href="/giris.html">Giriş Yap</a>`;
    if (tabMe) tabMe.href = '/giris.html';
    return;
  }
  const name = me.profile?.username || me.user.email.split('@')[0];
  if (tabMe) $('#tab-me-l').textContent = 'Profil';
  if (!box) return;
  box.innerHTML = `<a class="btn btn-primary btn-sm up-btn" href="/yukle.html">+ Oyun Yükle</a>
    <div class="user-menu">
      <button class="user-chip" id="user-chip" aria-label="Hesap menüsü"><span class="avatar">${esc(name[0])}</span><span class="uname">${esc(name)}</span></button>
      <div class="dropdown" id="user-dd">
        <a href="/profil.html?u=${encodeURIComponent(name)}">👤 Profilim</a>
        <a href="/panelim.html">🎮 Oyunlarım</a>
        ${me.isAdmin ? '<a href="/admin.html">⚙️ Yönetim Paneli</a>' : ''}
        <button id="logout-btn">↩ Çıkış yap</button>
      </div>
    </div>`;
  $('#user-chip').onclick = e => { e.stopPropagation(); $('#user-dd').classList.toggle('open'); };
  document.addEventListener('click', () => $('#user-dd')?.classList.remove('open'));
  $('#logout-btn').onclick = async () => { await sb.auth.signOut(); location.href = '/'; };
}

function initNav() {
  const side = $('#sidebar'), scrim = $('#scrim');
  const open = v => { side?.classList.toggle('open', v); scrim?.classList.toggle('open', v); };
  $('#menu-btn')?.addEventListener('click', () => open(true));
  scrim?.addEventListener('click', () => open(false));
  $('#tab-cats')?.addEventListener('click', () => { open(true); $('#side-cats')?.scrollIntoView({ block: 'center' }); });
  $('#tab-search')?.addEventListener('click', () => {
    const f = $('#search'); f.classList.toggle('open');
    if (f.classList.contains('open')) { f.querySelector('input').focus(); scrollTo({ top: 0 }); }
  });
  // aktif menü
  const p = new URLSearchParams(location.search);
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  let key = path === '/' || path === '/index' ? (p.get('liste') || (p.get('q') || p.get('kategori') ? '' : 'home')) : path.slice(1).split('/')[0];
  $$('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === key));
  $$('form.search-form').forEach(f => {
    const inp = f.querySelector('input');
    if (p.get('q')) inp.value = p.get('q');
    f.addEventListener('submit', e => { e.preventDefault(); const q = inp.value.trim(); location.href = q ? '/?q=' + encodeURIComponent(q) : '/?liste=tum'; });
  });
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
  renderSideCats();
}

// ---------- Bildirim / modal ----------
export function toast(msg, ms = 2600) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), ms);
}
export function openModal(html, { wide = false } = {}) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal ${wide ? 'wide' : ''}">${html}</div>`;
  const close = () => back.remove();
  back.addEventListener('click', e => { if (e.target === back) close(); });
  document.body.appendChild(back);
  back.querySelectorAll('[data-close]').forEach(b => b.onclick = close);
  return { el: back, close };
}

// ---------- Reklamlar ----------
let adsLoaded = false;
function loadAdsense() {
  if (adsLoaded || !CONFIG.ADSENSE_CLIENT) return;
  adsLoaded = true;
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CONFIG.ADSENSE_CLIENT;
  document.head.appendChild(s);
}
// <div class="ad" data-slot="top"></div> şeklindeki yerleri doldurur
export function mountAds(root = document) {
  $$('.ad[data-slot]:not([data-done])', root).forEach(el => {
    el.dataset.done = '1';
    const slot = CONFIG.AD_SLOTS[el.dataset.slot];
    if (CONFIG.ADSENSE_CLIENT && slot) {
      loadAdsense();
      el.classList.remove('placeholder');
      el.innerHTML = `<ins class="adsbygoogle" style="display:block;width:100%" data-ad-client="${esc(CONFIG.ADSENSE_CLIENT)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* reklam engelleyici */ }
    } else {
      el.classList.add('placeholder');
      el.innerHTML = '<span>Reklam</span>';
    }
  });
}

// ---------- Resim küçült (kapaklar için) ----------
export async function resizeImage(file, maxW, maxH) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const r = Math.min(1, maxW / img.width, maxH / img.height);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  let blob = await new Promise(res => c.toBlob(res, 'image/webp', 0.86));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.86));
  return blob;
}

initNav();
renderAuth();
if (CONFIG.ADSENSE_CLIENT) loadAdsense();
mountAds();
