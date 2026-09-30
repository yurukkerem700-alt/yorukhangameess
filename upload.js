import { sb, CONFIG, $, esc, getMe, openModal, resizeImage, t } from './common.js';
import { startGame } from './player.js';

const form = $('#up-form');
let gameFile = null, gameHtml = null, thumbBlob = null;

$('#category').innerHTML = CONFIG.CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('');

function showErr(msg) {
  const e = $('#form-err');
  e.textContent = msg;
  e.classList.toggle('hidden', !msg);
  if (msg) e.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setupDrop(dropEl, input, onFile) {
  input.addEventListener('change', () => input.files[0] && onFile(input.files[0]));
  ['dragenter', 'dragover'].forEach(ev => dropEl.addEventListener(ev, e => { e.preventDefault(); dropEl.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev => dropEl.addEventListener(ev, e => { e.preventDefault(); dropEl.classList.remove('drag'); }));
  dropEl.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) onFile(f); });
}

// Oyun dosyası kontrolü
setupDrop($('#game-drop'), $('#game-file'), async f => {
  showErr('');
  $('#game-warn').classList.add('hidden');
  if (!/\.html?$/i.test(f.name)) return showErr(t('Oyun dosyası .html olmalı.', 'The game file must be .html.'));
  if (f.size > CONFIG.MAX_GAME_MB * 1024 * 1024) return showErr(t(`Dosya çok büyük (${(f.size / 1048576).toFixed(1)} MB). En fazla ${CONFIG.MAX_GAME_MB} MB.`, `The file is too large (${(f.size / 1048576).toFixed(1)} MB). Max ${CONFIG.MAX_GAME_MB} MB.`));
  const text = await f.text();
  if (!/<(html|body|script|canvas|div)[\s>]/i.test(text)) return showErr(t('Bu dosya bir HTML oyunu gibi görünmüyor.', "This file doesn't look like an HTML game."));
  gameFile = f; gameHtml = text;
  $('#game-name').textContent = `✓ ${f.name} (${(f.size / 1024).toFixed(0)} KB)`;
  $('#test-btn').classList.remove('hidden');
  if (!$('#title').value) $('#title').value = f.name.replace(/\.html?$/i, '').replace(/[_-]+/g, ' ').slice(0, 60);

  // Başka dosyalara bağlı mı? (tek dosya olmalı)
  const refs = new Set();
  const re = /(?:src|href)\s*=\s*["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(text))) {
    const u = m[1].trim();
    if (!/^(https?:|data:|blob:|\/\/|mailto:|javascript:|#)/i.test(u) && /\.(png|jpe?g|gif|webp|svg|mp3|ogg|wav|js|css|json|ttf|woff2?)$/i.test(u)) refs.add(u);
  }
  if (refs.size) {
    const list = [...refs].slice(0, 6).map(esc).join(', ');
    $('#game-warn').innerHTML = t(`⚠️ Oyunun başka dosyalara bağlı görünüyor: <b>${list}</b>${refs.size > 6 ? '…' : ''}. Bu dosyalar yüklenmeyeceği için oyunda eksik görünebilirler. <b>Yüklemeden önce dene</b> düğmesiyle kontrol et.`, `⚠️ Your game seems to depend on other files: <b>${list}</b>${refs.size > 6 ? '…' : ''}. These files won't be uploaded, so they may be missing in the game. Check with the <b>Try before uploading</b> button.`);
    $('#game-warn').classList.remove('hidden');
  }
});

// Kapak resmi: 800px genişliğe küçült, webp/jpeg yap
setupDrop($('#thumb-drop'), $('#thumb-file'), async f => {
  showErr('');
  if (!/^image\//.test(f.type)) return showErr(t('Kapak bir resim dosyası olmalı.', 'The cover must be an image file.'));
  if (f.size > 15 * 1024 * 1024) return showErr(t('Kapak resmi çok büyük.', 'The cover image is too large.'));
  try {
    thumbBlob = await resizeImage(f, 800, 500);
    const prev = $('#thumb-prev');
    prev.src = URL.createObjectURL(thumbBlob);
    prev.classList.remove('hidden');
  } catch { showErr(t('Resim okunamadı, başka bir resim dene.', 'Could not read the image, try another one.')); }
});

$('#test-btn').onclick = () => {
  const m = openModal(`<h3>${t('Önizleme', 'Preview')}: ${esc($('#title').value || gameFile.name)}</h3>
    <div class="player" id="prev-player"></div>
    <p class="dim" style="font-size:13px">${t('Oyun burada düzgün çalışıyorsa sitede de çalışacak.', 'If the game works properly here, it will work on the site too.')}</p>
    <div class="modal-actions"><button class="btn" data-close>${t('Kapat', 'Close')}</button></div>`, { wide: true });
  startGame($('#prev-player', m.el), { title: t('Önizleme', 'Preview'), source_type: 'file' }, { html: gameHtml, preview: true });
};

function progress(pct, text) {
  $('#prog').classList.remove('hidden');
  $('#prog > div').style.width = pct + '%';
  $('#prog-text').textContent = text;
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  showErr('');
  const me = await getMe();
  const title = $('#title').value.trim();
  if (title.length < 2) return showErr(t('Oyunun adını yaz.', 'Enter the game title.'));
  if (!gameFile) return showErr(t('Oyun dosyasını seç.', 'Choose the game file.'));
  if (!$('#rules').checked) return showErr(t('Devam etmek için koşulları kabul etmelisin.', 'You must accept the terms to continue.'));

  const btn = $('#submit-btn');
  btn.disabled = true;
  const uid = me.user.id;
  const key = crypto.randomUUID();
  let gamePath = null, thumbPath = null;

  try {
    progress(15, t('Oyun dosyası yükleniyor…', 'Uploading game file…'));
    gamePath = `${uid}/${key}.html`;
    const gameBlob = new Blob([gameHtml], { type: 'text/html' });
    const up1 = await sb.storage.from('yg-games').upload(gamePath, gameBlob, { contentType: 'text/html', upsert: false });
    if (up1.error) throw up1.error;

    let thumbUrl = null;
    if (thumbBlob) {
      progress(60, t('Kapak resmi yükleniyor…', 'Uploading cover image…'));
      const ext = thumbBlob.type === 'image/webp' ? 'webp' : 'jpg';
      thumbPath = `${uid}/${key}.${ext}`;
      const up2 = await sb.storage.from('yg-thumbs').upload(thumbPath, thumbBlob, { contentType: thumbBlob.type, upsert: false });
      if (up2.error) throw up2.error;
      thumbUrl = sb.storage.from('yg-thumbs').getPublicUrl(thumbPath).data.publicUrl;
    }

    progress(85, t('Kaydediliyor…', 'Saving…'));
    const { error } = await sb.from('yg_games').insert({
      owner_id: uid,
      title,
      description: $('#desc').value.trim(),
      category: $('#category').value,
      controls: $('#controls').value.trim(),
      mobile_friendly: $('#mobile').checked,
      source_type: 'file',
      file_path: gamePath,
      thumb_url: thumbUrl,
    });
    if (error) throw error;
    progress(100, t('Tamam!', 'Done!'));
    form.classList.add('hidden');
    $('#done').classList.remove('hidden');
    scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    // Yarım kalan dosyaları temizle
    const rm = [];
    if (gamePath) rm.push(sb.storage.from('yg-games').remove([gamePath]));
    if (thumbPath) rm.push(sb.storage.from('yg-thumbs').remove([thumbPath]));
    await Promise.allSettled(rm);
    btn.disabled = false;
    $('#prog').classList.add('hidden');
    $('#prog-text').textContent = '';
    showErr(t('Yükleme başarısız: ', 'Upload failed: ') + (err.message || err) + t('. Tekrar dene.', '. Please try again.'));
  }
});

(async () => {
  const me = await getMe();
  if (!me.user) { $('#need-login').classList.remove('hidden'); return; }
  form.classList.remove('hidden');
})();
