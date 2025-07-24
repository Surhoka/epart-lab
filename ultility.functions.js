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

        // Ekstrak slug, tahun, dan bulan dari URL Blogger yang sebenarnya
        // Contoh URL: https://partsuzuki-motor.blogspot.com/2025/06/addressenginefig102a.html
        // Regex yang lebih fleksibel untuk menangani permalink kustom atau standar Blogger
        const urlMatch = url.match(/\/(\d{4})\/(\d{2})\/(.+?)\.html$/); // Menangkap apapun setelah bulan dan sebelum .html
        let slugFromUrl = '';
        let yearFromUrl = '';
        let monthFromUrl = '';

        if (urlMatch && urlMatch[3]) {
            yearFromUrl = urlMatch[1];
            monthFromUrl = urlMatch[2];
            // Slug yang diekstrak mungkin masih mengandung tanda hubung atau slash jika itu permalink kustom
            // Kita akan menormalisasi ini agar sesuai dengan format yang kita inginkan untuk kunci map
            slugFromUrl = urlMatch[3].replace(/[^a-z0-9]/g, ''); // Hapus semua karakter non-alphanumeric dari slug yang diekstrak
        } else {
            // Fallback: jika regex gagal, coba buat slug dari judul (kurang akurat)
            slugFromUrl = title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
            console.warn(`[populatePostMap Debug] Gagal mengekstrak slug dari URL: "${url}". Menggunakan slug dari judul: "${slugFromUrl}"`);
        }
        
        // Gunakan slug yang sudah dinormalisasi sebagai kunci di postMap
        // Simpan objek yang berisi URL lengkap, tahun, dan bulan
        window.postMap[slugFromUrl] = {
            url: url,
            year: yearFromUrl,
            month: monthFromUrl
        };
        console.log(`[populatePostMap Debug] Title from Blogger: "${title}" -> Extracted & Normalized Slug: "${slugFromUrl}" (Year: ${yearFromUrl}, Month: ${monthFromUrl}) -> Actual URL: "${url}"`);
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
