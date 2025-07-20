// Define a global variable for Blogger's base URL.
// This will be set from the Blogger template HTML using <data:blog.url/>
// Default to current origin, will be overridden by Blogger
window.BLOGGER_BASE_URL = window.location.origin; 

// Fungsi utilitas untuk menambahkan kelas dengan aman
function safeAddClass(element, ...classNames) {
    if (element && element.classList) {
        element.classList.add(...classNames);
    }
}

// Implementasi kotak pesan kustom (pengganti alert/confirm)
const customToast = document.getElementById('customToast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout;

function showMessageBox(message) {
    if (customToast && toastMessage) {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        customToast.style.display = 'block';
        customToast.classList.add('show');
        toastTimeout = setTimeout(() => {
            customToast.classList.remove('show');
            setTimeout(() => {
                customToast.style.display = 'none';
            }, 400); // Durasi transisi opacity
        }, 3000); // Durasi tampil pesan
    }
}

// Cache konten untuk SPA
const contentCache = {};

// Function to check if running in Canvas preview environment
function isCanvasPreview() {
    // Check if the current hostname includes the Canvas preview domain pattern
    return window.location.hostname.includes('scf.usercontent.goog') || 
           (window.location.ancestorOrigins && Array.from(window.location.ancestorOrigins).some(origin => origin.includes('scf.usercontent.goog')));
}


async function preloadContent(url) {
    // If running in Canvas preview, skip actual fetch and log a warning
    if (isCanvasPreview()) {
        console.warn("⚠️ Running in Canvas preview. Skipping content preloading for SPA functionality.");
        return; // Do not attempt to fetch in Canvas
    }

    // Ensure the URL is relative to the Blogger blog's base URL
    const finalUrl = new URL(url, window.BLOGGER_BASE_URL).href;

    if (contentCache[finalUrl] || contentCache[finalUrl] === null) {
        return;
    }
    contentCache[finalUrl] = null;
    try {
        console.log(`🚀 Preloading content for: ${finalUrl}`);
        const response = await fetch(finalUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        contentCache[finalUrl] = html;
        console.log(`✅ Preloaded: ${finalUrl}`);
    } catch (error) {
        console.error(`❌ Failed to preload ${finalUrl}:`, error);
        delete contentCache[finalUrl];
    }
}

// Fungsi untuk membuat menu dropdown bertingkat
function createNestedMenu(items, startIndex, currentLevel) {
    const currentLevelUl = document.createElement('ul');
    let i = startIndex;
    while (i < items.length) {
        const item = items[i];
        const itemName = item.name.trim();
        const leadingUnderscores = (itemName.match(/^_+/) || [''])[0].length;
        const cleanName = itemName.replace(/^_+/, ''); // Hapus underscore dari nama

        console.log(`📌 [createMenu] Level: ${currentLevel}, Item: "${cleanName}", Underscores: ${leadingUnderscores}`);

        if (leadingUnderscores === currentLevel) {
            const li = document.createElement('li');
            const isTopLevel = currentLevel === 0;
            safeAddClass(li, 'relative', `depth-${currentLevel}`, 'group', ...(isTopLevel ? ['w-full', 'md:w-auto'] : ['w-full']));

            const anchor = document.createElement('a');
            anchor.href = item.target;
            anchor.textContent = cleanName;
            safeAddClass(anchor, 'main-menu-item');

            // Preload konten saat mouse hover
            anchor.addEventListener('mouseenter', () => preloadContent(item.target));

            const nextItem = items[i + 1];
            const nextLevel = nextItem && (nextItem.name.trim().match(/^_+/) || [''])[0].length;

            if (nextLevel > currentLevel) {
                // Ini adalah item dengan submenu
                safeAddClass(anchor, 'flex', 'items-center', 'justify-between', 'dropdown-toggle');

                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                arrow.setAttribute('class', 'w-4 h-4 ml-1 transform transition-transform duration-200 dropdown-arrow');
                arrow.setAttribute('fill', 'none');
                arrow.setAttribute('stroke', 'currentColor');
                arrow.setAttribute('viewBox', '0 0 24 24');
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('d', 'M19 9l-7 7-7-7');
                arrow.appendChild(path);
                anchor.appendChild(arrow);

                li.appendChild(anchor);

                const nested = createNestedMenu(items, i + 1, currentLevel + 1);
                const subUl = nested.ul;
                safeAddClass(subUl, `depth-${currentLevel + 1}`, 'py-2', 'w-full'); // Tambahkan padding vertikal
                safeAddClass(subUl, currentLevel === 0 ? 'dropdown-menu' : 'dropdown-submenu');
                li.appendChild(subUl);

                // Toggle dropdown visibility on click for mobile
                anchor.addEventListener('click', (e) => {
                    e.preventDefault(); // Mencegah navigasi langsung
                    li.classList.toggle('show-dropdown');
                });

                i = nested.nextIndex - 1; // Lompati item yang sudah ditangani oleh rekursi
            } else {
                li.appendChild(anchor);
            }
            currentLevelUl.appendChild(li);
            i++;
        } else if (leadingUnderscores < currentLevel) {
            console.log(`↩ [createMenu] Returning from level ${currentLevel} to ${leadingUnderscores}.`);
            break; // Kembali ke level sebelumnya
        } else {
            console.warn(`✳ Menu "${itemName}" skips a level. Skipping.`);
            i++; // Lanjutkan ke item berikutnya
        }
    }
    return { ul: currentLevelUl, nextIndex: i };
}

// Fungsi untuk membangun struktur pohon menu dari daftar link
const buildTree = (links) => {
    const tree = [];
    const parents = []; // Stack untuk melacak parent di setiap kedalaman

    links.forEach(raw => {
        const depth = (raw.name.trim().match(/^_+/) || [''])[0].length;
        const name = raw.name.replace(/^_*/, ''); // Hapus underscore dari nama

        const node = {
            name: name,
            href: raw.target,
            children: []
        };

        if (depth === 0) {
            tree.push(node);
            parents[0] = node; // Set parent untuk kedalaman 0
        } else {
            const parent = parents[depth - 1]; // Ambil parent dari kedalaman sebelumnya
            if (parent) {
                parent.children.push(node);
                parents[depth] = node; // Set parent untuk kedalaman saat ini
            } else {
                console.warn(`⚠️ Item "${name}" (depth ${depth}) has no corresponding parent.`);
            }
        }
    });
    return tree;
};


// Inisialisasi menu navigasi
const mobileMenuButtonInNav = document.getElementById('mobile-menu-button-in-nav');
const mainMenuNav = document.getElementById('main-menu-nav');

// Ambil data awal dari b:loop Blogger
const initialLinks = Array.from(mainMenuNav.children).map(li => {
    const anchor = li.querySelector('a');
    return {
        name: anchor ? anchor.getAttribute('data-original-name') || anchor.textContent.trim() : '',
        target: anchor ? anchor.href : '#',
        element: li // Simpan referensi ke elemen li asli
    };
}).filter(link => link.name); // Filter link yang mungkin kosong

console.log('Initial Links from b:loop (main-menu-nav):', initialLinks);

// Kosongkan menu yang sudah dirender oleh Blogger
while (mainMenuNav.firstChild) {
    mainMenuNav.removeChild(mainMenuNav.firstChild);
}

// Bangun dan render ulang menu menggunakan fungsi createNestedMenu
if (initialLinks.length) {
    const finalMenuUlContent = createNestedMenu(initialLinks, 0, 0).ul;
    // Pindahkan children dari finalMenuUlContent ke mainMenuNav
    while (finalMenuUlContent.firstChild) {
        mainMenuNav.appendChild(finalMenuUlContent.firstChild);
    }
    console.log('Main menu rendered (desktop and mobile structure).');
} else {
    console.log('No initial links found to render menus. Please check your Blogger LinkList widget settings.');
}

// Event listener untuk tombol menu mobile
if (mobileMenuButtonInNav && mainMenuNav) {
    mobileMenuButtonInNav.addEventListener('click', function() {
        mainMenuNav.classList.toggle('show');
    });
}

// Tutup menu mobile/dropdown saat klik di luar
document.addEventListener('click', function(e) {
    // Tutup menu mobile jika terbuka dan klik di luar
    if (mainMenuNav && mainMenuNav.classList.contains('show') && !mainMenuNav.contains(e.target) && e.target !== mobileMenuButtonInNav) {
        mainMenuNav.classList.remove('show');
    }

    // Tutup dropdown menu jika terbuka dan klik di luar
    document.querySelectorAll('.group.show-dropdown').forEach(liWithDropdown => {
        const dropdownMenu = liWithDropdown.querySelector('.dropdown-menu, .dropdown-submenu');
        const dropdownToggle = liWithDropdown.querySelector('.dropdown-toggle'); // Dapatkan elemen toggle
        // Pastikan klik tidak di dalam dropdown menu atau pada toggle-nya
        if (dropdownMenu && !liWithDropdown.contains(e.target)) {
            liWithDropdown.classList.remove('show-dropdown');
        }
    });
});


// Logic untuk Dropdown Kategori Kendaraan
const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
const linkList2Data = document.querySelector('#LinkList2 .widget-content ul'); // Ambil data dari LinkList2 yang tersembunyi
const mainContentSection = document.getElementById('main-content-section');
const promoGallerySection = document.getElementById('PromoGallery');

function populateVehicleCategoryDropdown() {
    if (linkList2Data && vehicleCategorySelect) {
        vehicleCategorySelect.innerHTML = '<option value="">Pilih Model Kendaraan</option>'; // Reset
        const categoryLinks = Array.from(linkList2Data.querySelectorAll('li a'));
        categoryLinks.forEach(link => {
            const categoryName = link.textContent.trim();
            const categoryUrl = link.href;
            if (categoryName) {
                const option = document.createElement('option');
                option.value = categoryUrl;
                option.textContent = categoryName;
                vehicleCategorySelect.appendChild(option);
            }
        });

        // Set nilai dropdown sesuai URL saat ini
        const currentPath = window.location.pathname + window.location.search;
        const selectedOption = Array.from(vehicleCategorySelect.options).find(option => option.value === currentPath);
        if (selectedOption) {
            selectedOption.selected = true;
        }
    } else {
        console.warn('WARNING: LinkList2 data element or vehicleCategorySelect dropdown not found to populate vehicle categories.');
    }
}

// Fungsi utama untuk memuat konten via AJAX (SPA)
async function loadContentForUrl(url, pushState = true) {
    // If running in Canvas preview, skip actual fetch and display a message
    if (isCanvasPreview()) {
        console.warn("⚠️ Running in Canvas preview. SPA content loading is limited. Displaying static content.");
        const postsWrapper = mainContentSection.querySelector('.posts-wrapper');
        if (postsWrapper) {
            postsWrapper.innerHTML = `
                <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Informasi:</strong>
                    <span class="block sm:inline">Fungsionalitas SPA (Single Page Application) tidak berfungsi penuh di lingkungan pratinjau Canvas. Silakan uji di blog Blogger Anda yang sebenarnya.</span>
                </div>
            `;
        }
        return; // Do not attempt to fetch in Canvas
    }

    // Ensure the URL is relative to the Blogger blog's base URL
    const finalUrl = new URL(url, window.BLOGGER_BASE_URL).href;

    console.log(`Loading content for URL: ${finalUrl}`);
    try {
        const postsWrapper = mainContentSection.querySelector('.posts-wrapper');
        if (!postsWrapper) {
            console.error("Error: .posts-wrapper not found in main-content-section.");
            // Tampilkan pesan error di main-content-section jika posts-wrapper tidak ditemukan
            mainContentSection.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Error!</strong>
                    <span class="block sm:inline">Struktur konten utama tidak ditemukan.</span>
                </div>
              `;
            return;
        }

        // Tampilkan loading spinner
        postsWrapper.innerHTML = `
            <div class="text-center py-8 text-gray-600">
                <i class="fas fa-spinner fa-spin text-2xl mb-4"></i>
                <p>Memuat konten...</p>
            </div>
          `;

        // Atur visibilitas promo gallery
        const isHomePage = (url === '/' || url === window.BLOGGER_BASE_URL || url === new URL('/', window.BLOGGER_BASE_URL).href);
        if (promoGallerySection) {
            if (isHomePage) {
                promoGallerySection.style.display = 'grid'; // Tampilkan promo gallery di homepage
            } else {
                promoGallerySection.style.display = 'none'; // Sembunyikan di halaman lain
            }
        }

        let newPageTitle = document.title;
        let fetchedHtmlContent = null;

        // Cek cache sebelum fetch
        if (contentCache[finalUrl]) { // Use finalUrl for cache key
            fetchedHtmlContent = contentCache[finalUrl];
            console.log(`✅ Using cached content for: ${finalUrl}`);
            // Hapus dari cache setelah digunakan jika ingin meminimalkan memori,
            // atau biarkan jika ingin memaksimalkan kecepatan untuk navigasi bolak-balik.
            // Untuk kasus ini, kita biarkan di cache.
            // delete contentCache[finalUrl];
        } else {
            // Lakukan fetch jika tidak ada di cache
            const response = await fetch(finalUrl); // Use finalUrl for fetch
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} from ${finalUrl}`); // Error message also uses finalUrl
            }
            fetchedHtmlContent = await response.text();
            console.log(`⬇️ Fetched fresh content for: ${finalUrl}`);
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(fetchedHtmlContent, 'text/html');

        // Jika homepage, kosongkan postsWrapper dan set judul default
        if (isHomePage) {
            postsWrapper.innerHTML = '';
            newPageTitle = '<data:blog.title/>'; // Gunakan judul blog default dari Blogger
        } else {
            // Ambil konten postingan dari dokumen yang baru dimuat
            const newPostsWrapper = doc.querySelector('#main-content-section .posts-wrapper');
            if (newPostsWrapper) {
                // Pindahkan node anak dari newPostsWrapper ke postsWrapper
                const fragment = document.createDocumentFragment();
                while (newPostsWrapper.firstChild) {
                    fragment.appendChild(newPostsWrapper.firstChild);
                }
                postsWrapper.innerHTML = ""; // Kosongkan dulu
                postsWrapper.appendChild(fragment);
            } else {
                postsWrapper.innerHTML = `
                      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-blue-600 text-sm">
                          Konten tidak tersedia atau tidak dapat dimuat.
                      </div>
                  `;
            }
            // Ambil judul halaman baru
            newPageTitle = doc.querySelector('title')?.textContent || newPageTitle;
        }

        // Perbarui judul halaman
        document.title = newPageTitle;

        // Perbarui URL di browser tanpa reload
        if (pushState) {
            history.pushState({ path: url, title: newPageTitle }, newPageTitle, url);
        }

        // Perbarui pilihan dropdown kategori kendaraan
        if (vehicleCategorySelect) {
            const selectedOption = Array.from(vehicleCategorySelect.options).find(option => option.value === url);
            if (selectedOption) {
                selectedOption.selected = true;
            } else {
                vehicleCategorySelect.value = ''; // Reset jika tidak ada yang cocok
            }
        }

        // Refresh SPA content (lazy loading, link listeners)
        refreshSPAContent();

        console.log(`Content loaded for ${finalUrl}. Page title updated to: ${document.title}`);

    } catch (error) {
        console.error('Error loading content:', error);
        if (mainContentSection) {
            const postsWrapper = mainContentSection.querySelector('.posts-wrapper');
            if (postsWrapper) {
                postsWrapper.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong class="font-bold">Error!</strong>
                        <span class="block sm:inline">Gagal memuat konten: ${error.message}.</span>
                        <span class="block sm:inline">Coba muat ulang halaman.</span>
                    </div>
                  `;
            } else {
                // Fallback jika postsWrapper juga tidak ada (sangat tidak mungkin)
                mainContentSection.innerHTML = `
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong class="font-bold">Error!</strong>
                        <span class="block sm:inline">Gagal memuat konten: ${error.message}.</span>
                        <span class="block sm:inline">Coba muat ulang halaman.</span>
                    </div>
                  `;
            }
        }
    }
}

// Event listener untuk perubahan dropdown kategori
if (vehicleCategorySelect) {
    vehicleCategorySelect.addEventListener('change', function() {
        const selectedUrl = this.value;
        if (selectedUrl) {
            loadContentForUrl(selectedUrl);
        } else {
            loadContentForUrl('/'); // Kembali ke homepage jika "Pilih Model Kendaraan" dipilih
        }
    });
}

// Tangani event popstate (saat tombol back/forward browser ditekan)
window.addEventListener('popstate', function(event) {
    console.log('Popstate event triggered. State:', event.state);
    // Muat konten untuk URL saat ini dari history (tanpa pushState baru)
    // Use window.location.pathname + window.location.search here as it reflects the browser's current URL
    loadContentForUrl(window.location.pathname + window.location.search, false);
});


// --- Logic untuk Modal Estimasi ---
const openEstimasiModalBtn = document.getElementById('openEstimasiModal');

if (openEstimasiModalBtn) {
    const estimasiModal = document.getElementById('estimasiModal');
    const closeEstimasiModalBtn = document.getElementById('closeEstimasiModal');
    const estimasiTableBody = document.getElementById('estimasiTableBody');
    const estimasiModalContent = document.getElementById('estimasiModalContent');
    const headerTableWrapper = document.querySelector('.header-table-wrapper');
    const bodyTableWrapper = document.querySelector('.body-table-wrapper');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Elemen input dan tombol untuk baris input part baru
    let newPartKodePartInput;
    let newPartDeskripsiInput;
    let newPartQtyInput;
    let newPartHargaInput;
    let addPartBtn;

    // Elemen untuk modal Kirim Estimasi (nested modal)
    const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
    const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
    const estimasiForm = document.getElementById('estimasiForm');


    let estimasiItems = []; // Array untuk menyimpan item estimasi

    // Fungsi untuk memuat data estimasi dari Local Storage
    function loadEstimasiFromLocalStorage() {
        const storedData = localStorage.getItem('estimasiData');
        if (storedData) {
            try {
                estimasiItems = JSON.parse(storedData);
            } catch (e) {
                console.error("Error parsing estimasi data from localStorage:", e);
                estimasiItems = []; // Reset jika ada error parsing
            }
        } else {
            // Jika tidak ada data di local storage, biarkan estimasiItems kosong
        }
    }

    // Fungsi untuk menyimpan data estimasi ke Local Storage
    function saveEstimasiToLocalStorage() {
        localStorage.setItem('estimasiData', JSON.stringify(estimasiItems));
    }

    // Fungsi untuk menambah atau mengupdate item estimasi
    function addEstimasiItem(newItem, isIncrement = true) {
        if (!newItem || !newItem.kodePart || !newItem.deskripsi || !newItem.qty || !newItem.harga) {
            console.warn("Data item tidak lengkap:", newItem);
            return;
        }

        const kodeBaru = newItem.kodePart.trim().toUpperCase();
        const deskripsiBaru = newItem.deskripsi.trim();
        const qtyBaru = newItem.qty;
        const hargaBaru = newItem.harga;

        const existingIndex = estimasiItems.findIndex(item =>
            item.kodePart.trim().toUpperCase() === kodeBaru && item.deskripsi.trim() === deskripsiBaru
        );

        if (existingIndex !== -1) {
            if (isIncrement) {
                estimasiItems[existingIndex].qty += qtyBaru;
                showMessageBox(`Qty untuk part '${deskripsiBaru}' ditambahkan jadi ${estimasiItems[existingIndex].qty}x`);
            } else {
                estimasiItems[existingIndex].qty -= qtyBaru;
                if (estimasiItems[existingIndex].qty <= 0) {
                    const removedItem = estimasiItems.splice(existingIndex, 1);
                    showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) dihapus dari keranjang.`);
                } else {
                    showMessageBox(`Qty untuk part '${deskripsiBaru}' dikurangi jadi ${estimasiItems[existingIndex].qty}x`);
                }
            }
        } else if (isIncrement) {
            estimasiItems.push({
                kodePart: kodeBaru,
                deskripsi: deskripsiBaru,
                qty: qtyBaru,
                harga: hargaBaru
            });
            showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) ditambahkan ke keranjang dengan ${qtyBaru}x`);
        } else {
            showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) tidak ditemukan di keranjang.`);
        }
        saveEstimasiToLocalStorage();
        renderEstimasiTable(); // Render ulang tabel setelah perubahan
    }

    // Fungsi untuk merender ulang tabel estimasi
    function renderEstimasiTable() {
        const estimasiTableBody = document.getElementById('estimasiTableBody');
        if (!estimasiTableBody) return; // Pastikan elemen ada

        estimasiTableBody.innerHTML = ''; // Kosongkan tabel
        let totalBelanja = 0;
        let totalQuantity = 0;

        estimasiItems.forEach((item, index) => {
            const jumlah = item.qty * item.harga;
            totalBelanja += jumlah;
            totalQuantity += item.qty;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4 text-center">${index + 1}</td>
                <td class="py-2 px-4 text-center">${item.kodePart}</td>
                <td class="py-2 px-4 deskripsi-cell" title="${item.deskripsi}">${item.deskripsi}</td>
                <td class="py-2 px-4 text-center">
                    <div class="inline-flex items-center justify-center relative">
                        <input type="number" class="qty-input-table w-16 text-center" value="${item.qty}" min="1" data-index="${index}" />
                        <div class="absolute right-0 flex flex-col">
                            <button class="qty-btn-up text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">+</button>
                            <button class="qty-btn-down text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">-</button>
                        </div>
                    </div>
                </td>
                <td class="py-2 px-4 text-right">
                    <input type="text" class="price-input-table" value="Rp ${item.harga.toLocaleString('id-ID')}" data-index="${index}" />
                </td>
                <td class="py-2 px-4 text-right">Rp ${jumlah.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-center">
                    <button class="delete-item-btn text-gray-500 hover:text-red-600 transition duration-200" title="Hapus" data-index="${index}">
                        <i class="fas fa-trash-alt text-lg"></i>
                    </button>
                </td>
            `;
            estimasiTableBody.appendChild(row);
        });

        // Baris input part baru
        const newPartRow = document.createElement('tr');
        newPartRow.classList.add('estimasi-input-row');
        newPartRow.innerHTML = `
            <td class="text-center text-gray-400">#</td>
            <td><input type="text" id="newPartKodePart" placeholder="Kode Part" /></td>
            <td><input type="text" id="newPartDeskripsi" placeholder="Deskripsi" readonly /></td> <!-- Added readonly here -->
            <td><input type="number" id="newPartQty" placeholder="Qty" value="1" min="1" /></td>
            <td><input type="text" id="newPartHarga" placeholder="Harga" /></td>
            <td class="text-center text-gray-400">Auto</td>
            <td class="text-center">
                <button id="addPartBtn" class="bg-blue-500 hover:bg-blue-600 text-white">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        `;
        estimasiTableBody.appendChild(newPartRow);

        // Ambil referensi elemen input dan tombol setelah dirender
        newPartKodePartInput = document.getElementById('newPartKodePart');
        newPartDeskripsiInput = document.getElementById('newPartDeskripsi');
        newPartQtyInput = document.getElementById('newPartQty');
        newPartHargaInput = document.getElementById('newPartHarga');
        addPartBtn = document.getElementById('addPartBtn');

        // Tambahkan event listener untuk tombol tambah part baru
        if (addPartBtn) {
            addPartBtn.onclick = function() {
                const kodePart = newPartKodePartInput.value.trim();
                const deskripsi = newPartDeskripsiInput.value.trim();
                const qty = parseInt(newPartQtyInput.value, 10);
                const hargaStr = newPartHargaInput.value.replace(/[^0-9]/g, ''); // Hapus semua non-digit
                const harga = parseInt(hargaStr, 10);

                if (kodePart && deskripsi && !isNaN(qty) && qty > 0 && !isNaN(harga) && harga >= 0) {
                    const newItem = { kodePart, deskripsi, qty, harga };
                    addEstimasiItem(newItem, true); // Tambah item baru
                    // Reset input fields
                    newPartKodePartInput.value = '';
                    newPartDeskripsiInput.value = '';
                    newPartQtyInput.value = '1';
                    newPartHargaInput.value = '';
                } else {
                    showMessageBox('Mohon lengkapi semua kolom input part baru dengan benar (Kode Part, Deskripsi, Qty > 0, Harga >= 0).');
                }
            };
        }

        // Event listener untuk input Kode Part (auto-fill deskripsi dan harga)
        if (newPartKodePartInput) {
            newPartKodePartInput.addEventListener('change', async function() {
                const kodePart = this.value.trim().toUpperCase();
                if (kodePart) {
                    const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; // Ganti dengan URL sheet Anda
                    try {
                        const res = await fetch(sheetURL);
                        if (!res.ok) {
                            throw new Error(`Failed to fetch sheet: ${res.status}`);
                        }
                        const data = await res.json();
                        const foundPart = data.find(row => row.kodepart?.toUpperCase() === kodePart);

                        if (foundPart) {
                            newPartDeskripsiInput.value = foundPart.deskripsi || '';
                            newPartHargaInput.value = `Rp ${parseInt(foundPart.harga || 0, 10).toLocaleString('id-ID')}`;
                            showMessageBox(`Part '${foundPart.deskripsi}' ditemukan.`);
                        } else {
                            newPartDeskripsiInput.value = '';
                            newPartHargaInput.value = '';
                            showMessageBox(`Kode Part '${kodePart}' tidak ditemukan.`);
                        }
                    } catch (error) {
                        console.error("Error fetching part data:", error);
                        showMessageBox(`Gagal mencari kode part: ${error.message}`);
                    }
                } else {
                    newPartDeskripsiInput.value = '';
                    newPartHargaInput.value = '';
                }
            });
        }

        // Format input harga saat blur dan hapus format saat focus
        if (newPartHargaInput) {
            newPartHargaInput.onblur = function() {
                const value = this.value.replace(/[^0-9]/g, ''); // Hapus semua non-digit
                if (value) {
                    this.value = `Rp ${parseInt(value, 10).toLocaleString('id-ID')}`;
                }
            };
            newPartHargaInput.onfocus = function() {
                this.value = this.value.replace(/[^0-9]/g, ''); // Hapus semua non-digit
            };
        }


        // Baris total belanja
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="5" class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Total:</td>
            <td class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
            <td class="py-2 px-4 border-t border-gray-200 text-sm"></td>
        `;
        estimasiTableBody.appendChild(totalRow);

        // Event listener untuk input Qty
        document.querySelectorAll('.qty-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newQty = parseInt(e.target.value, 10);
                const idx = parseInt(e.target.dataset.index);
                if (!isNaN(newQty) && newQty > 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty = newQty;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi ${newQty}x`);
                } else {
                    if (newQty <= 0 && idx >= 0 && idx < estimasiItems.length) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1); // Hapus item jika qty <= 0
                        showMessageBox(`Part '${namaItem}' telah dihapus dari keranjang.`);
                    } else {
                        showMessageBox(`Qty tidak valid. Masukkan angka lebih dari 0.`);
                    }
                    e.target.value = estimasiItems[idx].qty; // Kembalikan nilai sebelumnya jika tidak valid
                }
            });
        });

        // Event listener untuk input Harga
        document.querySelectorAll('.price-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newPriceString = e.target.value.replace(/[^0-9]/g, ''); // Hapus semua non-digit
                const newPrice = parseInt(newPriceString, 10);
                const idx = parseInt(e.target.dataset.index);
                if (!isNaN(newPrice) && newPrice >= 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].harga = newPrice;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Harga untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi Rp ${newPrice.toLocaleString('id-ID')}`);
                } else {
                    showMessageBox(`Harga tidak valid. Masukkan angka yang benar.`);
                    e.target.value = `Rp ${estimasiItems[idx].harga.toLocaleString('id-ID')}`; // Kembalikan nilai sebelumnya
                }
            });
        });

        // Event listener untuk tombol hapus item
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                let idx = parseInt(e.target.dataset.index);
                // Jika klik pada ikon di dalam tombol, ambil data-index dari parent button
                if (isNaN(idx)) {
                    const parentButton = e.target.closest('button');
                    if (parentButton) {
                        idx = parseInt(parentButton.dataset.index);
                    }
                }
                if (idx >= 0 && idx < estimasiItems.length) {
                    const namaItem = estimasiItems[idx].deskripsi;
                    estimasiItems.splice(idx, 1);
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                }
            });
        });

        // Event listener untuk tombol Qty Up
        document.querySelectorAll('.qty-btn-up').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty++;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' ditambahkan jadi ${estimasiItems[idx].qty}x`);
                }
            });
        });

        // Event listener untuk tombol Qty Down
        document.querySelectorAll('.qty-btn-down').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty--;
                    if (estimasiItems[idx].qty <= 0) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Item '${namaItem}' telah dihapus dari keranjang.`);
                    } else {
                        showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' dikurangi jadi ${estimasiItems[idx].qty}x`);
                    }
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                }
            });
        });

        // Update badge kuantitas di tombol "Estimasi"
        const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');
        if (estimasiQtyBadge) {
            estimasiQtyBadge.textContent = totalQuantity.toString();
            if (totalQuantity > 0) {
                estimasiQtyBadge.classList.add('show-badge');
            } else {
                estimasiQtyBadge.classList.remove('show-badge');
            }
        }

        // Update badge total harga di tombol "Estimasi"
        const estimasiPriceBadge = document.getElementById('estimasiPriceBadge');
        if (estimasiPriceBadge) {
            estimasiPriceBadge.textContent = `Rp ${totalBelanja.toLocaleString('id-ID')}`;
            if (totalBelanja > 0) {
                estimasiPriceBadge.classList.add('show-badge');
            } else {
                estimasiPriceBadge.classList.remove('show-badge');
            }
        }
    }

    // Fungsi untuk menghapus item estimasi (digunakan secara eksternal jika perlu)
    function deleteEstimasiItem(index) {
        if (index > -1 && index < estimasiItems.length) {
            const deletedItem = estimasiItems.splice(index, 1);
            showMessageBox(`Part '${deletedItem[0].deskripsi}' dihapus dari keranjang.`);
            saveEstimasiToLocalStorage();
            renderEstimasiTable();
        }
    }

    // Fungsi untuk generate PDF
    function generatePdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const columns = [
            { header: 'No', dataKey: 'no' },
            { header: 'Kode Part', dataKey: 'kodePart' },
            { header: 'Deskripsi', dataKey: 'deskripsi' },
            { header: 'Qty', dataKey: 'qty' },
            { header: 'Harga (Rp)', dataKey: 'harga' },
            { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
        ];

        const data = estimasiItems.map((item, index) => {
            const jumlah = item.qty * item.harga;
            return {
                no: index + 1,
                kodePart: item.kodePart,
                deskripsi: item.deskripsi,
                qty: item.qty,
                harga: item.harga.toLocaleString('id-ID'),
                jumlah: jumlah.toLocaleString('id-ID')
            };
        });

        let totalBelanja = 0;
        estimasiItems.forEach(item => {
            totalBelanja += item.qty * item.harga;
        });

        doc.setFontSize(18);
        doc.text("Daftar Estimasi Sparepart", 105, 20, null, null, "center");

        doc.autoTable({
            startY: 30,
            head: [columns.map(col => col.header)],
            body: data.map(row => columns.map(col => row[col.dataKey])),
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                valign: 'middle',
                halign: 'left'
            },
            headStyles: {
                fillColor: [0, 51, 102], // Warna biru tua
                textColor: [255, 255,255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 }, // No
                1: { halign: 'center', cellWidth: 25 }, // Kode Part
                2: { halign: 'left', cellWidth: 60 }, // Deskripsi
                3: { halign: 'center', cellWidth: 15 }, // Qty
                4: { halign: 'right', cellWidth: 25 }, // Harga
                5: { halign: 'right', cellWidth: 30 }  // Jumlah
            },
            didDrawPage: function (data) {
                // Footer
                let str = "Halaman " + doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        const finalY = doc.autoTable.previous.finalY;
        doc.setFontSize(10);
        doc.text(`Total Belanja: Rp ${totalBelanja.toLocaleString('id-ID')}`, doc.internal.pageSize.width - doc.internal.pageSize.width / 4, finalY + 10, null, null, "right");


        doc.save('estimasi_belanja.pdf');
        showMessageBox('Daftar estimasi Anda telah diunduh sebagai PDF!');
    }


    // Event listener untuk membuka modal estimasi utama
    if (estimasiModal && closeEstimasiModalBtn && estimasiTableBody && estimasiModalContent && headerTableWrapper && bodyTableWrapper && downloadPdfBtn && openKirimEstimasiModalBtn && kirimEstimasiModal && closeKirimEstimasiModalBtn && estimasiForm) {
        console.log('Modal elements found. Attaching event listeners.');

        loadEstimasiFromLocalStorage(); // Muat data dari local storage saat inisialisasi
        renderEstimasiTable(); // Render tabel awal

        openEstimasiModalBtn.addEventListener('click', async function() {
            console.log('Open button clicked. Modal classList BEFORE:', estimasiModal.classList.value);
            estimasiModal.classList.remove('hidden');
            document.body.classList.add('modal-open'); // Tambahkan kelas untuk mencegah scrolling body
            console.log('Modal classList AFTER remove hidden:', estimasiModal.classList.value);

            // Sesuaikan tinggi body tabel agar scrollable
            const modalContentHeight = estimasiModalContent.offsetHeight;
            const modalTitleHeight = estimasiModalContent.querySelector('h3').offsetHeight;
            const buttonContainerHeight = estimasiModalContent.querySelector('.mt-4.flex.justify-end.gap-2').offsetHeight;
            const gap = 15; // Jarak antar elemen
            const headerTableHeight = headerTableWrapper.offsetHeight;

            const spaceTaken = modalTitleHeight + headerTableHeight + (3 * gap); // Judul + Header Tabel + gap
            const availableHeightForBodyTable = modalContentHeight - spaceTaken;

            bodyTableWrapper.style.maxHeight = `${availableHeightForBodyTable}px`;
            bodyTableWrapper.style.height = 'auto'; // Pastikan tinggi tidak fix

            // Sesuaikan lebar kolom body tabel dengan header tabel
            const headerCols = headerTableWrapper.querySelectorAll('col');
            const bodyCols = bodyTableWrapper.querySelectorAll('col');

            headerCols.forEach((col, i) => {
                const width = window.getComputedStyle(col).width;
                if (bodyCols[i]) {
                    bodyCols[i].style.width = width;
                    bodyCols[i].style.minWidth = width; // Tambahkan min-width
                    bodyCols[i].style.maxWidth = width; // Tambahkan max-width
                }
            });

            // Ambil data estimasi dari Blogger (jika ada) dan gabungkan
            try {
                const fetchedEstimasi = await ambilSemuaEstimasi();
                if (fetchedEstimasi.length > 0) {
                    // Gabungkan data yang sudah ada di local storage dengan data dari Blogger
                    const combinedEstimasi = [...estimasiItems];
                    fetchedEstimasi.forEach(fetchedItem => {
                        const existingIndex = combinedEstimasi.findIndex(item => item.kodePart === fetchedItem.kodePart);
                        if (existingIndex > -1) {
                            // Update item yang sudah ada
                            combinedEstimasi[existingIndex] = { ...combinedEstimasi[existingIndex], ...fetchedItem };
                        } else {
                            // Tambah item baru
                            combinedEstimasi.push(fetchedItem);
                        }
                    });
                    estimasiItems = combinedEstimasi;
                    saveEstimasiToLocalStorage(); // Simpan kembali ke local storage
                    renderEstimasiTable(); // Render ulang tabel
                    console.log('Estimation data successfully merged and re-rendered from Blogger.');
                } else {
                    console.log('No new estimation data from Blogger. Using existing local data.');
                    renderEstimasiTable(); // Tetap render dengan data lokal yang ada
                }
            } catch (error) {
                console.error("Failed to fetch estimation data from Blogger:", error);
                renderEstimasiTable(); // Tetap render dengan data lokal yang ada jika fetch gagal
            }
        });

        // Event listener untuk menutup modal estimasi utama
        closeEstimasiModalBtn.addEventListener('click', function() {
            console.log('Close main modal clicked. Modal classList BEFORE:', estimasiModal.classList.value);
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open'); // Hapus kelas untuk mengizinkan scrolling body
            console.log('Modal classList AFTER add hidden:', estimasiModal.classList.value);
        });

        // Event listener untuk menutup modal saat klik di luar konten modal
        estimasiModal.addEventListener('click', function(e) {
            if (e.target === estimasiModal) {
                console.log('Overlay clicked. Modal classList BEFORE:', estimasiModal.classList.value);
                estimasiModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
                console.log('Modal classList AFTER add hidden:', estimasiModal.classList.value);
            }
        });

        // Event listener untuk tombol download PDF
        downloadPdfBtn.addEventListener('click', generatePdf);

        // Event listener untuk membuka modal Kirim Estimasi
        openKirimEstimasiModalBtn.addEventListener('click', function() {
            if (estimasiItems.length === 0) {
                showMessageBox('Tidak ada item dalam estimasi untuk dikirim.');
                return;
            }
            kirimEstimasiModal.classList.remove('hidden');
        });

        // Event listener untuk menutup modal Kirim Estimasi
        closeKirimEstimasiModalBtn.addEventListener('click', function() {
            kirimEstimasiModal.classList.add('hidden');
        });

        // Event listener untuk menutup modal Kirim Estimasi saat klik di luar konten modal
        kirimEstimasiModal.addEventListener('click', function(e) {
            if (e.target === kirimEstimasiModal) {
                kirimEstimasiModal.classList.add('hidden');
            }
        });

        // Event listener untuk submit form Kirim Estimasi
        estimasiForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Mencegah form submit secara default
            const nama = document.getElementById('namaPengirim').value;
            const noHandphone = document.getElementById('noHandphone').value;
            const email = document.getElementById('emailPengirim').value;

            // Di sini Anda bisa menambahkan logika untuk mengirim data estimasi
            // Misalnya, menggunakan Fetch API untuk mengirim ke server, atau
            // membuat link WhatsApp, atau menampilkan konfirmasi.
            // Untuk contoh ini, kita hanya menampilkan pesan toast dan log ke konsol.

            showMessageBox(`Estimasi berhasil dikirim oleh ${nama} (${email}, ${noHandphone})!`);
            console.log('Estimasi dikirim:', { items: estimasiItems, nama: nama, noHandphone: noHandphone, email: email });

            // Tutup kedua modal setelah pengiriman
            kirimEstimasiModal.classList.add('hidden');
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });

    } else {
        console.warn('WARNING: Some modal elements are missing even though the open button exists. Check IDs and HTML structure.');
    }
} else {
    console.log('INFO: Estimasi modal button not found. Modal functionality will not be initialized on this page.');
}

// Fungsi untuk mengambil data estimasi dari postingan Blogger
async function ambilSemuaEstimasi() {
    // If running in Canvas preview, skip actual fetch and return empty array
    if (isCanvasPreview()) {
        console.warn("⚠️ Running in Canvas preview. Skipping estimation data fetch from Blogger.");
        return [];
    }

    console.log("Starting estimation data fetch from Blogger...");
    // Mengambil postingan dengan label 'estimasi'
    const url = new URL("/feeds/posts/default/-/estimasi?alt=json&max-results=50", window.BLOGGER_BASE_URL).href; // Use BLOGGER_BASE_URL
    let estimasiGabungan = [];

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        const entries = json.feed.entry || [];

        const parser = new DOMParser();

        for (const entry of entries) {
            const htmlContent = entry.content?.$t;
            if (htmlContent) {
                const docFromHtml = parser.parseFromString(htmlContent, 'text/html');
                // Cari elemen script dengan kelas 'data-estimasi' dan tipe 'application/json'
                const scriptNode = docFromHtml.querySelector("script.data-estimasi[type='application/json']");

                if (scriptNode && scriptNode.textContent) {
                    try {
                        const data = JSON.parse(scriptNode.textContent);
                        if (Array.isArray(data)) {
                            estimasiGabungan.push(...data);
                            console.log(`Successfully parsed data from post: ${entry.title?.$t}`);
                        } else {
                            console.warn(`Estimation data in post "${entry.title?.$t}" is not an array. Skipping.`);
                        }
                    } catch (e) {
                        console.warn(`Failed to parse JSON in post "${entry.title?.$t}":`, e);
                    }
                } else {
                    console.log(`No script.data-estimasi found in post: ${entry.title?.$t}`);
                }
            } else {
                console.log(`Empty HTML content for post: ${entry.title?.$t}`);
            }
        }
        console.log(`Estimation data fetch complete. Total items: ${estimasiGabungan.length}`);
    } catch (error) {
        console.error("Error fetching estimation data from Blogger:", error);
    }
    return estimasiGabungan;
}


// Expose beberapa fungsi ke window agar bisa diakses dari HTML atau script lain jika diperlukan
window.updateEstimasiBadges = renderEstimasiTable; // Untuk update badge dari luar
window.addEstimasiItem = function(item) { addEstimasiItem(item, true); }; // Untuk menambah item dari luar
window.getEstimasiItems = function() { return [...estimasiItems]; }; // Untuk mendapatkan item estimasi
window.clearEstimasi = function() {
    estimasiItems = [];
    saveEstimasiToLocalStorage();
    renderEstimasiTable();
};
window.loadContentForUrl = loadContentForUrl; // Expose fungsi SPA ke global

// --- Logic untuk Pencarian FIG (Parts) ---
window.postMap = {}; // Objek untuk menyimpan mapping judul postingan ke URL

// Coba muat postMap dari localStorage
try {
    const cached = localStorage.getItem('cachedPostMap');
    if (cached) {
        window.postMap = JSON.parse(cached);
        console.log("✅ Loaded postMap from localStorage:", window.postMap);
    }
} catch (e) {
    console.error("❌ Error loading postMap from localStorage:", e);
    window.postMap = {}; // Reset jika ada error
}

// Fungsi untuk mengisi postMap dari elemen HTML tersembunyi Blogger
function populatePostMap() {
    return new Promise(resolve => {
        const postMappingContainer = document.getElementById('postMappingHidden');
        console.log("Starting populatePostMap function...");

        if (postMappingContainer) {
            console.log("Content of #postMappingHidden:", postMappingContainer.innerHTML);
            const links = postMappingContainer.querySelectorAll('a');
            console.log(`Found ${links.length} <a> tags in #postMappingHidden.`);
            links.forEach(link => {
                const title = link?.textContent?.trim();
                const url = link?.href;
                if (title && url) {
                    const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, '');
                    window.postMap[sanitizedTitle] = url;
                    console.log(`✅ Mapped Post: Original Title from Blogger: "${title}" -> Sanitized Key: "${sanitizedTitle}" -> URL: "${url}"`);
                } else {
                    console.warn(`⚠️ Skipping link due to missing title or URL: TextContent="${link?.textContent}", Href="${link?.href}"`);
                }
            });
            console.log("Final window.postMap content after populating from Blogger:");
            console.table(window.postMap);
            localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap));
            console.log("✅ Saved postMap to localStorage.");
            resolve();
        } else {
            console.warn("❌ #postMappingHidden container not found. This widget should be present on the index page.");
            // Fallback: coba ambil dari postingan yang terlihat jika ada
            const posts = document.querySelectorAll('.post');
            console.log(`Found ${posts.length} .post articles (fallback).`);
            posts.forEach(post => {
                const titleElement = post.querySelector('h1 a');
                const title = titleElement?.textContent?.trim();
                const url = titleElement?.href;
                if (title && url) {
                    const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, '');
                    window.postMap[sanitizedTitle] = url;
                    console.log(`✅ Mapped Post (Fallback): Original Title from Blogger: "${title}" -> Sanitized Key: "${sanitizedTitle}" -> URL: "${url}"`);
                } else {
                    console.warn(`⚠️ Skipping fallback post due to missing title or URL: TitleElementText="${titleElement?.textContent}", Href="${titleElement?.href}"`);
                }
            });
            console.log("Final window.postMap content after populating from visible .post elements (fallback):");
            console.table(window.postMap);
            localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap));
            console.log("✅ Saved postMap (fallback) to localStorage.");
            resolve();
        }
    });
}


// Panggil populatePostMap saat DOMContentLoaded
populatePostMap().then(() => {
    // Fungsi untuk menyelesaikan link artikel berdasarkan judul_artikel
    function resolveFigLink(item) {
        const slug = item.judul_artikel?.toLowerCase().trim().replace(/\s+/g, '');
        if (window.postMap?.[slug]) {
            return window.postMap[slug];
        }
        // Fallback jika tidak ditemukan di postMap (misal, untuk postingan lama tanpa slug yang cocok)
        // Perkiraan struktur URL Blogger: /YYYY/MM/judul-artikel.html
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        return `/${currentYear}/${currentMonth}/${slug}.html`;
    }

    // Fungsi untuk mengubah string menjadi Title Case
    function titleCase(text) {
        if (!text) return '';
        return text.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    // Fungsi untuk merender hasil pencarian FIG
    function renderFigResult(item) {
        const link = resolveFigLink(item);
        const deskripsi = titleCase(item.deskripsi?.trim() || ''); // Terapkan titleCase pada deskripsi

        let html = `
          <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
            <h3 class="font-semibold text-blue-700">
              <a href="#" onclick="event.preventDefault(); window.loadContentForUrl('${link}');" class="hover:underline" data-preload-url="${link}">
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

    // Fungsi untuk menjalankan pencarian FIG di sidebar
    window.jalankanPencarianFigSidebar = function(query) {
        const hasilContainer = document.getElementById("searchOnlyContent");
        if (!hasilContainer) {
            console.warn("❌ Kontainer #searchOnlyContent tidak ditemukan.");
            return;
        }

        hasilContainer.classList.remove("hidden"); // Pastikan container terlihat

        if (!query) {
            hasilContainer.innerHTML = `<p class="text-gray-600 text-center">Masukkan kata kunci pada kolom pencarian untuk mencari kode part.</p>`;
            return;
        }

        hasilContainer.innerHTML = `
          <div class="text-sm text-gray-600 text-center mb-3">⏳ Mencari <strong>${query}</strong>...</div>`;

        const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; // Ganti dengan URL Google Sheet Anda

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
                    hasilContainer.innerHTML = `
              <div class="space-y-4">
                ${hasil.map(renderFigResult).join('')}
              </div>`;

                    // Tambahkan event listener untuk preload pada hasil pencarian
                    hasilContainer.querySelectorAll('a[data-preload-url]').forEach(link => {
                        const urlToPreload = link.getAttribute('data-preload-url');
                        if (urlToPreload) {
                            link.addEventListener('mouseenter', () => preloadContent(urlToPreload));
                        }
                    });
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

    // Event listener untuk form pencarian sidebar
    const sidebarForm = document.getElementById('sidebarSearchForm');
    const sidebarInput = document.getElementById('sidebarSearchInput');

    sidebarForm?.addEventListener('submit', function(e) {
        e.preventDefault(); // Mencegah reload halaman
        const query = sidebarInput?.value?.trim()?.toUpperCase();
        if (query) window.jalankanPencarianFigSidebar(query);
    });
});


// --- Lazy Loading Images ---
function initializeLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazyload-img[data-src]');
    if ('IntersectionObserver' in window) {
        const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.getAttribute('data-src');
                    if (dataSrc) {
                        img.src = dataSrc;
                        console.log(`📌 Gambar terlihat: ${img.src}`);
                        img.removeAttribute('data-src'); // Hapus atribut data-src
                        img.classList.remove('lazyload-img'); // Hapus kelas lazyload
                        observer.unobserve(img); // Berhenti mengamati gambar ini
                    }
                }
            });
        }, {
            rootMargin: '0px 0px 100px 0px', // Muat 100px sebelum masuk viewport
            threshold: 0.01 // Minimal 1% terlihat
        });

        lazyImages.forEach(img => {
            lazyLoadObserver.observe(img);
        });
        console.log(`Initialized IntersectionObserver for ${lazyImages.length} lazy images.`);
    } else {
        // Fallback untuk browser lama
        console.warn('IntersectionObserver not supported. All images will be loaded immediately.');
        lazyImages.forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
                img.classList.remove('lazyload-img');
            }
        });
    }
}

// Fungsi untuk memuat ulang gambar lazyload secara manual (misal setelah konten SPA dimuat)
function rehydrateLazyImages() {
    document.querySelectorAll('img.lazyload-img[data-src]').forEach(img => {
        const rect = img.getBoundingClientRect();
        // Muat gambar jika sudah terlihat di viewport
        if (rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0) {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.src = dataSrc;
                img.removeAttribute('data-src');
                img.classList.remove('lazyload-img');
                console.log(`✅ Gambar dimuat manual: ${dataSrc}`);
            }
        }
    });
}


// --- SPA Internal Link Handling ---
function setupInternalLinkListeners() {
    document.querySelectorAll('a').forEach(link => {
        // Hanya tangani link internal yang tidak memiliki data-no-spa dan tidak memiliki onclick handler
        if (link.href.startsWith(window.BLOGGER_BASE_URL) && !link.dataset.noSpa && !link.onclick) { // Use BLOGGER_BASE_URL here
            // Hapus listener sebelumnya untuk mencegah duplikasi
            link.removeEventListener('click', handleInternalLinkClick);
            link.addEventListener('click', handleInternalLinkClick);
        }
    });
    console.log('Internal link listeners re-setup.');
}

function handleInternalLinkClick(e) {
    // Abaikan jika klik berasal dari dalam dropdown toggle
    if (e.target.closest('.dropdown-toggle')) {
        return;
    }
    // Cek jika link adalah internal, bukan anchor, mailto, atau tel
    if (e.target.tagName === 'A' &&
        e.target.href.startsWith(window.BLOGGER_BASE_URL) && // Use BLOGGER_BASE_URL here
        !e.target.href.includes('#') &&
        !e.target.href.startsWith('mailto:') &&
        !e.target.href.startsWith('tel:')
    ) {
        e.preventDefault(); // Mencegah navigasi default
        const url = e.target.getAttribute('href');
        // If the URL is absolute from Blogger's base, make it relative for pushState consistency
        const relativeUrl = url.startsWith(window.BLOGGER_BASE_URL) ? url.substring(window.BLOGGER_BASE_URL.length) : url;
        window.loadContentForUrl(relativeUrl); // Muat konten dengan fungsi SPA
    }
}

// Fungsi untuk merefresh konten SPA setelah perubahan DOM
function refreshSPAContent() {
    console.log('🔄 refreshing SPA content...');
    initializeLazyLoading(); // Re-initialize lazy loading for new images
    rehydrateLazyImages(); // Muat gambar yang mungkin sudah terlihat
    setupInternalLinkListeners(); // Re-setup listeners untuk link baru
}


// Jalankan inisialisasi setelah DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded. Initial pageType:', '<data:blog.pageType/>');

    // Muat dropdown kategori kendaraan
    populateVehicleCategoryDropdown();

    // Muat konten awal halaman (termasuk homepage)
    // Gunakan window.location.pathname + window.location.search untuk jalur awal,
    // tetapi loadContentForUrl akan menggunakan BLOGGER_BASE_URL secara internal.
    const initialPath = window.location.pathname + window.location.search;
    loadContentForUrl(initialPath, false) // Jangan pushState untuk pemuatan awal
        .then(() => {
            refreshSPAContent(); // Setelah konten awal dimuat, refresh SPA
        });
});

// Expose fungsi ke window agar dapat diakses dari HTML atau script lain jika diperlukan
window.rehydrateLazyImages = rehydrateLazyImages;
window.refreshSPAContent = refreshSPAContent;
