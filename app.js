// File: src/app.js
// Deskripsi: File entri utama aplikasi. Menginisialisasi semua modul.

import { fetchAllData } from './api.js';
import { initRouter, showSection } from './router.js';
import { initializeSearchData, initSearch } from './search.js';
import { initializeGalleryData, populateModelDropdown, populateCategoryFilter, initGallery } from './gallery.js';
import { initializeFigureViewerData } from './figure-viewer.js';
import { initializeEstimationData, initEstimation } from './estimation.js';

/**
 * Fungsi inisialisasi utama aplikasi.
 */
async function main() {
    console.log("Aplikasi mulai dimuat...");

    // Tampilkan loading indicator
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    // Ambil semua data yang diperlukan
    const allData = await fetchAllData();

    // Inisialisasi modul dengan data yang relevan
    initializeSearchData(allData);
    initializeGalleryData(allData);
    initializeFigureViewerData(allData);
    initializeEstimationData(allData);

    // Isi dropdown dan filter
    populateModelDropdown();
    populateCategoryFilter();

    // Inisialisasi fungsionalitas
    initSearch();
    initEstimation();
    initRouter();

    // Sembunyikan loading indicator setelah semua selesai
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    
    console.log("Aplikasi SPA Blogger berhasil dimuat sepenuhnya.");
}

// Jalankan aplikasi setelah DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', main);
