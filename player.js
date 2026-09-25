// Oyun oynatıcı: yüklenen oyunları güvenli bir kutu (sandbox) içinde çalıştırır.
// Kullanıcı oyunları sitenin geri kalanına (giriş bilgileri vb.) erişemez.
import { sb } from './common.js';

// Oyunun içine eklenen küçük yardımcı: kutu içinde localStorage çalışmadığı için
// oyunun kayıtlarını (skor, seviye) sahte bir depoda tutar ve siteye iletir.
function SHIM(init) {
  var timer = null;
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  function mk(persist) {
    var d = {};
    if (persist && init) for (var k in init) if (has(init, k)) d[k] = String(init[k]);
    function save() {
      if (!persist) return;
      clearTimeout(timer);
      timer = setTimeout(function () { try { parent.postMessage({ __yg: 'save', data: d }, '*'); } catch (e) {} }, 300);
    }
    var api = {};
    var methods = {
      getItem: function (k) { k = String(k); return has(d, k) ? d[k] : null; },
      setItem: function (k, v) { d[String(k)] = String(v); save(); },
      removeItem: function (k) { delete d[String(k)]; save(); },
      clear: function () { for (var k in d) delete d[k]; save(); },
      key: function (i) { var ks = Object.keys(d); return i < ks.length ? ks[i] : null; }
    };
    for (var m in methods) Object.defineProperty(api, m, { value: methods[m], configurable: true, writable: true });
    Object.defineProperty(api, 'length', { get: function () { return Object.keys(d).length; }, configurable: true });
    if (typeof Proxy === 'undefined') return api;
    return new Proxy(api, {
      get: function (t, p) { if (p in t) return t[p]; if (typeof p === 'string' && has(d, p)) return d[p]; return undefined; },
      set: function (t, p, v) { if (typeof p === 'string' && !(p in t)) methods.setItem(p, v); return true; },
      deleteProperty: function (t, p) { methods.removeItem(p); return true; },
      has: function (t, p) { return (p in t) || has(d, p); },
      ownKeys: function () { return Object.keys(d); },
      getOwnPropertyDescriptor: function (t, p) {
        if (typeof p === 'string' && has(d, p)) return { value: d[p], enumerable: true, configurable: true, writable: true };
        return undefined;
      }
    });
  }
  var ok = true;
  try { window.localStorage.getItem('__yg'); } catch (e) { ok = false; }
  if (!ok) {
    try { Object.defineProperty(window, 'localStorage', { value: mk(true), configurable: true }); } catch (e) {}
    try { Object.defineProperty(window, 'sessionStorage', { value: mk(false), configurable: true }); } catch (e) {}
  }
  try { void document.cookie; } catch (e) {
    var jar = {};
    try {
      Object.defineProperty(document, 'cookie', {
        configurable: true,
        get: function () { return Object.keys(jar).map(function (k) { return k + '=' + jar[k]; }).join('; '); },
        set: function (v) { var kv = String(v).split(';')[0]; var i = kv.indexOf('='); if (i > 0) jar[kv.slice(0, i).trim()] = kv.slice(i + 1); }
      });
    } catch (e2) {}
  }
}

export function buildSrcdoc(html, saveData) {
  const init = JSON.stringify(saveData || {}).replace(/</g, '\\u003c');
  const shim = `<script>(${SHIM.toString()})(${init});<\/script>`;
  const tryInsert = re => {
    const m = html.match(re);
    if (!m) return null;
    const i = m.index + m[0].length;
    return html.slice(0, i) + shim + html.slice(i);
  };
  return tryInsert(/<head(\s[^>]*)?>/i) || tryInsert(/<html(\s[^>]*)?>/i) || tryInsert(/<!doctype[^>]*>/i) || shim + html;
}

const SAVE_PREFIX = 'yg-save:';
function loadSave(id) {
  try { return JSON.parse(localStorage.getItem(SAVE_PREFIX + id) || '{}'); } catch { return {}; }
}
function storeSave(id, data) {
  try {
    const s = JSON.stringify(data);
    if (s.length < 2_000_000) localStorage.setItem(SAVE_PREFIX + id, s);
  } catch { /* kota dolu */ }
}

export function gameFileUrl(path) {
  // Sitenin kendi içindeki oyunlar ("/oyun-....html") doğrudan okunur
  if (/^(\/|https?:)/.test(path)) return path;
  return sb.storage.from('yg-games').getPublicUrl(path).data.publicUrl;
}

// container: .player elementi. game: veritabanı satırı. opts.html: (önizleme için) doğrudan HTML metni
export async function startGame(container, game, opts = {}) {
  container.querySelectorAll('iframe, .player-cover, .player-loading').forEach(n => n.remove());
  const loading = document.createElement('div');
  loading.className = 'player-loading';
  loading.innerHTML = '<div><div class="spinner"></div>Oyun yükleniyor…</div>';
  container.appendChild(loading);

  const frame = document.createElement('iframe');
  frame.title = game.title || 'Oyun';
  frame.setAttribute('allow', 'autoplay; fullscreen; gamepad; accelerometer; gyroscope');
  frame.setAttribute('allowfullscreen', '');
  frame.setAttribute('referrerpolicy', 'no-referrer');

  try {
    if (game.source_type === 'url' && !opts.html) {
      // Yönetici tarafından eklenen, başka adreste barınan resmi oyunlar
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-modals allow-forms allow-popups allow-orientation-lock');
      frame.src = game.game_url;
    } else {
      let html = opts.html;
      if (html == null) {
        const res = await fetch(gameFileUrl(game.file_path), { cache: 'force-cache' });
        if (!res.ok) throw new Error('Dosya bulunamadı (' + res.status + ')');
        html = await res.text();
      }
      const saveKey = opts.preview ? null : game.id;
      frame.setAttribute('sandbox', 'allow-scripts allow-pointer-lock allow-modals allow-orientation-lock');
      frame.srcdoc = buildSrcdoc(html, saveKey ? loadSave(saveKey) : {});
      if (saveKey) {
        const onMsg = e => {
          if (e.source !== frame.contentWindow || !e.data || e.data.__yg !== 'save') return;
          storeSave(saveKey, e.data.data);
        };
        window.addEventListener('message', onMsg);
      }
    }
  } catch (err) {
    loading.innerHTML = `<div class="center"><div style="font-size:38px">😕</div>Oyun açılamadı.<br><span class="dim">${String(err.message || err)}</span></div>`;
    return null;
  }

  frame.addEventListener('load', () => { loading.remove(); try { frame.focus(); } catch {} });
  container.appendChild(frame);
  setTimeout(() => loading.remove(), 8000);
  return frame;
}

// Tam ekran (iPhone gibi desteklemeyen cihazlarda sahte tam ekran)
export function toggleFullscreen(container) {
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    return;
  }
  if (container.classList.contains('pseudo-fs')) { exitPseudo(container); return; }
  const req = container.requestFullscreen || container.webkitRequestFullscreen;
  if (req) {
    Promise.resolve(req.call(container)).then(() => {
      try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch {}
    }).catch(() => enterPseudo(container));
  } else {
    enterPseudo(container);
  }
}
function enterPseudo(c) {
  c.classList.add('pseudo-fs');
  document.body.style.overflow = 'hidden';
  if (!c.querySelector('.fs-exit')) {
    const b = document.createElement('button');
    b.className = 'fs-exit';
    b.setAttribute('aria-label', 'Tam ekrandan çık');
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    b.onclick = () => exitPseudo(c);
    c.appendChild(b);
  }
}
function exitPseudo(c) {
  c.classList.remove('pseudo-fs');
  document.body.style.overflow = '';
}
