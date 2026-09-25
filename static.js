import { CONFIG, $$, esc } from './common.js';

// İletişim e-postasını config.js'ten doldur
$$('[data-contact]').forEach(el => {
  el.innerHTML = CONFIG.CONTACT_EMAIL
    ? `<a href="mailto:${esc(CONFIG.CONTACT_EMAIL)}">${esc(CONFIG.CONTACT_EMAIL)}</a>`
    : 'sitedeki 🚩 şikayet düğmesi';
});
