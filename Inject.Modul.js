// KONTEN YANG DIKOREKSI UNTUK Inject.Modul.js

// PENTING: Pastikan tidak ada baris seperti 'const appContent = document.getElementById('app-content');'
// atau blok 'if (!appContent) { ... }' di bagian paling atas file ini.
// Semua pengambilan elemen 'app-content' harus terjadi di dalam fungsi 'injectContent'.

/**
 * Menginjeksi konten HTML ke dalam elemen app-content.
 * Fungsi ini akan mencari elemen 'app-content' setiap kali dipanggil,
 * memastikan elemen sudah ada di DOM saat fungsi ini dieksekusi.
 * @param {string} htmlString - String HTML yang akan diinjeksi.
 * @param {number} [retryCount=0] - Jumlah percobaan ulang (internal).
 */
function injectContent(htmlString, retryCount = 0) {
    const appContent = document.getElementById('app-content');
    if (appContent) {
        appContent.innerHTML = htmlString;
    } else {
        // Jika elemen tidak ditemukan, coba lagi setelah sedikit penundaan
        if (retryCount < 5) { // Coba hingga 5 kali
            console.warn(`Inject.Modul.js: Elemen 'app-content' belum siap, mencoba lagi (${retryCount + 1}/5)...`);
            setTimeout(() => {
                injectContent(htmlString, retryCount + 1);
            }, 50); // Coba lagi setelah 50ms
        } else {
            console.error("Inject.Modul.js: Elemen dengan id 'app-content' tidak ditemukan setelah beberapa kali percobaan. Konten tidak dapat diinjeksi.");
        }
    }
}

// Pastikan fungsi-fungsi injeksi konten lainnya terekspos secara global
// agar dapat diakses oleh Router.Modul.js

/**
 * Fungsi untuk menginjeksi konten halaman Beranda.
 */
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
    console.log(`Inject.Modul.js: Konten Beranda diinjeksi.`);
};

/**
 * Fungsi untuk menginjeksi konten halaman Tentang Kami.
 */
window.injectAboutContent = function() {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-green-800 mb-4">Tentang Kami</h2>
            <p class="text-gray-700 leading-relaxed">Ini adalah halaman tentang kami. Di sini Anda bisa menjelaskan lebih banyak tentang perusahaan atau blog Anda.</p>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log(`Inject.Modul.js: Konten Tentang Kami diinjeksi.`);
};

/**
 * Fungsi untuk menginjeksi konten halaman Kontak.
 */
window.injectContactContent = function() {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-purple-800 mb-4">Kontak Kami</h2>
            <p class="text-gray-700 leading-relaxed">Anda bisa menghubungi kami melalui email atau telepon. Informasi kontak ada di sini.</p>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log(`Inject.Modul.js: Konten Kontak diinjeksi.`);
};

/**
 * Fungsi untuk menginjeksi konten halaman detail produk.
 * @param {string} productId - ID produk yang akan ditampilkan.
 */
window.injectProductDetailContent = function(productId) {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-orange-800 mb-4">Detail Produk: ${productId}</h2>
            <p class="text-gray-700 leading-relaxed">Ini adalah halaman detail untuk produk dengan ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded">${productId}</span>. Anda bisa mengambil data produk dari API di sini.</p>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log(`Inject.Modul.js: Konten Detail Produk (${productId}) diinjeksi.`);
};

/**
 * Fungsi untuk menginjeksi konten halaman 404 (Tidak Ditemukan).
 */
window.injectNotFoundContent = function() {
    const html = `
        <div class="text-center p-8 bg-red-50 text-red-700 rounded-lg">
            <h2 class="text-2xl font-bold mb-2">404 - Halaman Tidak Ditemukan</h2>
            <p>Maaf, rute yang Anda cari tidak ada.</p>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log(`Inject.Modul.js: Konten 404 diinjeksi.`);
};

/**
 * Fungsi untuk menampilkan pesan toast.
 * @param {string} message - Pesan yang akan ditampilkan.
 * @param {'info'|'success'|'error'} [type='info'] - Tipe pesan (mengubah warna).
 * @param {number} [duration=3000] - Durasi tampilan pesan dalam milidetik.
 */
window.showMessageBox = function(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        // Reset class dan atur ulang berdasarkan tipe
        toast.className = ''; // Hapus semua kelas dulu
        toast.classList.add('show'); // Tambahkan kelas 'show'

        if (type === 'error') {
            toast.style.backgroundColor = 'rgba(220, 38, 38, 0.7)'; // Merah
        } else if (type === 'success') {
            toast.style.backgroundColor = 'rgba(22, 163, 74, 0.7)'; // Hijau
        } else {
            toast.style.backgroundColor = 'rgba(0, 100, 160, 0.7)'; // Biru (default)
        }

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    } else {
        console.warn("Inject.Modul.js: Elemen Toast tidak ditemukan. Pesan tidak dapat ditampilkan.");
    }
};
