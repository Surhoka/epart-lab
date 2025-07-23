// Main.Modul.js

// Definisikan postMap secara global jika digunakan di luar populatePostMap
window.postMap = {}; 

/**
 * Mengisi postMap dengan judul dan URL postingan dari elemen tersembunyi.
 * @returns {Promise<void>} Sebuah Promise yang selesai ketika postMap terisi.
 */
window.populatePostMap = async function() {
    return new Promise((resolve, reject) => {
        const postMappingHidden = document.getElementById('postMappingHidden');
        if (postMappingHidden) {
            const links = postMappingHidden.querySelectorAll('a');
            links.forEach(link => {
                const title = link.textContent.trim();
                const url = link.getAttribute('href');
                if (title && url) {
                    window.postMap[title.toUpperCase()] = url;
                }
            });
            console.log("Post map populated:", window.postMap);
            resolve();
        } else {
            console.warn("Elemen #postMappingHidden tidak ditemukan.");
            reject(new Error("Elemen #postMappingHidden tidak ditemukan."));
        }
    });
};

// Pastikan fungsi-fungsi lain yang digunakan di HTML atau modul lain juga global
// Contoh:
// window.initializeEstimasiModal = function() { ... };
// window.handleSidebarSearch = function() { ... };
// ... dan fungsi-fungsi lain yang terkait dengan logika utama aplikasi Anda.

// Logika inisialisasi Main.Modul.js yang bergantung pada DOM siap
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.Modul.js: DOM Content Loaded. Initializing main functionalities.');

    // Panggil fungsi inisialisasi modal dan event listener di sini
    // Contoh:
    // const openModalBtn = document.getElementById('openEstimasiModal');
    // if (openModalBtn) {
    //     openModalBtn.addEventListener('click', window.initializeEstimasiModal);
    // }

    // Inisialisasi event listener untuk pencarian sidebar
    // const sidebarForm = document.getElementById('sidebarSearchForm');
    // const sidebarInput = document.getElementById('sidebarSearchInput');
    // if (sidebarForm && sidebarInput) {
    //     sidebarForm.addEventListener('submit', function (e) {
    //         e.preventDefault();
    //         const query = sidebarInput.value.trim().toUpperCase();
    //         if (query) window.jalankanPencarianFigSidebar(query); // Pastikan jalankanPencarianFigSidebar juga global
    //     });
    // }
});
