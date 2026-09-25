// ============================================================
//  YÖRÜKHAN GAMES — AYARLAR
//  Siteyle ilgili değiştirmen gereken her şey bu dosyada.
// ============================================================

export const CONFIG = {
  SITE_NAME: 'YÖRÜKHAN GAMES',
  SITE_URL: 'https://yorukhan-games.vercel.app', // Vercel adresin belli olunca güncelle

  // Veritabanı bağlantısı (Supabase). Bu anahtar herkese açık olacak şekilde tasarlandı, gizli değil.
  SUPABASE_URL: 'https://rgikdorrzksidkvdsyfn.supabase.co',
  SUPABASE_KEY: 'sb_publishable_ChOS06DqAyESAxdAvVThmw_Br5pSuQS',

  // İletişim e-postası (Hakkında sayfasında görünür — AdSense onayı için önemli)
  CONTACT_EMAIL: '',

  // ---------- REKLAMLAR (Google AdSense) ----------
  // AdSense onaylanınca "ca-pub-..." kodunu buraya yaz.
  // Boş kaldığı sürece reklam yerlerinde "Reklam alanı" kutusu görünür.
  ADSENSE_CLIENT: '',
  // AdSense panelinde oluşturduğun reklam birimlerinin "data-ad-slot" numaraları:
  AD_SLOTS: {
    top: '',      // oyunun üstündeki yatay reklam
    side: '',     // oyunun yanındaki dikey reklam (masaüstü)
    below: '',    // oyunun altındaki reklam
    feed: '',     // ana sayfada oyunların arasındaki reklam
  },

  // Oyun kategorileri
  CATEGORIES: [
    { id: 'aksiyon',  name: 'Aksiyon',  icon: '⚔️', color: ['#c2410c', '#7c2d12'] },
    { id: 'arcade',   name: 'Arcade',   icon: '🕹️', color: ['#7c3aed', '#3b0764'] },
    { id: 'bulmaca',  name: 'Bulmaca',  icon: '🧩', color: ['#0891b2', '#164e63'] },
    { id: 'nisanci',  name: 'Nişancı',  icon: '🎯', color: ['#dc2626', '#7f1d1d'] },
    { id: 'macera',   name: 'Macera',   icon: '🗺️', color: ['#16a34a', '#14532d'] },
    { id: 'yaris',    name: 'Yarış',    icon: '🏁', color: ['#ea580c', '#431407'] },
    { id: 'strateji', name: 'Strateji', icon: '♟️', color: ['#4f46e5', '#1e1b4b'] },
    { id: 'spor',     name: 'Spor',     icon: '⚽', color: ['#059669', '#022c22'] },
    { id: 'egitici',  name: 'Eğitici',  icon: '📚', color: ['#ca8a04', '#422006'] },
    { id: 'diger',    name: 'Diğer',    icon: '✨', color: ['#db2777', '#500724'] },
  ],

  MAX_GAME_MB: 25,
  MAX_THUMB_MB: 2,
};
