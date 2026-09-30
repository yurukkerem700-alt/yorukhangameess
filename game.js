import { sb, $, $$, esc, fmtNum, fmtDate, catById, imgHTML, gameCard, GAME_SELECT, getMe, toast, openModal, devName, gameUrl, PLAY_ICON } from './common.js';
import { startGame, toggleFullscreen } from './player.js';
import { STATIC_SLUGS } from './slugs.js';

const id = window.YG_GAME_ID || new URLSearchParams(location.search).get('id') || location.pathname.split('/').filter(Boolean)[1];
const autoplay = new URLSearchParams(location.search).get('oyna') !== null;
const player = $('#player');

function notFound() {
  document.title = 'Oyun bulunamadı | YÖRÜKHAN GAMES';
  $('#game-root').innerHTML = `<div class="empty" style="margin-top:30px"><div class="big">🕳️</div><h3>Oyun bulunamadı</h3><p>Bu oyun kaldırılmış ya da henüz yayınlanmamış olabilir.</p><a class="btn btn-white" href="/" style="margin-top:12px">Keşfet'e dön</a></div>`;
}

async function main() {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return notFound();
  const { data: g, error } = await sb.from('yg_games').select(GAME_SELECT).eq('id', id).maybeSingle();
  if (error || !g) return notFound();
  const cat = catById(g.category), dev = devName(g);

  if (!window.YG_GAME_ID) {
    document.title = `${g.title} — Ücretsiz Oyna | YÖRÜKHAN GAMES`;
    // Statik sayfası olan oyunlarda arama motoruna asıl adresi bildir (çift içerik olmasın)
    const st = STATIC_SLUGS[g.id];
    if (st) { const c = document.createElement('link'); c.rel = 'canonical'; c.href = `${location.origin}/g/${st}`; document.head.appendChild(c); }
  }
  $('meta[name="description"]')?.setAttribute('content', (g.description || g.title).slice(0, 155));
  $('meta[property="og:title"]')?.setAttribute('content', g.title + ' — YÖRÜKHAN GAMES');
  if (g.thumb_url) $('meta[property="og:image"]')?.setAttribute('content', g.thumb_url);

  $('#g-title').textContent = g.title;
  $('#g-sub').innerHTML = `${g.is_official ? '<span class="pill pill-orig">◆ Yörükhan Orijinal</span>' : ''}
    <a class="pill" href="/?kategori=${esc(g.category)}">${cat.icon} ${esc(cat.name)}</a>
    <span>▶ <b>${fmtNum(g.plays)}</b> oynanma</span><span>❤ <b id="like-n2">${fmtNum(g.likes)}</b> beğeni</span>
    ${g.status !== 'approved' ? `<span class="status status-${g.status}">${g.status === 'pending' ? 'Onay bekliyor — sadece sen görüyorsun' : 'Reddedildi'}</span>` : ''}`;
  $('#g-desc').textContent = g.description || 'Açıklama eklenmemiş.';
  if (g.controls) { $('#controls-box').classList.remove('hidden'); $('#g-controls').textContent = g.controls; }
  $('#g-cover').innerHTML = imgHTML(g);
  $('#meta').innerHTML = [
    ['Yapımcı', g.owner_id ? `<a href="/profil.html?u=${encodeURIComponent(dev)}">${esc(dev)}</a>` : '<a href="/?liste=orijinal">Yörükhan</a>'],
    ['Kategori', `<a href="/?kategori=${esc(g.category)}">${esc(cat.name)}</a>`],
    ['Yayın tarihi', fmtDate(g.approved_at || g.created_at)],
    ['Platform', g.mobile_friendly ? '💻 Bilgisayar · 📱 Telefon' : '💻 Bilgisayar'],
    ['Fiyat', 'Ücretsiz'],
  ].map(([k, v]) => `<div class="meta-row"><span>${k}</span><span>${v}</span></div>`).join('');
  $('#like-n').textContent = fmtNum(g.likes);

  // Oynat ekranı
  const bg = g.banner_url || g.thumb_url;
  const touch = matchMedia('(pointer:coarse)').matches;
  player.innerHTML = `<div class="player-cover" id="cover">${bg ? `<img class="bg" src="${esc(bg)}" alt="">` : ''}
    <div class="inner"><div class="big-play">${PLAY_ICON}</div><div class="lbl">OYNA</div>
    ${!g.mobile_friendly && touch ? '<div class="warn">⚠️ Bu oyun klavye/fare ile oynanır</div>' : ''}</div></div>`;
  let started = false;
  async function play(fromUser = true) {
    if (started) return; started = true;
    if (g.status === 'approved') sb.rpc('yg_add_play', { gid: g.id }).then(() => {});
    if (fromUser && matchMedia('(max-width: 760px)').matches) toggleFullscreen(player);
    await startGame(player, g);
  }
  $('#cover').onclick = () => play();
  $('#play-btn').onclick = () => { player.scrollIntoView({ behavior: 'smooth', block: 'center' }); play(); };
  $('#restart-btn').onclick = () => { started = false; play(false); };
  $('#fs-btn').onclick = () => { toggleFullscreen(player); if (!started) play(false); };
  if (autoplay && !touch) play(false);

  const share = async () => {
    const url = location.origin + gameUrl(g), text = `${g.title} oyununu YÖRÜKHAN GAMES'te ücretsiz oyna!`;
    if (navigator.share) { try { await navigator.share({ title: g.title, text, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast('Bağlantı kopyalandı!'); } catch { prompt('Bağlantıyı kopyala:', url); }
  };
  $('#share-btn').onclick = share; $('#share-btn2').onclick = share;

  // Beğeni
  const me = await getMe();
  let liked = false, likes = g.likes;
  if (me.user) {
    const { data } = await sb.from('yg_likes').select('game_id').eq('game_id', g.id).eq('user_id', me.user.id).maybeSingle();
    liked = !!data;
  }
  const likeBtn = $('#like-btn');
  const paint = () => { likeBtn.classList.toggle('liked', liked); $('#like-n').textContent = fmtNum(likes); const l2 = $('#like-n2'); if (l2) l2.textContent = fmtNum(likes); };
  paint();
  likeBtn.onclick = async () => {
    if (!me.user) { toast('Beğenmek için giriş yap'); setTimeout(() => location.href = '/giris.html?next=' + encodeURIComponent(location.pathname), 900); return; }
    likeBtn.disabled = true;
    if (liked) { const { error } = await sb.from('yg_likes').delete().eq('game_id', g.id).eq('user_id', me.user.id); if (!error) { liked = false; likes = Math.max(0, likes - 1); } }
    else { const { error } = await sb.from('yg_likes').insert({ game_id: g.id, user_id: me.user.id }); if (!error) { liked = true; likes++; toast('Beğendin ❤'); } }
    paint(); likeBtn.disabled = false;
  };

  $('#report-btn').onclick = () => {
    const m = openModal(`<h3>🚩 Sorun bildir</h3>
      <p class="muted" style="margin-top:0">Oyun çalışmıyor mu, uygunsuz bir şey mi var? Bize bildir.</p>
      <div class="field"><select id="rep-type" class="input"><option>Oyun çalışmıyor</option><option>Uygunsuz / zararlı içerik</option><option>Bu oyun bana ait (telif)</option><option>Spam / reklam</option><option>Diğer</option></select></div>
      <div class="field"><textarea id="rep-text" class="textarea" maxlength="400" placeholder="Kısaca açıkla (isteğe bağlı)"></textarea></div>
      <div class="modal-actions"><button class="btn" data-close>Vazgeç</button><button class="btn btn-white" id="rep-send">Gönder</button></div>`);
    $('#rep-send', m.el).onclick = async () => {
      const reason = ($('#rep-type', m.el).value + ': ' + $('#rep-text', m.el).value.trim()).slice(0, 500);
      const { error } = await sb.from('yg_reports').insert({ game_id: g.id, reason });
      m.close(); toast(error ? 'Gönderilemedi, tekrar dene.' : 'Teşekkürler, inceleyeceğiz.');
    };
  };

  // Benzer oyunlar
  const { data: all } = await sb.from('yg_games').select(GAME_SELECT).eq('status', 'approved').neq('id', g.id).order('plays', { ascending: false }).limit(40);
  const rel = [...(all || []).filter(x => x.category === g.category), ...(all || []).filter(x => x.category !== g.category)].slice(0, 12);
  if (rel.length) {
    $('#related-sec').innerHTML = `<div class="sec-head"><h2>Bunları da sevebilirsin</h2></div><div class="grid">${rel.map(gameCard).join('')}</div>`;
  }
}
main();
