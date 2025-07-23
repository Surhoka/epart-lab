// Inject.Modul.js

/**
 * Menginjeksi konten HTML ke dalam elemen app-content.
 * @param {string} htmlString - String HTML yang akan diinjeksi.
 */
function injectContent(htmlString) {
    // Pindahkan pengambilan elemen ke dalam fungsi ini
    const appContent = document.getElementById('app-content'); 
    if (appContent) {
        appContent.innerHTML = htmlString;
    } else {
        // Pesan error yang lebih spesifik jika elemen masih tidak ditemukan
        console.error("app-content tidak ditemukan atau belum siap untuk injeksi konten.");
    }
}

// Pastikan fungsi-fungsi injeksi lainnya didefinisikan secara global
// agar bisa diakses oleh Router.Modul.js
window.injectHomeContent = function() {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-blue-800 mb-4">Selamat Datang di Beranda!</h2>
            <p class="text-gray-700 leading-relaxed">Ini adalah halaman beranda aplikasi SPA Anda. Anda bisa menambahkan konten utama di sini.</p>
            <div class="mt-6 space-x-4">
                <button onclick="router.navigateTo('/about')" class="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200">
                    Tentang Kami
                </button>
                <button onclick="router.navigateTo('/contact')" class="px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-200">
                    Kontak
                </button>
            </div>
        </div>
    `;
    injectContent(html);
    console.log(`Script Injeksi: Konten Beranda diinjeksi.`);
};

// ... (lanjutkan dengan definisi injectAboutContent, injectContactContent, injectProductDetailContent, dll.)

// Anda juga mungkin memiliki fungsi utilitas lain yang perlu diekspos secara global
// Contoh: Fungsi untuk menampilkan pesan toast
window.showMessageBox = function(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = 'show'; // Reset class
        if (type === 'error') {
            toast.style.backgroundColor = 'rgba(220, 38, 38, 0.7)'; // Red
        } else if (type === 'success') {
            toast.style.backgroundColor = 'rgba(22, 163, 74, 0.7)'; // Green
        } else {
            toast.style.backgroundColor = 'rgba(0, 100, 160, 0.7)'; // Default navy
        }

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    } else {
        console.warn("Toast elements not found.");
    }
};

// Contoh: Fungsi untuk menambahkan item estimasi (jika ada di Inject.Modul.js)
// Ini biasanya lebih cocok di Main.Modul.js, tapi jika Anda memilikinya di sini:
/*
window.addEstimasiItem = function(item) {
    // ... logika untuk menambahkan item ke estimasi
};
*/
