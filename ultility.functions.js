// utility-functions.js

// Inisialisasi window.postMap secara global
window.postMap = window.postMap || {};

/**
 * Fungsi utilitas untuk menormalisasi teks menjadi slug yang cocok dengan Blogger.
 * Menghapus semua spasi dan karakter non-alphanumeric, mengonversi ke huruf kecil.
 * @param {string} text - Teks yang akan dinormalisasi.
 * @returns {string} Slug yang dinormalisasi.
 */
function normalizeSlug(text) {
    return text?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
}

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

        // Ekstrak bagian slug dari URL Blogger yang sebenarnya (misal: addressenginefig102a)
        // Regex untuk menangkap bagian setelah tahun/bulan dan sebelum .html
        const urlMatch = url.match(/\/(\d{4})\/(\d{2})\/(.+?)\.html$/);
        let extractedSlugFromUrl = '';
        let yearFromUrl = '';
        let monthFromUrl = '';

        if (urlMatch && urlMatch[3]) {
            yearFromUrl = urlMatch[1];
            monthFromUrl = urlMatch[2];
            // PERBAIKAN: Normalisasi slug yang diekstrak dari URL Blogger
            // Ini akan menghapus semua karakter non-alphanumeric dari slug,
            // termasuk garis miring jika ada (sesuai perilaku Blogger).
            extractedSlugFromUrl = normalizeSlug(urlMatch[3]);
        } else {
            // Fallback: jika regex gagal, coba buat slug dari judul (kurang akurat)
            extractedSlugFromUrl = normalizeSlug(title);
            console.warn(`[populatePostMap Debug] Gagal mengekstrak slug dari URL: "${url}". Menggunakan slug dari judul: "${extractedSlugFromUrl}"`);
        }
        
        // Gunakan slug yang sudah dinormalisasi sebagai kunci di postMap
        // Simpan objek yang berisi URL lengkap, tahun, dan bulan
        window.postMap[extractedSlugFromUrl] = {
            url: url,
            year: yearFromUrl,
            month: monthFromUrl
        };
        console.log(`[populatePostMap Debug] Title from Blogger: "${title}" -> Extracted & Normalized Slug: "${extractedSlugFromUrl}" (Year: ${yearFromUrl}, Month: ${monthFromUrl}) -> Actual URL: "${url}"`);
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
