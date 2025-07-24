// sidebar-search.js

// Pastikan window.postMap sudah diinisialisasi secara global atau dimuat dari localStorage
// Ini diperlukan untuk fungsi resolveFigLink
window.postMap = window.postMap || {};

// Asumsi showMessageBox tersedia secara global dari estimation-modal.js
// Jika tidak, Anda perlu mendefinisikannya di sini atau memastikan urutan pemuatan skrip yang benar.
if (typeof window.showMessageBox !== 'function') {
    console.warn("Fungsi 'showMessageBox' tidak ditemukan. Pastikan estimation-modal.js dimuat dengan benar.");
    window.showMessageBox = function(message) { console.log("Toast (fallback):", message); };
}

/**
 * Fungsi utilitas untuk menormalisasi teks menjadi slug yang cocok dengan Blogger.
 * Menghapus semua spasi dan karakter non-alphanumeric, mengonversi ke huruf kecil.
 * @param {string} text - Teks yang akan dinormalisasi.
 * @returns {string} Slug yang dinormalisasi.
 */
function normalizeSlug(text) {
    // Pastikan normalizeSlug hanya mengizinkan huruf dan angka,
    // menghapus semua karakter lain termasuk garis miring, sesuai perilaku Blogger.
    return text?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
}

/**
 * Mengubah slug agar menghilangkan semua spasi, bukan menggantinya dengan tanda hubung
 * dan mencari URL postingan yang sesuai di window.postMap.
 * @param {Object} item - Objek item dengan properti judul_artikel.
 * @returns {string} URL postingan yang ditemukan atau URL fallback.
 */
function resolveFigLink(item) {
    const rawTitle = item.judul_artikel?.trim() || '';
    
    // Gunakan fungsi normalizeSlug yang sama untuk mencocokkan perilaku Blogger
    const slugFromSpreadsheet = normalizeSlug(rawTitle);
    
    let resolvedLink = '';
    let yearToUse = '';
    let monthToUse = '';

    console.log(`[resolveFigLink Debug] Input rawTitle from spreadsheet: "${rawTitle}"`);
    console.log(`[resolveFigLink Debug] Generated slug from spreadsheet for lookup: "${slugFromSpreadsheet}"`);

    // Coba cari di window.postMap berdasarkan slug yang dinormalisasi
    if (window.postMap?.[slugFromSpreadsheet]) {
        const postInfo = window.postMap[slugFromSpreadsheet];
        resolvedLink = postInfo.url; // Gunakan URL lengkap yang sudah tersimpan dari Blogger
        yearToUse = postInfo.year;
        monthToUse = postInfo.month;
        console.log(`[resolveFigLink Debug] Found match in postMap for slug "${slugFromSpreadsheet}". Resolved URL: ${resolvedLink}`);
    } else {
        // Fallback: Jika tidak ditemukan di postMap, gunakan tahun 2025 dan bulan 06 (Juni)
        // Sesuai permintaan Anda untuk menggunakan /2025/06/
        yearToUse = 2025; // Hardcode tahun 2025
        monthToUse = '06'; // Hardcode bulan 06 (Juni)
        // Pastikan URL fallback adalah URL absolut jika domain tidak cocok
        // Menggunakan window.location.origin untuk membuat URL absolut
        resolvedLink = `${window.location.origin}/${yearToUse}/${monthToUse}/${slugFromSpreadsheet}.html`; 
        console.warn(`[resolveFigLink Debug] No exact match in postMap for slug "${slugFromSpreadsheet}". Using fallback URL: ${resolvedLink}`);
    }
    return resolvedLink;
}

/**
 * Mengubah teks menjadi Title Case.
 * @param {string} text - Teks yang akan diubah.
 * @returns {string} Teks dalam Title Case.
 */
function titleCase(text) {
    if (!text) return '';
    return text.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Merender hasil pencarian FIG ke dalam HTML.
 * @param {Object} item - Objek item hasil pencarian.
 * @returns {string} String HTML yang dirender.
 */
function renderFigResult(item) {
    const link = resolveFigLink(item);
    const deskripsi = titleCase(item.deskripsi?.trim() || ''); // Terapkan titleCase di sini
    
    // LOGGING BARU: Tampilkan URL yang dihasilkan di konsol
    console.log(`[renderFigResult Debug] Generated link for "${item.judul_artikel}": "${link}"`);

    let html = `
        <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
            <h3 class="font-semibold text-blue-700">
                <a href="${link}" target="_blank" class="hover:underline no-spa"> <!-- target="_blank" dan no-spa untuk memastikan buka tab baru dan abaikan SPA -->
                    ${item.judul_artikel || 'Judul tidak tersedia'}
                </a>
            </h3>
            <p><strong>Kode Part:</strong><span class="bg-gray-100 px-2 py-0.5 rounded font-mono">${item.kodepart || 'N/A'}</span></p>`;
    
    // Tambahkan deskripsi hanya jika tidak kosong
    if (deskripsi) {
        html += `<p><strong>Deskripsi:</strong> ${deskripsi}</p>`;
    }

    html += `</div>`;
    return html;
}

/**
 * Fungsi utama untuk menjalankan pencarian FIG dari sidebar.
 * @param {string} query - Kata kunci pencarian.
 */
window.jalankanPencarianFigSidebar = function (query) {
    const hasilContainer = document.getElementById("searchOnlyContent");
    if (!hasilContainer) {
        console.warn("❌ Kontainer #searchOnlyContent tidak ditemukan.");
        return;
    }

    hasilContainer.classList.remove("hidden");

    if (!query) {
        hasilContainer.innerHTML = `<p class="text-gray-600 text-center">Masukkan kata kunci pada kolom pencarian untuk mencari kode part.</p>`;
        return;
    }

    hasilContainer.innerHTML = `
        <div class="text-sm text-gray-600 text-center mb-3">⏳ Mencari <strong>${query}</strong>...</div>`;

    // ✅ ID Spreadsheet
    const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 

    fetch(sheetURL)
        .then(res => {
            if (!res.ok) {
                if (res.status === 400) {
                    throw new Error(`Gagal ambil Sheet: ${res.status}. Pastikan Google Sheet Anda diatur untuk "Anyone with the link can view" dan ID Spreadsheet serta nama Sheet sudah benar.`);
                } else {
                    throw new Error(`Gagal ambil Sheet: ${res.status}`);
                }
            }
            return res.json();
        })
        .then(data => {
            const hasil = data.filter(row => {
                const q = query.toUpperCase();
                const kp = row.kodepart?.toUpperCase() || "";
                const ja = row.judul_artikel?.toUpperCase() || "";
                const ds = row.deskripsi?.toUpperCase() || "";
                return kp.includes(q) || ja.includes(q) || ds.includes(q);
            });

            if (hasil.length === 0) {
                hasilContainer.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                        ❌ Tidak ditemukan hasil untuk <strong>${query}</strong>
                    </div>`;
            } else {
                hasilContainer.innerHTML = `<div class="space-y-4">
                    ${hasil.map(renderFigResult).join('')}
                </div>`;
            }
        })
        .catch(err => {
            console.error("⚠️ Fetch gagal:", err);
            hasilContainer.innerHTML = `
                <div class="bg-red-100 border border-400 text-red-700 px-3 py-2 rounded">
                    ⚠️ Gagal memuat data Sheet. (${err.message})
                </div>`;
        });
};

// Pasang listener form pencarian di sidebar saat DOM siap
// Pastikan populatePostMap selesai sebelum ini berjalan
document.addEventListener('DOMContentLoaded', async function () {
    // Tunggu hingga populatePostMap selesai di utility.functions.js
    // Ini penting untuk memastikan window.postMap terisi sebelum digunakan
    if (typeof window.populatePostMap === 'function') {
        await window.populatePostMap();
        console.log("[sidebar-search.js] populatePostMap completed. Initializing sidebar search.");
    } else {
        console.warn("[sidebar-search.js] window.populatePostMap is not defined. Ensure utility.functions.js is loaded correctly and before this script.");
    }

    const sidebarForm = document.getElementById('sidebarSearchForm');
    const sidebarInput = document.getElementById('sidebarSearchInput');
    if (sidebarForm && sidebarInput) {
        sidebarForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = sidebarInput?.value?.trim()?.toUpperCase();
            if (query) window.jalankanPencarianFigSidebar(query);
        });
    }
});
