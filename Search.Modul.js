// Inisialisasi window.postMap secara global
window.postMap = {};

// Fungsi untuk mengisi postMap
function populatePostMap() {
    return new Promise(resolve => {
        const postMappingContainer = document.getElementById('postMappingHidden');
        console.log("Memulai fungsi populatePostMap...");
        if (postMappingContainer) {
            console.log("Konten #postMappingHidden:", postMappingContainer.innerHTML);

            const links = postMappingContainer.querySelectorAll('a');
            console.log(`Ditemukan ${links.length} <a> tag di #postMappingHidden.`);

            links.forEach(link => {
                const title = link?.textContent?.trim();
                const url = link?.href;
                if (title && url) {
                    const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, '');
                    window.postMap[sanitizedTitle] = url;
                    console.log(`✅ Postingan Dipetakan: Judul Asli dari Blogger: "${title}" -> Kunci Sanitasi: "${sanitizedTitle}" -> URL: "${url}"`);
                } else {
                    console.warn(`⚠️ Melewati tautan karena judul atau URL hilang: TextContent="${link?.textContent}", Href="${link?.href}"`);
                }
            });
            console.log("Konten window.postMap akhir setelah mengisi dari Blogger:");
            console.table(window.postMap);
            localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap));
            console.log("✅ postMap disimpan ke localStorage.");
            resolve();
        } else {
            console.warn("❌ Kontainer #postMappingHidden tidak ditemukan. Widget ini harus ada di halaman indeks.");
            const posts = document.querySelectorAll('.post');
            console.log(`Ditemukan ${posts.length} .post artikel (fallback).`);
            posts.forEach(post => {
                const titleElement = post.querySelector('h1 a');
                const title = titleElement?.textContent?.trim();
                const url = titleElement?.href;
                if (title && url) {
                    const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, '');
                    window.postMap[sanitizedTitle] = url;
                    console.log(`✅ Postingan Dipetakan (Fallback): Judul Asli dari Blogger: "${title}" -> Kunci Sanitasi: "${sanitizedTitle}" -> URL: "${url}"`);
                } else {
                    console.warn(`⚠️ Melewati postingan fallback karena judul atau URL hilang: TitleElementText="${titleElement?.textContent}", Href="${titleElement?.href}"`);
                }
            });
            console.log("Konten window.postMap akhir setelah mengisi dari elemen .post yang terlihat (fallback):");
            console.table(window.postMap);
            localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap));
            console.log("✅ postMap (fallback) disimpan ke localStorage.");
            resolve();
        }
    });
}

// Fungsi untuk menyelesaikan tautan postingan
function resolveFigLink(item) {
    const slug = item.judul_artikel?.toLowerCase().trim().replace(/\s+/g, '');
    if (window.postMap?.[slug]) return window.postMap[slug];

    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    return `/${currentYear}/${currentMonth}/${slug}.html`;
}

// Fungsi untuk mengubah teks menjadi Title Case
function titleCase(text) {
    if (!text) return '';
    return text.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Render hasil pencarian fig
function renderFigResult(item) {
    const link = resolveFigLink(item);
    const deskripsi = titleCase(item.deskripsi?.trim() || '');
    let html = `
        <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
            <h3 class="font-semibold text-blue-700">
                <a href="${link}" target="_blank" class="hover:underline">
                    ${item.judul_artikel || 'Judul tidak tersedia'}
                </a>
            </h3>
            <p><strong>Kode Part:</strong><span class="bg-gray-100 px-2 py-0.5 rounded font-mono">${item.kodepart || 'N/A'}</span></p>`;

    if (deskripsi) {
        html += `<p><strong>Deskripsi:</strong> ${deskripsi}</p>`;
    }

    html += `</div>`;
    return html;
}

// Fungsi utama pencarian fig dari sidebar
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

/**
 * Fungsi inisialisasi untuk modul pencarian.
 */
window.initSearch = function() {
    // Muat mapping postMap dari localStorage jika tersedia
    try {
        const cached = localStorage.getItem('cachedPostMap');
        if (cached) {
            window.postMap = JSON.parse(cached);
            console.log("✅ Memuat postMap dari localStorage:", window.postMap);
        }
    } catch (e) {
        console.error("❌ Kesalahan saat memuat postMap dari localStorage:", e);
        window.postMap = {};
    }

    populatePostMap();

    // Pasang listener form pencarian di sidebar
    const sidebarForm = document.getElementById('sidebarSearchForm');
    const sidebarInput = document.getElementById('sidebarSearchInput');
    sidebarForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const query = sidebarInput?.value?.trim()?.toUpperCase();
        if (query) window.jalankanPencarianFigSidebar(query);
    });
};
