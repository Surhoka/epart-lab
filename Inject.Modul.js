const appContent = document.getElementById('app-content');

if (!appContent) {
    console.error("Script Injeksi: Elemen dengan id 'app-content' tidak ditemukan. Konten tidak dapat diinjeksi.");
    // Tidak ada return di sini agar fungsi tetap didefinisikan secara global
}

/**
 * Menginjeksi konten HTML ke dalam elemen app-content.
 * @param {string} htmlString - String HTML yang akan diinjeksi.
 */
function injectContent(htmlString) {
    if (appContent) {
        appContent.innerHTML = htmlString;
    } else {
        console.error("app-content tidak tersedia untuk injeksi.");
    }
}

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
    console.log("Script Injeksi: Konten Beranda diinjeksi.");
};

/**
 * Fungsi untuk menginjeksi konten halaman Tentang Kami.
 */
window.injectAboutContent = function() {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-green-800 mb-4">Tentang Kami</h2>
            <p class="text-gray-700 leading-relaxed">Kami adalah perusahaan yang berdedikasi untuk menyediakan solusi terbaik bagi kebutuhan Anda. Pelajari lebih lanjut tentang misi dan nilai-nilai kami di sini.</p>
            <ul class="list-disc list-inside mt-4 text-gray-600">
                <li>Visi: Menjadi yang terdepan dalam inovasi.</li>
                <li>Misi: Memberikan layanan berkualitas tinggi.</li>
                <li>Nilai: Integritas, Kolaborasi, Keunggulan.</li>
            </ul>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log("Script Injeksi: Konten Tentang Kami diinjeksi.");
};

/**
 * Fungsi untuk menginjeksi konten halaman Kontak.
 */
window.injectContactContent = function() {
    const html = `
        <div class="p-8 bg-white shadow-md rounded-lg">
            <h2 class="text-3xl font-bold text-purple-800 mb-4">Hubungi Kami</h2>
            <p class="text-gray-700 leading-relaxed">Punya pertanyaan? Jangan ragu untuk menghubungi kami melalui formulir di bawah ini atau melalui detail kontak kami.</p>
            <form class="mt-6 space-y-4">
                <div>
                    <label for="name" class="block text-gray-700 text-sm font-bold mb-2">Nama:</label>
                    <input type="text" id="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Nama Anda">
                </div>
                <div>
                    <label for="email" class="block text-gray-700 text-sm font-bold mb-2">Email:</label>
                    <input type="email" id="email" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="email@example.com">
                </div>
                <div>
                    <label for="message" class="block text-gray-700 text-sm font-bold mb-2">Pesan:</label>
                    <textarea id="message" rows="5" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="Pesan Anda"></textarea>
                </div>
                <button type="submit" class="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200">
                    Kirim Pesan
                </button>
            </form>
            <button onclick="router.navigateTo('/')" class="mt-6 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log("Script Injeksi: Konten Kontak diinjeksi.");
};

/**
 * Fungsi untuk menginjeksi konten halaman Detail Produk.
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
    console.log(`Script Injeksi: Konten Detail Produk (${productId}) diinjeksi.`);
};

/**
 * Fungsi untuk menginjeksi konten halaman 404 (Tidak Ditemukan).
 */
window.injectNotFoundContent = function() {
    const html = `
        <div class="text-center p-8 bg-red-50 text-red-700 rounded-lg">
            <h2 class="text-2xl font-bold mb-2">404 - Halaman Tidak Ditemukan</h2>
            <p>Maaf, rute yang Anda cari tidak ada.</p>
            <button onclick="router.navigateTo('/')" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Kembali ke Beranda
            </button>
        </div>
    `;
    injectContent(html);
    console.log("Script Injeksi: Konten 404 diinjeksi.");
};
