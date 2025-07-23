document.addEventListener('DOMContentLoaded', function() {
    console.log("main.js: DOMContentLoaded terpicu. Memulai inisialisasi modul.");

    // Inisialisasi modul-modul secara berurutan berdasarkan dependensi
    // Pastikan semua script eksternal dimuat dengan 'defer' di HTML
    // sehingga fungsi-fungsi global ini tersedia.

    // 1. Inisialisasi Toast (tidak ada init khusus, fungsi sudah global)
    if (typeof window.showMessageBox === 'function') {
        console.log("main.js: showMessageBox tersedia.");
    } else {
        console.error("main.js: showMessageBox TIDAK tersedia. Periksa toast-scripts.js.");
    }

    // 2. Inisialisasi Inject (tidak ada init khusus, fungsi sudah global)
    if (typeof window.injectHomeContent === 'function') {
        console.log("main.js: Fungsi injeksi konten tersedia.");
    } else {
        console.error("main.js: Fungsi injeksi konten TIDAK tersedia. Periksa inject-scripts.js.");
    }

    // 3. Inisialisasi Router
    if (window.router && typeof window.router.init === 'function') {
        window.router.init();
        // Panggil handleLocation secara eksplisit untuk rute awal
        window.router.handleLocation();
        console.log("main.js: Router diinisialisasi dan rute awal ditangani.");
    } else {
        console.error("main.js: Router TIDAK tersedia atau init() tidak ditemukan. Periksa router-scripts.js.");
    }

    // 4. Inisialisasi Analytics
    if (typeof window.initAnalytics === 'function') {
        window.initAnalytics();
        console.log("main.js: Analitik diinisialisasi.");
    } else {
        console.warn("main.js: initAnalytics TIDAK tersedia. Pelacakan analitik mungkin tidak berfungsi.");
    }

    // 5. Inisialisasi Search
    if (typeof window.initSearch === 'function') {
        window.initSearch();
        console.log("main.js: Pencarian diinisialisasi.");
    } else {
        console.warn("main.js: initSearch TIDAK tersedia. Fungsionalitas pencarian mungkin tidak berfungsi.");
    }

    // 6. Inisialisasi Table
    if (typeof window.initTable === 'function') {
        window.initTable();
        console.log("main.js: Tabel diinisialisasi.");
    } else {
        console.warn("main.js: initTable TIDAK tersedia. Fungsionalitas tabel mungkin tidak berfungsi.");
    }

    // 7. Inisialisasi Modal
    if (typeof window.initModal === 'function') {
        window.initModal();
        console.log("main.js: Modal diinisialisasi.");
    } else {
        console.warn("main.js: initModal TIDAK tersedia. Fungsionalitas modal mungkin tidak berfungsi.");
    }

    // 8. Inisialisasi Navigasi
    if (typeof window.initNav === 'function') {
        window.initNav();
        console.log("main.js: Navigasi diinisialisasi.");
    } else {
        console.warn("main.js: initNav TIDAK tersedia. Fungsionalitas navigasi mungkin tidak berfungsi.");
    }

    // 9. Inisialisasi Lazy Load
    if (typeof window.initLazyLoad === 'function') {
        window.initLazyLoad();
        console.log("main.js: Lazy Load diinisialisasi.");
    } else {
        console.warn("main.js: initLazyLoad TIDAK tersedia. Fungsionalitas lazy load mungkin tidak berfungsi.");
    }

    console.log("main.js: Semua modul diinisialisasi.");
});