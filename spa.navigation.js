// spa-navigation.js

// Pastikan window.postMap sudah diinisialisasi secara global atau dimuat dari localStorage
// Ini adalah bagian penting yang harus ada sebelum skrip ini dijalankan
window.postMap = window.postMap || {};

// Fungsi utility untuk menambahkan kelas CSS dengan aman
function safeAddClass(element, ...classNames) {
    if (element && element.classList) {
        element.classList.add(...classNames);
    }
}

// Elemen indikator loading SPA
const spaLoadingIndicator = document.getElementById('spa-loading-indicator');
const mainContentSection = document.getElementById('main-content-section');

// Asumsi showMessageBox tersedia secara global dari estimation-modal.js
if (typeof window.showMessageBox !== 'function') {
    console.warn("Fungsi 'showMessageBox' tidak ditemukan. Pastikan estimation-modal.js dimuat dengan benar.");
    window.showMessageBox = function(message) { console.log("Toast (fallback):", message); };
}

/**
 * Menampilkan indikator loading.
 */
function showLoading() {
    if (spaLoadingIndicator) {
        spaLoadingIndicator.classList.add('show');
        spaLoadingIndicator.classList.remove('complete');
    }
}

/**
 * Menyembunyikan indikator loading.
 */
function hideLoading() {
    if (spaLoadingIndicator) {
        spaLoadingIndicator.classList.add('complete');
        setTimeout(() => {
            spaLoadingIndicator.classList.remove('show', 'complete');
        }, 200); // Sesuaikan dengan durasi transisi CSS
    }
}

/**
 * Memuat konten halaman melalui AJAX untuk navigasi SPA.
 * @param {string} url - URL yang akan dimuat.
 * @param {boolean} pushState - Apakah akan mendorong state ke riwayat browser.
 */
async function loadPageContent(url, pushState = true) {
    if (!mainContentSection) {
        console.error('Bagian konten utama tidak ditemukan untuk SPA.');
        return;
    }

    showLoading();

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kesalahan HTTP! status: ${response.status}`);
        }
        const html = await response.text();

        // Parse HTML yang diambil
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Ekstrak konten utama yang baru
        const newMainContent = doc.getElementById('main-content-section');
        if (newMainContent) {
            // Ganti konten utama saat ini
            mainContentSection.innerHTML = newMainContent.innerHTML;

            // Perbarui judul halaman
            const newTitle = doc.querySelector('title')?.textContent || document.title;
            document.title = newTitle;

            // Perbarui URL di riwayat browser
            if (pushState) {
                history.pushState({ path: url }, newTitle, url);
            }

            // Gulir ke atas halaman
            window.scrollTo(0, 0);

            // Pasang kembali event listener untuk konten yang baru dimuat
            attachSpaLinkListeners(); // Pasang kembali untuk tautan baru

            // Panggil kembali fungsi untuk mengisi dropdown kategori kendaraan
            if (typeof window.populateVehicleCategoryDropdown === 'function') {
                window.populateVehicleCategoryDropdown();
            }

            // Jalankan kembali populasi peta postingan
            // PENTING: Jalankan ini dan tunggu sampai selesai karena jalankanPencarianFigSidebar bergantung padanya
            if (typeof window.populatePostMap === 'function') {
                await window.populatePostMap(); // Tunggu hingga postMap diperbarui
            }

            // Setelah postMap diperbarui, panggil fungsi pencarian sidebar untuk menyegarkan hasilnya
            // atau mengembalikan ke keadaan awal (misalnya, menampilkan pesan "Masukkan kata kunci...")
            if (typeof window.jalankanPencarianFigSidebar === 'function') {
                const sidebarInput = document.getElementById('sidebarSearchInput');
                // Jika ada query di input pencarian, jalankan pencarian ulang
                // Jika tidak, tampilkan pesan default atau kosongkan hasil
                if (sidebarInput && sidebarInput.value.trim() !== '') {
                    window.jalankanPencarianFigSidebar(sidebarInput.value.trim().toUpperCase());
                } else {
                    window.jalankanPencarianFigSidebar(''); // Kosongkan atau reset hasil pencarian
                }
            }

            console.log(`SPA: Konten dimuat untuk ${url}`);
        } else {
            console.error(`SPA: Tidak dapat menemukan #main-content-section di konten yang diambil dari ${url}`);
        }
    } catch (error) {
        console.error('SPA: Gagal memuat konten halaman:', error);
        window.showMessageBox(`Gagal memuat halaman: ${error.message}.`);
    } finally {
        hideLoading();
    }
}

/**
 * Memasang listener klik ke semua tautan internal untuk navigasi SPA.
 * Fungsi ini harus dipanggil pada inisialisasi dan setelah konten baru dimuat.
 */
function attachSpaLinkListeners() {
    document.querySelectorAll('a').forEach(link => {
        // Hapus listener yang ada untuk mencegah duplikasi
        link.removeEventListener('click', handleSpaLinkClick);
        
        // Hanya pasang listener jika itu adalah tautan internal dan bukan tautan khusus
        const href = link.getAttribute('href');
        if (href && 
            !href.startsWith('#') && // Tautan jangkar
            !href.startsWith('mailto:') && // Tautan email
            !href.startsWith('tel:') && // Tautan telepon
            !link.target && // Tidak membuka di tab baru
            !link.classList.contains('no-spa') && // PERBAIKAN: Pastikan ini diperiksa dengan benar
            link.hostname === window.location.hostname // Domain yang sama
        ) {
            link.addEventListener('click', handleSpaLinkClick);
        }
    });
}

/**
 * Event handler untuk klik tautan SPA.
 * @param {Event} e - Event klik.
 */
function handleSpaLinkClick(e) {
    const link = e.currentTarget;
    const href = link.getAttribute('href');

    // Mencegah navigasi default
    e.preventDefault();

    // Muat konten menggunakan logika SPA
    loadPageContent(href);
}

// Inisialisasi: Pasang listener tautan SPA saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    attachSpaLinkListeners();

    // Tangani tombol kembali/maju browser
    window.addEventListener('popstate', (e) => {
        loadPageContent(window.location.href, false); // Jangan mendorong state lagi
    });
});

// Ekspor fungsi yang mungkin perlu diakses secara global oleh skrip lain
window.loadPageContent = loadPageContent;
window.attachSpaLinkListeners = attachSpaLinkListeners;
