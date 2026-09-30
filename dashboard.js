import { sb, $, esc, fmtNum, timeAgo, thumbHTML, GAME_SELECT, requireLogin, toast, gameUrl, t } from './common.js';

const STATUS = {
  pending: ['status-pending', t('⏳ İncelemede', '⏳ In review')],
  approved: ['status-approved', t('✓ Yayında', '✓ Live')],
  rejected: ['status-rejected', t('✕ Reddedildi', '✕ Rejected')],
};

async function main() {
  const me = await requireLogin();
  if (!me) return;
  $('#p-user').value = me.profile?.username || '';
  $('#p-bio').value = me.profile?.bio || '';

  const { data: games, error } = await sb.from('yg_games').select(GAME_SELECT).eq('owner_id', me.user.id).order('created_at', { ascending: false });
  if (error) { $('#my-games').innerHTML = `<div class="alert alert-error">${esc(error.message)}</div>`; return; }

  const sum = k => games.reduce((a, g) => a + (g[k] || 0), 0);
  $('#stats').innerHTML = [
    [games.length, t('Oyun', 'Games')], [games.filter(g => g.status === 'approved').length, t('Yayında', 'Live')],
    [fmtNum(sum('plays')), t('Toplam oynanma', 'Total plays')], [fmtNum(sum('likes')), t('Toplam beğeni', 'Total likes')],
  ].map(([n, l]) => `<div class="stat-card"><div class="n">${n}</div><div class="l">${l}</div></div>`).join('');

  if (!games.length) {
    $('#my-games').innerHTML = `<div class="empty"><div class="big">🕹️</div><h3>${t('Henüz oyun yüklemedin', "You haven't uploaded any games yet")}</h3><p>${t('İlk oyununu yükle, herkes oynasın.', 'Upload your first game and let everyone play.')}</p><a class="btn btn-primary" href="/yukle.html" style="margin-top:10px">${t('Oyun Yükle', 'Upload Game')}</a></div>`;
    return;
  }
  $('#my-games').innerHTML = games.map(g => {
    const [cls, label] = STATUS[g.status];
    return `<div class="list-item" data-id="${g.id}">
      <a class="thumb" href="${gameUrl(g)}">${thumbHTML(g)}</a>
      <div>
        <h4><a href="${gameUrl(g)}">${esc(g.title)}</a></h4>
        <div class="meta"><span class="status ${cls}">${label}</span> · ▶ ${fmtNum(g.plays)} · ❤ ${fmtNum(g.likes)} · ${timeAgo(g.created_at)}</div>
        ${g.status === 'rejected' && g.reject_reason ? `<div class="meta" style="color:#ff9296;margin-top:4px">${t('Neden', 'Reason')}: ${esc(g.reject_reason)}</div>` : ''}
      </div>
      <div class="list-actions">
        <a class="btn btn-sm" href="${gameUrl(g)}">${g.status === 'approved' ? t('Aç', 'Open') : t('Önizle', 'Preview')}</a>
        <button class="btn btn-sm btn-danger" data-del="${g.id}">${t('Sil', 'Delete')}</button>
      </div>
    </div>`;
  }).join('');

  $('#my-games').addEventListener('click', async e => {
    const id = e.target.dataset?.del;
    if (!id) return;
    const g = games.find(x => x.id === id);
    if (!confirm(t(`"${g.title}" silinsin mi? Bu geri alınamaz.`, `Delete "${g.title}"? This cannot be undone.`))) return;
    const { error } = await sb.from('yg_games').delete().eq('id', id);
    if (error) return toast(t('Silinemedi: ', 'Could not delete: ') + error.message);
    const files = [];
    if (g.file_path) files.push(sb.storage.from('yg-games').remove([g.file_path]));
    const tp = g.thumb_url?.split('/yg-thumbs/')[1];
    if (tp) files.push(sb.storage.from('yg-thumbs').remove([decodeURIComponent(tp)]));
    await Promise.allSettled(files);
    e.target.closest('.list-item').remove();
    toast(t('Oyun silindi', 'Game deleted'));
  });

  $('#p-save').onclick = async () => {
    const username = $('#p-user').value.trim().toLowerCase();
    const m = $('#p-msg');
    const show = (t, ok) => { m.className = 'alert ' + (ok ? 'alert-ok' : 'alert-error'); m.textContent = t; };
    if (!/^[a-z0-9_]{3,20}$/.test(username)) return show(t('Kullanıcı adı 3-20 karakter olmalı; harf, rakam ve _ kullanabilirsin.', 'Username must be 3-20 characters; you can use letters, numbers and _.'));
    const { error } = await sb.from('yg_profiles').update({ username, bio: $('#p-bio').value.trim() || null }).eq('id', me.user.id);
    if (error) return show(/duplicate|unique/i.test(error.message) ? t('Bu kullanıcı adı alınmış.', 'This username is taken.') : error.message);
    show(t('Kaydedildi!', 'Saved!'), true);
  };
}

main();
