import { sb, CONFIG, $, $$, esc, fmtNum, timeAgo, thumbHTML, GAME_SELECT, getMe, toast, openModal, gameUrl, devName, catById, resizeImage, t } from './common.js';
import { startGame } from './player.js';

let me, allGames = [];

async function main() {
  me = await getMe();
  if (!me.user) { location.href = '/giris.html?next=/admin.html'; return; }
  if (!me.isAdmin) { $('#no-access').classList.remove('hidden'); return; }
  $('#admin').classList.remove('hidden');
  $('#a-cat').innerHTML = CONFIG.CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${esc(c.name)}</option>`).join('');
  $$('#tabs .tab').forEach(t => t.onclick = () => showTab(t.dataset.tab));
  $$('#src-tabs .tab').forEach(t => t.onclick = () => {
    $$('#src-tabs .tab').forEach(x => x.classList.toggle('active', x === t));
    $('#src-file').classList.toggle('hidden', t.dataset.src !== 'file');
    $('#src-url').classList.toggle('hidden', t.dataset.src !== 'url');
  });
  $('#all-search').oninput = renderAll;
  await refresh();
}

function showTab(name) {
  $$('#tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  ['pending', 'all', 'reports', 'add'].forEach(n => $('#tab-' + n).classList.toggle('hidden', n !== name));
}

async function refresh() {
  const [{ data: games }, { data: reports }] = await Promise.all([
    sb.from('yg_games').select(GAME_SELECT).order('created_at', { ascending: false }).limit(1000),
    sb.from('yg_reports').select('*, yg_games(id,title)').eq('resolved', false).order('created_at', { ascending: false }).limit(200),
  ]);
  allGames = games || [];
  const pending = allGames.filter(g => g.status === 'pending');
  const plays = allGames.reduce((a, g) => a + g.plays, 0);
  $('#stats').innerHTML = [
    [allGames.filter(g => g.status === 'approved').length, t('Yayındaki oyun', 'Live games')], [pending.length, t('Onay bekleyen', 'Pending approval')],
    [fmtNum(plays), t('Toplam oynanma', 'Total plays')], [(reports || []).length, t('Açık şikayet', 'Open reports')],
  ].map(([n, l]) => `<div class="stat-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');
  $('#pending-n').textContent = pending.length ? `(${pending.length})` : '';
  $('#reports-n').textContent = reports?.length ? `(${reports.length})` : '';

  $('#tab-pending').innerHTML = pending.length ? pending.map(g => row(g, true)).join('')
    : `<div class="empty"><div class="big">✅</div><h3>${t('Bekleyen oyun yok', 'No pending games')}</h3></div>`;
  renderAll();

  $('#tab-reports').innerHTML = reports?.length ? reports.map(r => `<div class="list-item" style="grid-template-columns:1fr auto">
      <div><h4>${r.yg_games ? `<a href="/oyun.html?id=${r.game_id}" target="_blank">${esc(r.yg_games.title)}</a>` : t('Silinmiş oyun', 'Deleted game')}</h4>
      <div class="meta">${esc(r.reason)} · ${timeAgo(r.created_at)}</div></div>
      <div class="list-actions"><button class="btn btn-sm" data-act="resolve" data-rid="${r.id}">${t('Çözüldü', 'Resolved')}</button></div>
    </div>`).join('') : `<div class="empty"><div class="big">🕊️</div><h3>${t('Şikayet yok', 'No reports')}</h3></div>`;
}

function row(g, isPending) {
  const st = { pending: `<span class="status status-pending">${t('Bekliyor', 'Pending')}</span>`, approved: `<span class="status status-approved">${t('Yayında', 'Live')}</span>`, rejected: `<span class="status status-rejected">${t('Reddedildi', 'Rejected')}</span>` }[g.status];
  return `<div class="list-item" data-id="${g.id}">
    <div class="thumb">${thumbHTML(g)}</div>
    <div>
      <h4>${g.is_official ? '👑 ' : ''}${g.featured ? '🔥 ' : ''}${esc(g.title)}</h4>
      <div class="meta">${st} · ${esc(devName(g))} · ${catById(g.category).name} · ▶ ${fmtNum(g.plays)} · ${timeAgo(g.created_at)}</div>
      ${isPending && g.description ? `<div class="meta" style="margin-top:4px">${esc(g.description.slice(0, 160))}</div>` : ''}
    </div>
    <div class="list-actions">
      <button class="btn btn-sm" data-act="preview">▶ ${t('Dene', 'Try')}</button>
      ${g.status !== 'approved' ? `<button class="btn btn-sm btn-success" data-act="approve">${t('Onayla', 'Approve')}</button>` : ''}
      ${g.status === 'pending' ? `<button class="btn btn-sm btn-danger" data-act="reject">${t('Reddet', 'Reject')}</button>` : ''}
      ${g.status === 'approved' ? `<button class="btn btn-sm" data-act="feature">${g.featured ? t('Vitrinden çıkar', 'Unfeature') : t('🔥 Vitrine koy', '🔥 Feature')}</button>
         <button class="btn btn-sm" data-act="unpublish">${t('Yayından kaldır', 'Unpublish')}</button>` : ''}
      <button class="btn btn-sm btn-danger" data-act="delete">${t('Sil', 'Delete')}</button>
    </div>
  </div>`;
}

function renderAll() {
  const q = $('#all-search').value.trim().toLocaleLowerCase('tr');
  const list = allGames.filter(g => !q || g.title.toLocaleLowerCase('tr').includes(q) || devName(g).includes(q));
  $('#all-list').innerHTML = list.length ? list.map(g => row(g, false)).join('') : `<div class="empty">${t('Oyun yok', 'No games')}</div>`;
}

async function update(id, patch, okMsg) {
  const { error } = await sb.from('yg_games').update(patch).eq('id', id);
  if (error) return toast(t('Hata: ', 'Error: ') + error.message);
  toast(okMsg);
  await refresh();
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'resolve') {
    await sb.from('yg_reports').update({ resolved: true }).eq('id', b.dataset.rid);
    toast(t('Şikayet kapatıldı', 'Report closed')); return refresh();
  }
  const id = b.closest('[data-id]')?.dataset.id;
  const g = allGames.find(x => x.id === id);
  if (!g) return;
  if (act === 'preview') {
    const m = openModal(`<h3>${esc(g.title)}</h3><div class="player" id="adm-player"></div>
      <p class="muted" style="font-size:14px;white-space:pre-wrap">${esc(g.description)}</p>
      <div class="modal-actions"><a class="btn" href="${gameUrl(g)}" target="_blank">${t('Sayfasını aç', 'Open its page')}</a><button class="btn" data-close>${t('Kapat', 'Close')}</button></div>`, { wide: true });
    startGame($('#adm-player', m.el), g, { preview: true });
  }
  if (act === 'approve') update(id, { status: 'approved', approved_at: g.approved_at || new Date().toISOString(), reject_reason: null }, t('Onaylandı, artık yayında 🎉', 'Approved, now live 🎉'));
  if (act === 'reject') {
    const reason = prompt(t('Reddetme nedeni (geliştirici görecek):', 'Reason for rejection (the developer will see it):'), t('Oyun açılmıyor / eksik dosya', 'The game does not open / missing file'));
    if (reason === null) return;
    update(id, { status: 'rejected', reject_reason: reason.slice(0, 300) }, t('Reddedildi', 'Rejected'));
  }
  if (act === 'feature') update(id, { featured: !g.featured }, g.featured ? t('Vitrinden çıkarıldı', 'Removed from featured') : t('Vitrine kondu 🔥', 'Featured 🔥'));
  if (act === 'unpublish') update(id, { status: 'pending' }, t('Yayından kaldırıldı', 'Unpublished'));
  if (act === 'delete') {
    if (!confirm(t(`"${g.title}" tamamen silinsin mi?`, `Delete "${g.title}" completely?`))) return;
    const { error } = await sb.from('yg_games').delete().eq('id', id);
    if (error) return toast(t('Hata: ', 'Error: ') + error.message);
    const rm = [];
    if (g.file_path) rm.push(sb.storage.from('yg-games').remove([g.file_path]));
    const tp = g.thumb_url?.split('/yg-thumbs/')[1];
    if (tp) rm.push(sb.storage.from('yg-thumbs').remove([decodeURIComponent(tp)]));
    await Promise.allSettled(rm);
    toast(t('Silindi', 'Deleted')); refresh();
  }
});

// Kendi (resmi) oyununu ekle
$('#tab-add').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = (t, ok) => { const m = $('#add-msg'); m.className = 'alert ' + (ok ? 'alert-ok' : 'alert-error'); m.textContent = t; };
  const title = $('#a-title').value.trim();
  if (title.length < 2) return msg(t('Oyunun adını yaz.', 'Enter the game title.'));
  const isUrl = !$('#src-url').classList.contains('hidden');
  const key = crypto.randomUUID();
  const btn = e.submitter; btn.disabled = true;
  try {
    const row = {
      owner_id: me.user.id, title, category: $('#a-cat').value,
      description: $('#a-desc').value.trim(), controls: $('#a-controls').value.trim(),
      mobile_friendly: $('#a-mobile').checked, status: 'approved', approved_at: new Date().toISOString(),
      is_official: true, featured: $('#a-featured').checked,
    };
    if (isUrl) {
      const url = $('#a-url').value.trim();
      if (!/^https:\/\//i.test(url)) throw new Error(t('Adres https:// ile başlamalı.', 'The address must start with https://.'));
      Object.assign(row, { source_type: 'url', game_url: url });
    } else {
      const f = $('#a-file').files[0];
      if (!f) throw new Error(t('.html dosyasını seç.', 'Choose the .html file.'));
      const path = `${me.user.id}/${key}.html`;
      const { error } = await sb.storage.from('yg-games').upload(path, new Blob([await f.text()], { type: 'text/html' }), { contentType: 'text/html' });
      if (error) throw error;
      Object.assign(row, { source_type: 'file', file_path: path });
    }
    const tf = $('#a-thumb').files[0];
    if (tf) {
      const blob = await resizeImage(tf, 800, 500);
      const tpath = `${me.user.id}/${key}.${blob.type === 'image/webp' ? 'webp' : 'jpg'}`;
      const { error } = await sb.storage.from('yg-thumbs').upload(tpath, blob, { contentType: blob.type });
      if (error) throw error;
      row.thumb_url = sb.storage.from('yg-thumbs').getPublicUrl(tpath).data.publicUrl;
    }
    const { error } = await sb.from('yg_games').insert(row);
    if (error) throw error;
    msg(t('Yayınlandı! 👑', 'Published! 👑'), true);
    $('#tab-add').reset();
    await refresh();
  } catch (err) {
    msg(t('Olmadı: ', 'Failed: ') + (err.message || err));
  } finally {
    btn.disabled = false;
  }
});

main();
