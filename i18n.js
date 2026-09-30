// Dil desteği (Türkçe / English)
// Seçim sırası: ?lang=tr|en, kayıtlı seçim (yg_lang), tarayıcı dili (Türkçe değilse English).
// Sayfalardaki sabit yazılar aşağıdaki sözlükle çevrilir; kodda üretilen yazılar T('Türkçe', 'English') ile yazılır.
// Karışık biçimli paragraflarda HTML'e data-en="..." eklenir; uzun sayfalarda data-lang="tr" / data-lang="en" blokları kullanılır.
(function () {
  var KEY = 'yg_lang', L = null, m = /[?&]lang=(tr|en)\b/.exec(location.search);
  if (m) { L = m[1]; try { localStorage.setItem(KEY, L); } catch (e) {} }
  if (!L) try { L = localStorage.getItem(KEY); } catch (e) {}
  if (L !== 'tr' && L !== 'en') L = /^tr\b/i.test(navigator.language || '') ? 'tr' : 'en';
  var root = document.documentElement;
  root.lang = L;
  window.YG_LANG = L;
  window.T = function (tr, en) { return L === 'en' ? en : tr; };
  window.setLang = function (l) { try { localStorage.setItem(KEY, l); } catch (e) {} var u = new URL(location.href); u.searchParams.delete('lang'); location.replace(u); };
  if (L === 'tr') return;

  var D = {
    // Menüler, üst çubuk, alt bilgi
    'Keşfet': 'Discover', 'Tüm Oyunlar': 'All Games', 'Popüler': 'Popular', 'Yeni Çıkanlar': 'New Releases',
    'Yörükhan Orijinal': 'Yörükhan Originals', 'Kategoriler': 'Categories', 'Hesabım': 'My Account', 'Oyunlarım': 'My Games',
    'Hakkında': 'About', 'Oyun mu yaptın?': 'Made a game?', 'Yükle, herkes oynasın. Ücretsiz.': 'Upload it and let everyone play. Free.',
    'Oyununu Yükle': 'Upload Your Game', 'Oyunlar': 'Games', 'Yükle': 'Upload', 'Ara': 'Search', 'Giriş': 'Sign in',
    'YÖRÜKHAN GAMES · Ücretsiz tarayıcı oyunları': 'YÖRÜKHAN GAMES · Free browser games',
    'Oyunların hakları kendi geliştiricilerine aittir.': 'All games belong to their respective developers.',
    'Tüm oyunlar': 'All games', 'Oyun yükle': 'Upload a game', 'Hakkında & İletişim': 'About & Contact',
    'Gizlilik': 'Privacy', 'Koşullar': 'Terms',
    'YÖRÜKHAN GAMES ana sayfa': 'YÖRÜKHAN GAMES home', 'Menü': 'Menu', 'Ana sayfa': 'Home', 'Oyun ara': 'Search games', 'Sırala': 'Sort',
    // Ana sayfa
    'YÖRÜKHAN GAMES — Ücretsiz Tarayıcı Oyunları': 'YÖRÜKHAN GAMES — Free Browser Games',
    'Ücretsiz tarayıcı oyunları oyna: aksiyon, arcade, bulmaca, nişancı ve daha fazlası. İndirme yok, üyelik yok. Kendi oyununu yükle, herkes oynasın!':
      'Play free browser games: action, arcade, puzzle, shooter and more. No downloads, no sign-up. Upload your own game for everyone to play!',
    'En çok oynanan': 'Most played', 'En yeni': 'Newest', 'En beğenilen': 'Most liked',
    // Oyun sayfası
    'Oyna | YÖRÜKHAN GAMES': 'Play | YÖRÜKHAN GAMES', 'Ücretsiz oyna — YÖRÜKHAN GAMES': 'Play free — YÖRÜKHAN GAMES',
    'Yükleniyor…': 'Loading…', 'Tam ekran': 'Fullscreen', 'Yeniden başlat': 'Restart', 'Paylaş': 'Share',
    'Oyun hakkında': 'About the game', 'Nasıl oynanır?': 'How to play', 'Ücretsiz': 'Free', 'İndirme gerekmez': 'No download needed',
    'ŞİMDİ OYNA': 'PLAY NOW', '🚩 Sorun bildir': '🚩 Report a problem',
    // Giriş
    'Giriş Yap | YÖRÜKHAN GAMES': 'Sign In | YÖRÜKHAN GAMES',
    'YÖRÜKHAN GAMES hesabına giriş yap veya ücretsiz kayıt ol.': 'Sign in to your YÖRÜKHAN GAMES account or sign up for free.',
    'Oyna, yükle,': 'Play, upload,', 'paylaş.': 'share.',
    'Hesabınla oyunları beğen, kendi oyunlarını yükle ve istatistiklerini takip et.': 'Like games, upload your own and track your stats with your account.',
    'Giriş yap': 'Sign in', 'Kayıt ol': 'Sign up', 'E-posta': 'Email', 'Şifre': 'Password', 'Şifremi unuttum': 'Forgot password',
    'Kullanıcı adı': 'Username', 'ör. kurt_avcisi': 'e.g. wolf_hunter',
    'Harf (Türkçe karakter olmadan), rakam ve _ · oyunlarının altında görünür': 'Letters (no accented characters), numbers and _ · shown under your games',
    'en az 6 karakter': 'at least 6 characters', 'Hesap oluştur': 'Create account',
    'Yeni şifre belirle': 'Set a new password', 'Yeni şifre': 'New password', 'Şifreyi kaydet': 'Save password',
    // Oyun yükle
    'Oyun Yükle | YÖRÜKHAN GAMES': 'Upload a Game | YÖRÜKHAN GAMES',
    "Kendi yaptığın HTML5 oyununu YÖRÜKHAN GAMES'e yükle, binlerce oyuncu oynasın. Ücretsiz.": 'Upload your own HTML5 game to YÖRÜKHAN GAMES and let thousands of players enjoy it. Free.',
    '🎮 Oyununu Yükle': '🎮 Upload Your Game',
    'Oyunun incelendikten sonra (genelde 24 saat içinde) sitede yayınlanır.': 'Your game is published on the site after review (usually within 24 hours).',
    'Oyun yüklemek için giriş yapmalısın': 'You need to sign in to upload a game',
    'Hesap açmak ücretsiz ve 30 saniye sürer.': 'Creating an account is free and takes 30 seconds.',
    'Giriş yap / Kayıt ol': 'Sign in / Sign up', 'Oyunun gönderildi!': 'Your game has been submitted!', 'Başka oyun yükle': 'Upload another game',
    'Oyunun adı *': 'Game title *', 'Örn: Börü: Son Kral': 'e.g. Börü: The Last King', 'Kategori *': 'Category *', 'Kategori': 'Category',
    'Telefonda da oynanabiliyor (dokunmatik kontrol var)': 'Also playable on phones (has touch controls)',
    'Açıklama': 'Description', 'Oyun ne hakkında? Amaç ne? Oyuncular neden sevsin?': 'What is the game about? What is the goal? Why will players love it?',
    'Kontroller': 'Controls', 'Örn: Ok tuşları ile hareket, Boşluk ile zıpla. Telefonda ekrana dokun.': 'e.g. Move with the arrow keys, jump with Space. Tap the screen on phones.',
    'Oyun dosyası (.html) *': 'Game file (.html) *', 'Dosyayı seç veya buraya sürükle': 'Choose a file or drag it here',
    'Sadece .html · en fazla 25 MB': 'Only .html · max 25 MB', '▶ Yüklemeden önce dene': '▶ Try before uploading',
    'Kapak resmi (önerilir)': 'Cover image (recommended)', 'Kapak resmi seç': 'Choose a cover image',
    'PNG / JPG / WEBP · yatay (16:10) en iyisi · otomatik küçültülür': 'PNG / JPG / WEBP · landscape (16:10) works best · resized automatically',
    'Kapak önizleme': 'Cover preview', 'Oyunu Gönder': 'Submit Game',
    // Oyunlarım
    'Oyunlarım | YÖRÜKHAN GAMES': 'My Games | YÖRÜKHAN GAMES', 'Yüklediğin oyunlar ve istatistiklerin.': 'Your uploaded games and stats.',
    '+ Yeni oyun yükle': '+ Upload new game', 'Profil': 'Profile',
    'Sadece harf (Türkçe karakter olmadan), rakam ve _ · 3-20 karakter': 'Only letters (no accented characters), numbers and _ · 3-20 characters',
    'Hakkımda': 'About me', 'Oyuncular seni tanısın (isteğe bağlı)': 'Let players get to know you (optional)', 'Kaydet': 'Save',
    // Geliştirici profili
    'Geliştirici | YÖRÜKHAN GAMES': 'Developer | YÖRÜKHAN GAMES', "Geliştiricinin YÖRÜKHAN GAMES'teki oyunları.": "The developer's games on YÖRÜKHAN GAMES.",
    'Oyunları': 'Games',
    // Yönetim
    'Yönetim Paneli | YÖRÜKHAN GAMES': 'Admin Panel | YÖRÜKHAN GAMES', 'Yönetim paneli': 'Admin panel',
    'Bu sayfa sadece yöneticiler için': 'This page is for admins only', '⚙️ Yönetim Paneli': '⚙️ Admin Panel',
    'Onay bekleyen': 'Pending approval', 'Şikayetler': 'Reports', '+ Kendi oyunum': '+ My own game', 'Oyun ara…': 'Search games…',
    'Kendi oyununu ekle (👑 Yörükhan oyunu olarak, direkt yayına girer)': 'Add your own game (as a 👑 Yörükhan game, published immediately)',
    'Mobil uyumlu': 'Mobile friendly', 'Oyun nerede?': 'Where is the game?', '.html dosyası yükle': 'Upload .html file',
    'Vercel adresi (link)': 'Vercel address (link)', "Oyunun zaten Vercel'de yayındaysa adresini yapıştır.": 'If the game is already live on Vercel, paste its address.',
    'Kapak resmi': 'Cover image', 'Ana sayfada vitrine koy (öne çıkan)': 'Feature on the home page', 'Yayınla': 'Publish',
    // 404
    'Sayfa bulunamadı | YÖRÜKHAN GAMES': 'Page not found | YÖRÜKHAN GAMES', 'Aradığın sayfa bulunamadı.': "The page you're looking for could not be found.",
    'Burada oyun yok': 'No games here', 'Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.': 'The page you are looking for may have moved or never existed.',
    "Keşfet'e dön": 'Back to Discover',
    // Hakkında / Gizlilik / Koşullar
    'Hakkında ve İletişim | YÖRÜKHAN GAMES': 'About & Contact | YÖRÜKHAN GAMES',
    'YÖRÜKHAN GAMES nedir, oyun geliştiriciler için bilgiler ve iletişim.': 'What YÖRÜKHAN GAMES is, info for game developers, and contact.',
    'Gizlilik Politikası | YÖRÜKHAN GAMES': 'Privacy Policy | YÖRÜKHAN GAMES', 'Gizlilik Politikası': 'Privacy Policy',
    'YÖRÜKHAN GAMES gizlilik politikası ve çerez kullanımı.': 'YÖRÜKHAN GAMES privacy policy and cookie use.',
    'Kullanım Koşulları | YÖRÜKHAN GAMES': 'Terms of Use | YÖRÜKHAN GAMES', 'Kullanım Koşulları': 'Terms of Use',
    'YÖRÜKHAN GAMES kullanım koşulları ve oyun yükleme kuralları.': 'YÖRÜKHAN GAMES terms of use and game upload rules.'
  };
  window.YG_DICT = D;

  // Çeviri bitene kadar Türkçe metin görünüp kaybolmasın (en fazla 1.5 sn)
  root.classList.add('i18n-wait');
  var st = document.createElement('style');
  st.textContent = 'html.i18n-wait body{visibility:hidden}';
  document.head.appendChild(st);
  var done = function () { root.classList.remove('i18n-wait'); };
  setTimeout(done, 1500);

  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function tr(s) {
    var k = s.replace(/\s+/g, ' ').trim();
    if (!k || !D.hasOwnProperty(k)) return null;
    return /^\s*/.exec(s)[0] + D[k] + /\s*$/.exec(s)[0]; // baştaki/sondaki boşluklar korunur
  }
  function apply() {
    document.title = tr(document.title) || document.title;
    [].forEach.call(document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]'), function (el) {
      var v = tr(el.getAttribute('content') || ''); if (v) el.setAttribute('content', v);
    });
    [].forEach.call(document.querySelectorAll('[data-en]'), function (el) { el.innerHTML = el.getAttribute('data-en'); });
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) { var p = n.parentNode.nodeName; return p === 'SCRIPT' || p === 'STYLE' ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    }), n, v;
    while ((n = w.nextNode())) if ((v = tr(n.nodeValue))) n.nodeValue = v;
    [].forEach.call(document.body.querySelectorAll('[placeholder],[aria-label],[title],[alt]'), function (el) {
      ATTRS.forEach(function (a) { var x = el.getAttribute(a); if (x && (v = tr(x))) el.setAttribute(a, v); });
    });
    done();
  }
  document.addEventListener('DOMContentLoaded', apply);
})();
