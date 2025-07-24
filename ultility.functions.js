// utility-functions.js

// Inisialisasi window.postMap secara global
window.postMap = window.postMap || {};

/**
 * Mengisi peta postingan (postMap) dengan judul postingan dan URL-nya.
 * Ini penting untuk navigasi SPA agar dapat menemukan URL postingan yang benar.
 */
window.populatePostMap = async function() {
    console.log("Memulai populatePostMap...");
    const postMappingHidden = document.getElementById('postMappingHidden');
    if (!postMappingHidden) {
        console.warn("Elemen #postMappingHidden tidak ditemukan. PostMap tidak dapat diisi.");
        return;
    }

    // Bersihkan postMap yang sudah ada
    window.postMap = {};

    // Ambil data dari elemen tersembunyi
    const links = postMappingHidden.querySelectorAll('a');
    links.forEach(link => {
        const title = link.textContent.trim();
        const url = link.href;

        // Ekstrak slug dari URL Blogger yang sebenarnya
        // Contoh URL: https://partsuzuki-motor.blogspot.com/2025/06/addressenginefig102a.html
        // Regex untuk mengambil bagian slug setelah tahun/bulan dan sebelum .html
        const urlMatch = url.match(/\/(\d{4})\/(\d{2})\/([a-z0-9]+)\.html$/);
        let slugFromUrl = '';
        let yearFromUrl = '';
        let monthFromUrl = '';

        if (urlMatch && urlMatch[3]) {
            yearFromUrl = urlMatch[1];
            monthFromUrl = urlMatch[2];
            slugFromUrl = urlMatch[3]; // Ini adalah slug yang sebenarnya dari URL Blogger
        } else {
            // Fallback: jika regex gagal, coba buat slug dari judul (kurang akurat)
            slugFromUrl = title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            console.warn(`[populatePostMap] Gagal mengekstrak slug dari URL: "${url}". Menggunakan slug dari judul: "${slugFromUrl}"`);
        }
        
        // Gunakan slug dari URL sebagai kunci di postMap
        // Simpan objek yang berisi URL lengkap, tahun, dan bulan
        window.postMap[slugFromUrl] = {
            url: url,
            year: yearFromUrl,
            month: monthFromUrl
        };
        console.log(`[populatePostMap] Title: "${title}" -> Extracted Slug: "${slugFromUrl}" (Year: ${yearFromUrl}, Month: ${monthFromUrl}) -> Actual URL: "${url}"`); // LOGGING TAMBAHAN
    });
    console.log("PostMap berhasil diisi:", window.postMap);
};

/**
 * Mengisi dropdown kategori kendaraan dari widget LinkList2 yang tersembunyi.
 */
window.populateVehicleCategoryDropdown = function() {
    console.log("Memulai populateVehicleCategoryDropdown...");
    const selectElement = document.getElementById('vehicleCategorySelect');
    const linkList2Widget = document.querySelector('#LinkList2 .widget-content ul'); // Ambil UL dari LinkList2

    if (!selectElement) {
        console.warn("Elemen #vehicleCategorySelect tidak ditemukan.");
        return;
    }
    if (!linkList2Widget) {
        console.warn("Widget LinkList2 tidak ditemukan atau kosong.");
        return;
    }

    // Bersihkan opsi yang sudah ada kecuali opsi default "Pilih Model Kendaraan"
    selectElement.innerHTML = '<option value="">Pilih Model Kendaraan</option>';

    // Isi dropdown dari LinkList2
    Array.from(linkList2Widget.children).forEach(li => {
        const anchor = li.querySelector('a');
        if (anchor) {
            const option = document.createElement('option');
            option.value = anchor.href;
            option.textContent = anchor.textContent.trim();
            selectElement.appendChild(option);
        }
    });
    console.log("Dropdown kategori kendaraan berhasil diisi.");
};

// Panggil fungsi-fungsi ini saat DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {
    await window.populatePostMap(); // Pastikan postMap terisi sebelum skrip lain membutuhkannya
    window.populateVehicleCategoryDropdown();
});
