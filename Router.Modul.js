/**
 * Objek router untuk mengelola rute SPA (Single Page Application).
 * Menggunakan routing berbasis hash (#) agar kompatibel dengan Blogger.
 */
const router = {
    routes: {}, // Objek untuk menyimpan definisi rute

    /**
     * Menambahkan rute baru ke router.
     * @param {string} path - Jalur rute (misalnya, '/', '/about', '/products').
     * @param {function} handler - Fungsi yang akan dijalankan ketika rute ini aktif.
     * Fungsi ini akan menerima objek 'params' jika ada parameter rute.
     */
    addRoute: function(path, handler) {
        // Mengubah jalur rute menjadi regex untuk mencocokkan parameter
        const regexPath = new RegExp(
            '^' + path.replace(/:([a-zA-Z0-9_]+)/g, '(?<$1>[a-zA-Z0-9_\\-]+)') + '$'
        );
        this.routes[path] = { regex: regexPath, handler: handler };
        console.log(`Router: Rute '${path}' ditambahkan.`);
    },

    /**
     * Mengubah rute aplikasi. Ini akan memperbarui hash URL dan memicu penangan rute.
     * @param {string} path - Jalur rute yang ingin dinavigasi (misalnya, '/about').
     */
    navigateTo: function(path) {
        window.location.hash = path;
        console.log(`Router: Navigasi ke '${path}'.`);
    },

    /**
     * Menangani perubahan lokasi URL (hash) dan menjalankan handler rute yang sesuai.
     */
    handleLocation: function() {
        const path = window.location.hash.slice(1) || '/'; // Ambil hash tanpa '#' atau default ke '/'
        console.log(`Router: Menangani lokasi: '${path}'.`);

        let matched = false;
        for (const routePath in this.routes) {
            const route = this.routes[routePath];
            const match = path.match(route.regex);

            if (match) {
                const params = match.groups || {}; // Dapatkan parameter rute
                console.log(`Router: Rute cocok: '${routePath}', Parameter:`, params);
                route.handler(params); // Jalankan handler dengan parameter
                matched = true;
                break;
            }
        }

        if (!matched) {
            console.warn(`Router: Rute tidak ditemukan untuk '${path}'. Menjalankan rute default (jika ada).`);
            // Jika tidak ada rute yang cocok, coba rute default (misalnya, rute '/' atau 404)
            if (this.routes['/']) {
                this.routes['/'].handler({});
            } else {
                console.error("Router: Tidak ada rute yang cocok dan rute default '/' tidak didefinisikan.");
                // Opsional: Tampilkan halaman 404 atau pesan kesalahan
                if (typeof window.injectNotFoundContent === 'function') {
                    window.injectNotFoundContent();
                } else {
                    const appContent = document.getElementById('app-content');
                    if (appContent) {
                        appContent.innerHTML = `
                            <div class="text-center p-8 bg-red-50 text-red-700 rounded-lg">
                                <h2 class="text-2xl font-bold mb-2">404 - Halaman Tidak Ditemukan</h2>
                                <p>Maaf, rute yang Anda cari tidak ada.</p>
                                <button onclick="router.navigateTo('/')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    Kembali ke Beranda
                                </button>
                            </div>
                        `;
                    }
                }
            }
        }
    },

    /**
     * Menginisialisasi router.
     */
    init: function() {
        // Dengarkan perubahan hash
        window.addEventListener('hashchange', this.handleLocation.bind(this));
        // Tangani rute awal saat halaman dimuat
        // Tidak perlu event 'load' di sini karena main.js akan memanggil handleLocation secara eksplisit
        // setelah DOMContentLoaded
        console.log("Router: Diinisialisasi.");
    }
};

// Buat fungsi navigasi dapat diakses secara global
window.router = router;

// Definisikan rute-rute Anda, memanggil fungsi injeksi dari inject-scripts.js
router.addRoute('/', function() {
    if (typeof window.injectHomeContent === 'function') {
        window.injectHomeContent();
    } else {
        console.error("injectHomeContent tidak ditemukan. Pastikan inject-scripts.js dimuat.");
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p class="text-red-500">Error: Konten beranda tidak dapat dimuat.</p>`;
        }
    }
});

router.addRoute('/about', function() {
    if (typeof window.injectAboutContent === 'function') {
        window.injectAboutContent();
    } else {
        console.error("injectAboutContent tidak ditemukan. Pastikan inject-scripts.js dimuat.");
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p class="text-red-500">Error: Konten tentang kami tidak dapat dimuat.</p>`;
        }
    }
});

router.addRoute('/contact', function() {
    if (typeof window.injectContactContent === 'function') {
        window.injectContactContent();
    } else {
        console.error("injectContactContent tidak ditemukan. Pastikan inject-scripts.js dimuat.");
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p class="text-red-500">Error: Konten kontak tidak dapat dimuat.</p>`;
        }
    }
});

// Rute dengan parameter (contoh: /products/item-id)
router.addRoute('/products/:id', function(params) {
    const productId = params.id;
    if (typeof window.injectProductDetailContent === 'function') {
        window.injectProductDetailContent(productId);
    } else {
        console.error("injectProductDetailContent tidak ditemukan. Pastikan inject-scripts.js dimuat.");
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<p class="text-red-500">Error: Konten detail produk tidak dapat dimuat.</p>`;
        }
    }
});
