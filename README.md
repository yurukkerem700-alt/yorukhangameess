# YÖRÜKHAN GAMES

Oyun sitesi. **Klasör yok:** tüm dosyalar tek yerde, GitHub'a yüklemesi kolay.

## GitHub'a yükleme (güncelleme)

1. GitHub'da reposunu aç → **Add file → Upload files**.
2. Zip'ten çıkan **bütün dosyaları seç** (54 dosya) ve sürükle ya da seç. Telefondan da olur.
3. Aşağıda **Commit changes**'e bas. Vercel siteyi 1 dakika içinde kendiliğinden günceller.
4. Eski sürümden kalan `css`, `js`, `img`, `tools`, `supabase` klasörleri repoda duruyorsa silebilirsin (zararları yok).

## Supabase ayarları (bir kez)

- **Authentication → URL Configuration:** Site URL = sitenin adresi, Redirect URLs = `https://SITEN.vercel.app/**`
- **Authentication → Sign In / Providers → Email → "Confirm email" kapalı**

## Yönetici olmak

Sitede kayıt ol, sonra Claude'a e-postanı söyle ("beni admin yap"). Menüde **⚙️ Yönetim Paneli** çıkar.

## Ayarlar

`config.js` dosyasında: site adresi, iletişim e-postası, AdSense kodu, kategoriler.

## İçindekiler

| Dosya | Ne |
|---|---|
| `index.html` | Keşfet sayfası (vitrin, raflar, listeler) ve oyun arama/kategori sayfası |
| `oyun.html` | Oyun sayfası |
| `yukle.html`, `giris.html`, `panelim.html`, `profil.html`, `admin.html` | Hesap ve yükleme sayfaları |
| `oyun-*.html` + `oyun-*.jpg`/`*.svg` | Sitenin resmi oyunları ve kapakları |
| `logo.svg`, `logo-mark.svg` | Logo (yatay) ve amblem (koçboynuzu Y) |
| `favicon.svg`, `favicon.ico`, `icon-*.png`, `og.png` | Sekme ikonu, uygulama ikonları, paylaşım görseli |
| `style.css` | Tasarım |
| `*.js` | Sitenin çalışan kodları |
