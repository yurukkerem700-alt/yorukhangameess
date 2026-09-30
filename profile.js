import { sb, $, esc, fmtNum, gameCard, skeletonCards, GAME_SELECT, t, localizeGames } from './common.js';

const name = decodeURIComponent(new URLSearchParams(location.search).get('u') || location.pathname.split('/').filter(Boolean)[1] || '').toLowerCase();

async function main() {
  $('#p-games').innerHTML = skeletonCards(4);
  const { data: p } = await sb.from('yg_profiles').select('*').eq('username', name).maybeSingle();
  if (!p) {
    $('#p-name').textContent = t('Geliştirici bulunamadı', 'Developer not found');
    $('#p-games').innerHTML = `<div class="empty" style="grid-column:1/-1"><a class="btn" href="/">${t('Ana sayfaya dön', 'Back to home')}</a></div>`;
    return;
  }
  document.title = t(`${p.username} oyunları`, `${p.username}'s games`) + ' | YÖRÜKHAN GAMES';
  $('#p-av').textContent = p.username[0];
  $('#p-name').textContent = p.username;
  $('#p-bio').textContent = p.bio || '';
  const { data: games } = await sb.from('yg_games').select(GAME_SELECT).eq('owner_id', p.id).eq('status', 'approved').order('plays', { ascending: false });
  localizeGames(games);
  const plays = (games || []).reduce((a, g) => a + g.plays, 0);
  const n = games?.length || 0, yr = new Date(p.created_at).getFullYear();
  $('#p-meta').textContent = t(`${n} oyun · ${fmtNum(plays)} oynanma · ${yr}'den beri üye`, `${n} game${n === 1 ? '' : 's'} · ${fmtNum(plays)} plays · member since ${yr}`);
  $('#p-games').innerHTML = games?.length ? games.map(gameCard).join('') : `<div class="empty" style="grid-column:1/-1"><p>${t('Henüz yayında oyunu yok.', 'No published games yet.')}</p></div>`;
}
main();
