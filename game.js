import { sb, $, $$, esc, fmtNum, fmtDate, catById, imgHTML, gameCard, GAME_SELECT, getMe, toast, openModal, devName, gameUrl, PLAY_ICON, t, localizeGame, localizeGames } from './common.js';
import { startGame, toggleFullscreen } from './player.js';

const id = new URLSearchParams(location.search).get('id') || location.pathname.split('/').filter(Boolean)[1];
const autoplay = new URLSearchParams(location.search).get('oyna') !== null;
const player = $('#player');

function notFound() {
  document.title = t('Oyun bulunamadı', 'Game not found') + ' | YÖRÜKHAN GAMES';
  $('#game-root').innerHTML = `<div class="empty" style="margin-top:30px"><div class="big">🕳️</div><h3>${t('Oyun bulunamadı', 'Game not found')}</h3><p>${t('Bu oyun kaldırılmış ya da henüz yayınlanmamış olabilir.', 'This game may have been removed or not published yet.')}</p><a class="btn btn-white" href="/" style="margin-top:12px">${t('Keşfet\'e dön', 'Back to Discover')}</a></div>`;
}

async function main() {
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return notFound();
  const { data: g, error } = await sb.from('yg_games').select(GAME_SELECT).eq('id', id).maybeSingle();
  if (error || !g) return notFound();
  localizeGame(g);
  const cat = catById(g.category), dev = devName(g);

  document.title = `${g.title} — ${t('Ücretsiz Oyna', 'Play Free')} | YÖRÜKHAN GAMES`;
  $('meta[name="description"]')?.setAttribute('content', (g.description || g.title).slice(0, 155));
  $('meta[property="og:title"]')?.setAttribute('content', g.title + ' — YÖRÜKHAN GAMES');
  if (g.thumb_url) $('meta[property="og:image"]')?.setAttribute('content', g.thumb_url);

  $('#g-title').textContent = g.title;
  $('#g-sub').innerHTML = `${g.is_official ? `<span class="pill pill-orig">◆ ${t('Yörükhan Orijinal', 'Yörükhan Original')}</span>` : ''}
    <a class="pill" href="/?kategori=${esc(g.category)}">${cat.icon} ${esc(cat.name)}</a>
    <span>▶ <b>${fmtNum(g.plays)}</b> ${t('oynanma', 'plays')}</span><span>❤ <b id="like-n2">${fmtNum(g.likes)}</b> ${t('beğeni', 'likes')}</span>
    ${g.status !== 'approved' ? `<span class="status status-${g.status}">${g.status === 'pending' ? t('Onay bekliyor — sadece sen görüyorsun', 'Awaiting approval — only you can see it') : t('Reddedildi', 'Rejected')}</span>` : ''}`;
  $('#g-desc').textContent = g.description || t('Açıklama eklenmemiş.', 'No description added.');
  if (g.controls) { $('#controls-box').classList.remove('hidden'); $('#g-controls').textContent = g.controls; }
  $('#g-cover').innerHTML = imgHTML(g);
  $('#meta').innerHTML = [
    [t('Yapımcı', 'Developer'), g.owner_id ? `<a href="/profil.html?u=${encodeURIComponent(dev)}">${esc(dev)}</a>` : '<a href="/?liste=orijinal">Yörükhan</a>'],
    [t('Kategori', 'Category'), `<a href="/?kategori=${esc(g.category)}">${esc(cat.name)}</a>`],
    [t('Yayın tarihi', 'Released'), fmtDate(g.approved_at || g.created_at)],
    [t('Platform', 'Platform'), g.mobile_friendly ? t('💻 Bilgisayar · 📱 Telefon', '💻 Computer · 📱 Phone') : t('💻 Bilgisayar', '💻 Computer')],
    [t('Fiyat', 'Price'), t('Ücretsiz', 'Free')],
  ].map(([k, v]) => `<div class="meta-row"><span>${k}</span><span>${v}</span></div>`).join('');
  $('#like-n').textContent = fmtNum(g.likes);

  // Oynat ekranı
  const bg = g.banner_url || g.thumb_url;
  const touch = matchMedia('(pointer:coarse)').matches;
  player.innerHTML = `<div class="player-cover" id="cover">${bg ? `<img class="bg" src="${esc(bg)}" alt="">` : ''}
    <div class="inner"><div class="big-play">${PLAY_ICON}</div><div class="lbl">${t('OYNA', 'PLAY')}</div>
    ${!g.mobile_friendly && touch ? `<div class="warn">⚠️ ${t('Bu oyun klavye/fare ile oynanır', 'This game is played with keyboard/mouse')}</div>` : ''}</div></div>`;
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
    const url = location.origin + gameUrl(g), text = t(`${g.title} oyununu YÖRÜKHAN GAMES'te ücretsiz oyna!`, `Play ${g.title} for free on YÖRÜKHAN GAMES!`);
    if (navigator.share) { try { await navigator.share({ title: g.title, text, url }); } catch {} return; }
    try { await navigator.clipboard.writeText(url); toast(t('Bağlantı kopyalandı!', 'Link copied!')); } catch { prompt(t('Bağlantıyı kopyala:', 'Copy the link:'), url); }
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
    if (!me.user) { toast(t('Beğenmek için giriş yap', 'Sign in to like games')); setTimeout(() => location.href = '/giris.html?next=' + encodeURIComponent(location.pathname), 900); return; }
    likeBtn.disabled = true;
    if (liked) { const { error } = await sb.from('yg_likes').delete().eq('game_id', g.id).eq('user_id', me.user.id); if (!error) { liked = false; likes = Math.max(0, likes - 1); } }
    else { const { error } = await sb.from('yg_likes').insert({ game_id: g.id, user_id: me.user.id }); if (!error) { liked = true; likes++; toast(t('Beğendin ❤', 'Liked ❤')); } }
    paint(); likeBtn.disabled = false;
  };

  $('#report-btn').onclick = () => {
    // Şikayet nedeni veritabanına Türkçe kaydedilir (yönetim paneli için), seçenek yazısı dile göre gösterilir
    const types = [['Oyun çalışmıyor', 'The game does not work'], ['Uygunsuz / zararlı içerik', 'Inappropriate / harmful content'], ['Bu oyun bana ait (telif)', 'This game is mine (copyright)'], ['Spam / reklam', 'Spam / advertising'], ['Diğer', 'Other']];
    const m = openModal(`<h3>🚩 ${t('Sorun bildir', 'Report a problem')}</h3>
      <p class="muted" style="margin-top:0">${t('Oyun çalışmıyor mu, uygunsuz bir şey mi var? Bize bildir.', 'Game not working, or something inappropriate? Let us know.')}</p>
      <div class="field"><select id="rep-type" class="input">${types.map(([tr, en]) => `<option value="${tr}">${t(tr, en)}</option>`).join('')}</select></div>
      <div class="field"><textarea id="rep-text" class="textarea" maxlength="400" placeholder="${t('Kısaca açıkla (isteğe bağlı)', 'Briefly explain (optional)')}"></textarea></div>
      <div class="modal-actions"><button class="btn" data-close>${t('Vazgeç', 'Cancel')}</button><button class="btn btn-white" id="rep-send">${t('Gönder', 'Send')}</button></div>`);
    $('#rep-send', m.el).onclick = async () => {
      const reason = ($('#rep-type', m.el).value + ': ' + $('#rep-text', m.el).value.trim()).slice(0, 500);
      const { error } = await sb.from('yg_reports').insert({ game_id: g.id, reason });
      m.close(); toast(error ? t('Gönderilemedi, tekrar dene.', 'Could not send, please try again.') : t('Teşekkürler, inceleyeceğiz.', "Thanks, we'll look into it."));
    };
  };

  // Benzer oyunlar
  const { data: all } = await sb.from('yg_games').select(GAME_SELECT).eq('status', 'approved').neq('id', g.id).order('plays', { ascending: false }).limit(40);
  localizeGames(all);
  const rel = [...(all || []).filter(x => x.category === g.category), ...(all || []).filter(x => x.category !== g.category)].slice(0, 12);
  if (rel.length) {
    $('#related-sec').innerHTML = `<div class="sec-head"><h2>${t('Bunları da sevebilirsin', 'You may also like')}</h2></div><div class="grid">${rel.map(gameCard).join('')}</div>`;
  }
}
main();
