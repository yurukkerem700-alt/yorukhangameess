import { sb, $, esc, fmtNum, gameCard, skeletonCards, GAME_SELECT } from './common.js';

const name = decodeURIComponent(new URLSearchParams(location.search).get('u') || location.pathname.split('/').filter(Boolean)[1] || '').toLowerCase();

async function main() {
  $('#p-games').innerHTML = skeletonCards(4);
  const { data: p } = await sb.from('yg_profiles').select('*').eq('username', name).maybeSingle();
  if (!p) {
    $('#p-name').textContent = 'Geliştirici bulunamadı';
    $('#p-games').innerHTML = '<div class="empty" style="grid-column:1/-1"><a class="btn" href="/">Ana sayfaya dön</a></div>';
    return;
  }
  document.title = `${p.username} oyunları | YÖRÜKHAN GAMES`;
  $('#p-av').textContent = p.username[0];
  $('#p-name').textContent = p.username;
  $('#p-bio').textContent = p.bio || '';
  const { data: games } = await sb.from('yg_games').select(GAME_SELECT).eq('owner_id', p.id).eq('status', 'approved').order('plays', { ascending: false });
  const plays = (games || []).reduce((a, g) => a + g.plays, 0);
  $('#p-meta').textContent = `${games?.length || 0} oyun · ${fmtNum(plays)} oynanma · ${new Date(p.created_at).getFullYear()}'den beri üye`;
  $('#p-games').innerHTML = games?.length ? games.map(gameCard).join('') : '<div class="empty" style="grid-column:1/-1"><p>Henüz yayında oyunu yok.</p></div>';
}
main();
