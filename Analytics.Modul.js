/**
 * Fungsi placeholder untuk mengirim data analitik.
 * Dalam implementasi nyata, Anda akan mengganti ini dengan kode
 * dari platform analitik pilihan Anda (misalnya, Google Analytics, Matomo, dll.).
 * @param {string} pagePath - Jalur halaman yang saat ini dilihat (misalnya, '/home', '/about').
 * @param {string} pageTitle - Judul halaman yang sesuai dengan jalur.
 */
function sendPageViewAnalytics(pagePath, pageTitle) {
    console.log(`[Analitik] Melacak tampilan halaman:`, { path: pagePath, title: pageTitle });

    // --- Contoh Integrasi Google Analytics (GA4) ---
    /*
    if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
            page_path: pagePath,
            page_title: pageTitle,
        });
        console.log(`[Analitik] Event 'page_view' GA4 dikirim untuk: ${pagePath}`);
    } else {
        console.warn("[Analitik] gtag tidak ditemukan. Pastikan Google Analytics diinisialisasi.");
    }
    */

    // --- Contoh Integrasi Matomo (Piwik) ---
    /*
    if (typeof _paq !== 'undefined') {
        _paq.push(['setCustomUrl', window.location.href]);
        _paq.push(['setDocumentTitle', pageTitle]);
        _paq.push(['trackPageView']);
        console.log(`[Analitik] Matomo page view dikirim untuk: ${pagePath}`);
    } else {
        console.warn("[Analitik] _paq tidak ditemukan. Pastikan Matomo diinisialisasi.");
    }
    */
}

/**
 * Menginisialisasi pelacakan analitik dengan mengoverride metode handleLocation router.
 * Ini memastikan bahwa setiap kali rute berubah, event analitik juga dikirim.
 */
window.initAnalytics = function() {
    // Pastikan router sudah diinisialisasi dan tersedia di window
    if (window.router && typeof window.router.handleLocation === 'function') {
        const originalHandleLocation = window.router.handleLocation;

        window.router.handleLocation = function() {
            // Panggil fungsi handleLocation asli dari router
            originalHandleLocation.apply(this, arguments);

            // Setelah rute ditangani, kirim event analitik
            const currentPath = window.location.hash.slice(1) || '/';
            const currentPageTitle = document.title || `SPA - ${currentPath}`;

            sendPageViewAnalytics(currentPath, currentPageTitle);
        };
        console.log("[Analitik] Router.handleLocation berhasil di-override untuk pelacakan.");
    } else {
        console.warn("[Analitik] Router tidak ditemukan atau belum diinisialisasi. Pelacakan navigasi tidak akan berfungsi.");
    }
};
