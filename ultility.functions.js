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
        // PERBAIKAN PENTING: Normalisasi judul menjadi slug dengan MENGHILANGKAN spasi, bukan mengganti dengan tanda hubung.
        // Ini sesuai dengan perilaku default Blogger untuk permalink.
        const slug = title.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, ''); // Hapus semua spasi dan karakter non-alphanumeric
        window.postMap[slug] = url;
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
