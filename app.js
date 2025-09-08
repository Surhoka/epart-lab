// File: src/app.js
// Deskripsi: File entri utama aplikasi. Menginisialisasi semua modul.
// Entry point SPA Blogger
import { fetchAllData } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/api.js';
import { initRouter } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/router.js';
import { initGallery } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/gallery.js';
import { initSearch } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/search.js';
import { initEstimation } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/estimation.js';

async function main() {
  console.time('SPA Init');

  // Validasi elemen loading
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) loadingOverlay.style.display = 'block';

  // Fetch data dengan fallback
  let allData = {};
  try {
    allData = await fetchAllData();
    console.log('✅ Data berhasil dimuat:', allData);
  } catch (err) {
    console.warn('⚠️ Gagal memuat data:', err);
    allData = { parts: [], categories: [] }; // fallback minimal
  }

  // Validasi elemen root SPA
  const rootEl = document.getElementById('spa-root');
  if (!rootEl) {
    console.error('❌ Elemen #spa-root tidak ditemukan. SPA tidak bisa dijalankan.');
    return;
  }

  // Inisialisasi modul
  try {
    initRouter(allData);
    initGallery(allData);
    initSearch(allData);
    initEstimation(allData);
    console.log('✅ Semua modul berhasil diinisialisasi.');
  } catch (err) {
    console.error('❌ Error saat inisialisasi modul:', err);
  }

  // Sembunyikan loading
  if (loadingOverlay) loadingOverlay.style.display = 'none';

  console.timeEnd('SPA Init');
}

// Jalankan hanya setelah DOM siap
window.addEventListener('DOMContentLoaded', main);
