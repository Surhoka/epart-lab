// File: src/app.js
// Deskripsi: File entri utama aplikasi. Menginisialisasi semua modul.

import { fetchAllData } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/api.js';
import { initRouter, showSection } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/router.js';
import { initializeSearchData, initSearch } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/search.js';
import { initializeGalleryData, populateModelDropdown, populateCategoryFilter, initGallery } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/gallery.js';
import { initializeFigureViewerData } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/figure-viewer.js';
import { initializeEstimationData, initEstimation } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/estimation.js';

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
