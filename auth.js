import { sb, $, $$, t, LANG } from './common.js';

const params = new URLSearchParams(location.search);
const next = (params.get('next') || '/').startsWith('/') ? (params.get('next') || '/') : '/';

function msg(text, type = 'error') {
  const m = $('#msg');
  m.className = 'alert alert-' + type;
  m.textContent = text;
  m.classList.toggle('hidden', !text);
}

function tab(name) {
  $$('#tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $('#login-form').classList.toggle('hidden', name !== 'login');
  $('#signup-form').classList.toggle('hidden', name !== 'signup');
  $('#reset-form').classList.toggle('hidden', name !== 'reset');
  $('#tabs').classList.toggle('hidden', name === 'reset');
  msg('');
}
$$('#tabs .tab').forEach(t => t.onclick = () => tab(t.dataset.tab));
if (params.get('kayit') !== null) tab('signup');

const TR_ERR = {
  'Invalid login credentials': 'E-posta veya şifre hatalı.',
  'Email not confirmed': 'E-postanı henüz onaylamadın. Gelen kutuna (ve spam klasörüne) bak.',
  'User already registered': 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.',
  'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
};
const EN_ERR = {
  'Invalid login credentials': 'Wrong email or password.',
  'Email not confirmed': "You haven't confirmed your email yet. Check your inbox (and spam folder).",
  'User already registered': 'An account with this email already exists. Try signing in.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
};
const trErr = e => (LANG === 'en' ? EN_ERR : TR_ERR)[e?.message] || (/rate limit/i.test(e?.message) ? t('Çok fazla deneme yapıldı, biraz bekleyip tekrar dene.', 'Too many attempts, wait a bit and try again.') : e?.message || t('Bir hata oluştu.', 'Something went wrong.'));

$('#login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.submitter; btn.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email: $('#l-email').value.trim(), password: $('#l-pass').value });
  btn.disabled = false;
  if (error) return msg(trErr(error));
  location.href = next;
});

$('#signup-form').addEventListener('submit', async e => {
  e.preventDefault();
  const username = $('#s-user').value.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return msg(t('Kullanıcı adı 3-20 karakter olmalı; sadece harf (Türkçe karakter olmadan), rakam ve _ kullanabilirsin.', 'Username must be 3-20 characters; you can only use letters (no accented characters), numbers and _.'));
  const btn = e.submitter; btn.disabled = true;
  const { data: taken } = await sb.from('yg_profiles').select('id').eq('username', username).maybeSingle();
  if (taken) { btn.disabled = false; return msg(t('Bu kullanıcı adı alınmış, başka bir tane dene.', 'This username is taken, try another one.')); }
  const { data, error } = await sb.auth.signUp({
    email: $('#s-email').value.trim(),
    password: $('#s-pass').value,
    options: { data: { username }, emailRedirectTo: location.origin + '/giris.html?onay=1&next=' + encodeURIComponent(next) },
  });
  btn.disabled = false;
  if (error) return msg(trErr(error));
  if (data.session) { location.href = next; return; }
  msg(t('Neredeyse bitti! E-postana bir onay bağlantısı gönderdik. Bağlantıya tıkla, sonra giriş yap. (Spam klasörüne de bak.)', 'Almost done! We sent a confirmation link to your email. Click it, then sign in. (Check your spam folder too.)'), 'ok');
  $('#signup-form').reset();
});

$('#forgot').onclick = async e => {
  e.preventDefault();
  const email = $('#l-email').value.trim();
  if (!email) return msg(t('Önce e-posta adresini yaz, sonra "Şifremi unuttum"a bas.', 'Enter your email address first, then press "Forgot password".'));
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/giris.html?sifre=1' });
  msg(error ? trErr(error) : t('Şifre sıfırlama bağlantısı e-postana gönderildi.', 'A password reset link has been sent to your email.'), error ? 'error' : 'ok');
};

$('#reset-form').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await sb.auth.updateUser({ password: $('#r-pass').value });
  if (error) return msg(trErr(error));
  msg(t('Şifren güncellendi! Yönlendiriliyorsun…', 'Your password has been updated! Redirecting…'), 'ok');
  setTimeout(() => location.href = '/', 1200);
});

sb.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') tab('reset');
});

(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (params.get('sifre') !== null && session) return tab('reset');
  if (session && params.get('onay') !== null) { location.href = next; return; }
  if (params.get('onay') !== null) msg(t('E-postan onaylandı! Şimdi giriş yapabilirsin.', 'Your email is confirmed! You can sign in now.'), 'ok');
})();
