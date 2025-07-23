/**
 * Fungsi untuk memuat script eksternal secara dinamis.
 * Script akan dimuat secara async dan dieksekusi setelah diunduh.
 * @param {string} url - URL dari script yang akan dimuat.
 * @returns {Promise<void>} Promise yang akan diselesaikan ketika script berhasil dimuat.
 */
window.lazyLoadScript = function(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true; // Muat secara asynchronous
        script.onload = () => {
            console.log(`[LazyLoad] Script '${url}' berhasil dimuat.`);
            resolve();
        };
        script.onerror = () => {
            console.error(`[LazyLoad] Gagal memuat script: '${url}'.`);
            reject(new Error(`Gagal memuat script: ${url}`));
        };
        document.head.appendChild(script);
    });
};

/**
 * Fungsi untuk memuat gambar secara lazy loading menggunakan Intersection Observer.
 * Gambar akan dimuat hanya ketika mereka masuk ke dalam viewport.
 * @param {string} selector - Selector CSS untuk elemen gambar yang akan di-lazy load (misalnya, 'img.lazy').
 */
window.lazyLoadImages = function(selector = 'img.lazy') {
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll(selector);
        const imageObserver = new IntersectionObserver(function(entries, observer) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const originalSrc = image.dataset.src; // Ambil URL dari data-src
                    if (originalSrc) {
                        image.src = originalSrc; // Set src gambar
                        image.removeAttribute('data-src'); // Hapus atribut data-src
                        image.classList.remove('lazy'); // Hapus kelas lazy
                    }
                    observer.unobserve(image); // Berhenti mengamati gambar ini
                    console.log(`[LazyLoad] Gambar '${image.src}' dimuat.`);
                }
            });
        });

        lazyImages.forEach(function(image) {
            imageObserver.observe(image);
        });
        console.log(`[LazyLoad] Intersection Observer diatur untuk gambar dengan selector: '${selector}'.`);
    } else {
        // Fallback untuk browser yang tidak mendukung Intersection Observer
        console.warn("[LazyLoad] Intersection Observer tidak didukung. Memuat semua gambar secara langsung (fallback).");
        document.querySelectorAll(selector).forEach(function(image) {
            const originalSrc = image.dataset.src;
            if (originalSrc) {
                image.src = originalSrc;
                image.removeAttribute('data-src');
                image.classList.remove('lazy');
            }
        });
    }
};

/**
 * Fungsi inisialisasi untuk modul lazy load.
 */
window.initLazyLoad = function() {
    // Panggil lazyLoadImages di sini jika ada gambar yang perlu di-lazy load
    // secara default saat halaman dimuat.
    // window.lazyLoadImages();
};
