# Akvaryum Seferi

Online co-op / PvP 3D denizaltı oyunu (Three.js, tek dosya, sunucusuz — oyuncular PeerJS ile tarayıcıdan tarayıcıya bağlanır).

- 1120×640 birimlik dev akvaryum (önceki sürümün 4 katı alan)
- 16 canlı türü, 12 biyom (Mercan Bahçesi, Yosun Ormanı, Buzul Kutbu, Yanardağ Bacaları, Kristal Mağaraları, Karanlık Uçurum, Batık Şehir, Turkuaz Lagün, Mavi Okyanus, Kızıl Kanyon …)
- Su yüzeyine çıkılabilir: yüzeyde yıldızlı gece gökyüzü, ay, kayan yıldızlar ve aurora
- PWA: masaüstüne / ana ekrana yüklenebilir (Chrome/Edge: adres çubuğundaki yükle simgesi veya oyun içi "Uygulamayı yükle" düğmesi; iOS: Paylaş → Ana Ekrana Ekle)

## Yeni özellikler (v2)

- **Mobil**: ▲ / ▼ / ⚡ düğmeleri tek dokunuşla açılıp kapanır (basılı tutmak gerekmez); ⚡ açıkken denizaltı batarya bitene kadar ya da tekrar basılana dek hızla ilerler. Adaptif çözünürlük, hafifletilmiş gölgelendirici/geometri, `backdrop-filter` kapalı, ince bildirimler (tür keşfi 2 sn'lik küçük bir şerit).
- **Yüzeyde sabit durma**: yüzeye çıkınca denizaltı batmaz, Q/E ya da ▼ ile dalana kadar yüzer.
- **Yakın saldırı** (sağ tık / X / ⚔): önündeki canlıları, düşmanları, yapıları ve (online) rakip oyuncuları vurur.
- **Ağ** (8 / N / 🕸): balık sürüsünü ya da düşmanı yakalar, etkisiz hale getirip sana çeker; online'da rakibi de yakalar.
- **Birinci şahıs bakış** (B / 👁); **tür kataloğu** PC'de de T ile açılıp kapanır.
- **Alan hasarı**: torpido/mayın etrafındaki canlıları da öldürür, uzaktakileri sarsar.
- **Yapı fiziği**: sütun/lento, kaya yığını ve kemerler desteğini kaybedince çöker.
- **Görevler + tersane**: görev ödülü altınla 6 kademeli denizaltı (her biri daha büyük, daha hızlı, daha çok cephane) ve 5 geliştirme satın alınır. İlerleme tarayıcıda saklanır.
- **Akvaryum tabelası**: "YÖRÜKHAN STÜDYO" altında süre, avlanan balık raporu ve toplam skor paneli.
- **Otomatik güncelleme**: yeni sürüm arka planda indirilir, ana menüde GÜNCELLE uyarısı çıkar.

### Yeni sürüm yayınlarken
`index.html` içindeki `BUILD`, `sw.js` içindeki `VER` ve `version.json` içindeki `version` değerini aynı yeni değere çevir (ör. `2026.10.03-1`). Bu değer değişince açık olan tüm cihazlarda GÜNCELLE uyarısı çıkar.

## Yayınlama (Vercel)

Statik site; build gerekmez. Vercel'de "Add New → Project" → bu depoyu seç → Framework: **Other** → Deploy.

© YÖRÜKHAN STÜDYO
