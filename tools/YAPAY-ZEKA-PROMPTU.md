# Başka yapay zekalara oyun yaptırma şablonu

Kullanım: aşağıdaki metni kopyala, `[OYUN FİKRİ]` yerine fikri yaz, istediğin yapay zekaya (Gemini, ChatGPT, DeepSeek vb.) yapıştır.
Gelen kodu `oyun-<ad>.html` olarak kaydet ve bana ver. Gerisini (test, düzeltme, kapak, sayfa, yayın) ben hallederim.

---

Sen deneyimli bir HTML5 oyun geliştiricisisin. Aşağıdaki fikre göre **tek bir HTML dosyası** olarak eksiksiz, oynanabilir bir oyun yaz.

**Oyun fikri:** [OYUN FİKRİ]

**Zorunlu kurallar**
1. Tek dosya: HTML, CSS ve JavaScript tek `.html` içinde olsun. Dışarıdan hiçbir dosya, kütüphane, font, resim ya da ses yükleme (CDN dahil). Grafikleri canvas ya da SVG ile kodla çiz, sesi WebAudio ile üret.
2. Tamamen özgün ol: var olan bir oyunun adını, karakterini, görselini ya da müziğini kullanma. Mekanik serbest.
3. Telefon ve bilgisayar: dokunmatik, fare ve klavye ile oynanabilsin. Ekran boyutuna uysun (canvas pencereye göre ölçeklensin), sayfa kaymasın, yatay taşma olmasın, çift dokunuşla yakınlaşma olmasın.
4. Arayüz Türkçe olsun. Başlangıç ekranı, "nasıl oynanır" bilgisi, duraklatma, oyun bitti ekranı ve yeniden başlat düğmesi olsun. `alert`, `confirm`, `prompt` kullanma.
5. Skor ve en yüksek skoru `localStorage` içinde (try/catch ile) sakla.
6. Zorluk yavaş yavaş artsın. İlk 10 saniyede oyuncu ne yapacağını anlasın.
7. Reklam, izleme, dış bağlantı, `fetch`, `eval`, kişisel veri toplama yok.
8. Sekme arka plana geçince oyun dursun. 60 FPS hedefle, gereksiz nesne üretme.
9. Dosya 300 KB'ı geçmesin. Kodun temiz ve hatasız olsun, konsola hata yazmasın.

**Çıktı:** Sadece tek bir kod bloğu içinde tam HTML dosyası. Açıklama yazma.
