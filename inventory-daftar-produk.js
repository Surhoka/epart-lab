/**
 * =================================================================
 *      SKRIP SISI KLIEN UNTUK HALAMAN DAFTAR PRODUK
 * =================================================================
 * 
 * FUNGSI UTAMA:
 * - initInventoryDaftarProdukPage: Fungsi inisialisasi utama yang dipanggil saat halaman dimuat.
 * - populateInventoryTable: Mengambil data dari Google Apps Script dan menampilkan di tabel.
 * - openProductModal: Membuka modal untuk menambah atau mengedit produk.
 * - saveProduct: Mengirim data formulir ke Google Apps Script untuk disimpan.
 * - handleDelete: Menangani permintaan penghapusan produk.
 * 
 * ALUR KERJA:
 * 1. Saat halaman dimuat, `populateInventoryTable` dipanggil.
 * 2. Fungsi ini menjalankan `google.script.run` untuk memanggil `getProducts()` di sisi server (.gs).
 * 3. Setelah data diterima, tabel HTML diperbarui.
 * 4. Tombol "Tambah", "Edit", dan "Hapus" memanggil fungsi Apps Script yang sesuai.
 * 5. Setelah setiap operasi (tambah/edit/hapus), tabel akan dimuat ulang untuk menampilkan data terbaru.
 */

// Variabel global
let allProducts = [];
let isEditMode = false;
let editingSku = null;

function initInventoryDaftarProdukPage() {
    console.log("Halaman Daftar Produk Dimuat.");
    populateInventoryTable();

    const searchButton = document.getElementById('search-button');
    if (searchButton) searchButton.addEventListener('click', handleSearch);

    const addProductButton = document.getElementById('add-product-button');
    if (addProductButton) addProductButton.addEventListener('click', () => openProductModal());

    const modalCloseButton = document.getElementById('modal-close-button');
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeProductModal);

    const modalCancelButton = document.getElementById('modal-cancel-button');
    if (modalCancelButton) modalCancelButton.addEventListener('click', closeProductModal);

    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.removeEventListener('submit', handleFormSubmit);
        productForm.addEventListener('submit', handleFormSubmit);
    }

    const inventoryTableBody = document.getElementById('inventory-table-body');
    if (inventoryTableBody) {
        inventoryTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            const sku = target.closest('tr').dataset.sku;
            if (target.classList.contains('edit-product-btn')) {
                openProductModal(sku);
            } else if (target.classList.contains('delete-product-btn')) {
                handleDelete(sku);
            }
        });
    }

    lucide.createIcons();
}

function handleFormSubmit(e) {
    e.preventDefault();
    saveProduct();
}

/**
 * Ambil data produk via JSONP
 */
function populateInventoryTable(productsToDisplay = null) {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8"><div class="spinner"></div> Memuat data...</td></tr>';

    const renderTable = (products) => {
        allProducts = products || [];
        tableBody.innerHTML = '';

        if (allProducts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk.</td></tr>';
            return;
        }

        allProducts.forEach((product, index) => {
            let stockColor = 'text-green-600';
            if (product.stock < 50) stockColor = 'text-yellow-600';
            if (product.stock < 20) stockColor = 'text-red-600 font-bold';

            const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : product.price;

            const row = `
                <tr class="hover:bg-gray-50" data-sku="${product.sku}">
                    <td>${index + 1}</td>
                    <td>${product.sku}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.brand}</td>
                    <td class="text-right">Rp ${formattedPrice}</td>
                    <td class="${stockColor} text-center">${product.stock}</td>
                    <td class="text-center">
                        <button class="edit-product-btn">✏️</button>
                        <button class="delete-product-btn">🗑️</button>
                    </td>
                </tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
        lucide.createIcons();
    };

    if (productsToDisplay) {
        renderTable(productsToDisplay);
    } else {
        // Panggil Apps Script via JSONP
        sendDataToGoogle('getProducts', {}, renderTable, (error) => {
            console.error('Gagal ambil produk:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Error: ${error.message}</td></tr>`;
        });
    }
}

/**
 * Cari produk via JSONP
 */
function handleSearch() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    if (searchTerm.trim() === '') {
        populateInventoryTable();
        return;
    }

    sendDataToGoogle('searchProducts', { searchTerm }, (filteredProducts) => {
        populateInventoryTable(filteredProducts);
    }, (error) => {
        console.error('Gagal mencari produk:', error);
        showToast(`Gagal mencari: ${error.message}`, 'error');
    });
}

// Panggil fungsi inisialisasi saat DOM siap jika file ini dimuat secara mandiri
// Namun, karena ini adalah SPA, pemanggilan utama dilakukan oleh router.
// The router will call window.initInventoryDaftarProdukPage()

