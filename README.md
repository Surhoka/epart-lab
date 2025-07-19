# Epart Lab — Blogger SPA Template

Template Blogger berbasis SPA dengan fitur:

- Navigasi instan tanpa reload (`loadContentForUrl`)
- Estimasi belanja part via Google Sheets
- Lazy loading promo gallery dengan fallback rehydrasi
- Export estimasi ke PDF via jsPDF
- Dropdown kendaraan & pencarian part interaktif

🛠 Dibangun untuk efisiensi dan interaktivitas maksimal tanpa framework tambahan.

📦 CDN siap pakai:
- `epart_minified.css`: styling promo & modal estimasi
- `epart_minified.min.js`: seluruh engine interaktif

📡 Siap dipanggil di template Blogger via:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/surhoka/epart-lab/epart_minified.css.css">
<script src="https://cdn.jsdelivr.net/gh/surhoka/epart-lab/epart_minified.js"></script>
