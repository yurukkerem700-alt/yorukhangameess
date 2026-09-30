# Oyun yayın hattı

Yeni bir oyun yayınlamadan önce bu sırayı izle:

1. **Fikir ve özgünlük:** Başka bir oyunun adını, karakterini, görselini ya da sesini kullanma. Mekanik (yılan, blok kırma gibi) serbest, isim ve görsel özgün olmalı.
2. **Yazılım:** Oyun tek bir `oyun-<ad>.html` dosyası olsun, dışarıdan dosya yüklemesin, telefonda ve bilgisayarda çalışsın. Kapak: `oyun-<ad>.jpg` (kare) ve `oyun-<ad>-genis.jpg` (geniş).
3. **Kayıt:** `tools/games.json` dosyasına oyunu ekle (id, başlık, açıklama, kategori, kontroller, mobil mi, kapak yolu, dosya yolu).
4. **Test:** `node tools/smoke.mjs` — her oyun masaüstü ve telefon boyutunda açılır, tuşa/dokunmaya cevap verir mi, hata çıkarıyor mu, taşma var mı bakılır. Tümü ✅ olmadan yayınlama.
5. **Sayfaları üret:** `node tools/build-pages.mjs` — `g/<ad>.html` SEO sayfalarını, `slugs.js` ve `sitemap.xml` dosyalarını günceller.
6. **Veritabanı:** Supabase `yg_games` tablosuna aynı oyunu ekle (status = approved, is_official = true).
7. **Yayın:** Değişiklikleri GitHub'a gönder, Vercel kendiliğinden yayınlar. Sonra Search Console'da yeni sayfaları dizine eklemeyi iste.

Özel alan adı alınınca: `tools/build-pages.mjs` içindeki `SITE`, `config.js` içindeki `SITE_URL` ve `robots.txt` adreslerini değiştir, betiği yeniden çalıştır.
