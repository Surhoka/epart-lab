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

// Variabel global untuk menyimpan data produk dan status edit
let allProducts = [];
let isEditMode = false;
let editingSku = null;

// Fungsi inisialisasi utama yang akan dipanggil oleh router SPA
function initInventoryDaftarProdukPage() {
    console.log("Halaman Daftar Produk Dimuat.");
    populateInventoryTable();

    // Attach event listeners for static buttons
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    const addProductButton = document.getElementById('add-product-button');
    if (addProductButton) {
        addProductButton.addEventListener('click', () => openProductModal());
    }

    const modalCloseButton = document.getElementById('modal-close-button');
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeProductModal);
    }

    const modalCancelButton = document.getElementById('modal-cancel-button');
    if (modalCancelButton) {
        modalCancelButton.addEventListener('click', closeProductModal);
    }

    // Add event listener to form for submission
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        productForm.removeEventListener('submit', handleFormSubmit); // Prevent duplicate listeners
        productForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Event delegation for dynamically created edit/delete buttons
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

    // Inisialisasi ikon Lucide
    lucide.createIcons();
}

// Wrapper untuk submit handler
function handleFormSubmit(e) {
    e.preventDefault();
    saveProduct();
}

/**
 * Mengambil data dari Google Sheet dan mengisi tabel.
 * @param {Array<Object>|null} productsToDisplay - Opsional, array produk untuk ditampilkan. Jika null, akan mengambil dari server.
 */
function populateInventoryTable(productsToDisplay = null) {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8"><div class="spinner"></div> Memuat data...</td></tr>'; // Tampilkan loading

    const renderTable = (products) => {
        console.log("Data received by client for rendering:", products); // Tambahkan log ini
        allProducts = products; // Simpan data ke variabel global
        tableBody.innerHTML = ''; // Kosongkan tabel

        if (products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
            return;
        }

        products.forEach((product, index) => {
            let stockColor = 'text-green-600';
            if (product.stock < 50) stockColor = 'text-yellow-600';
            if (product.stock < 20) stockColor = 'text-red-600 font-bold';
            
            const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : 'N/A';

            const row = `
                <tr class="hover:bg-gray-50" data-sku="${product.sku}">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${index + 1}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.sku}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${product.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.category}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.brand}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">Rp ${formattedPrice}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center ${stockColor}">${product.stock}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 mx-1 action-button edit-product-btn" title="Edit">
                            <i data-lucide="square-pen" class="w-4 h-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-900 mx-1 action-button delete-product-btn" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
        lucide.createIcons(); // Perbarui ikon setelah tabel diisi
    };

    if (productsToDisplay) {
        renderTable(productsToDisplay);
    } else {
        fetch(appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action: 'getProducts' })
        })
        .then(response => response.json())
        .then(data => {
            renderTable(data);
        })
        .catch(error => {
            console.error('Gagal mengambil data produk:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Error: ${error.message}</td></tr>`;
            showToast('Terjadi kesalahan saat memuat data produk: ' + error.message, 'error');
        });
    }
}

/**
 * Menangani proses pencarian produk.
 */
function handleSearch() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    if (searchTerm.trim() === '') {
        populateInventoryTable(); // Jika kosong, tampilkan semua produk
        return;
    }

    fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ action: 'searchProducts', searchTerm: searchTerm })
    })
    .then(response => response.json())
    .then(filteredProducts => {
        populateInventoryTable(filteredProducts);
    })
    .catch(error => {
        console.error('Gagal mencari produk:', error);
        showToast(`Gagal mencari: ${error.message}`, 'error');
    });
}

/**
 * Membuka modal untuk menambah atau mengedit produk.
 * @param {string|null} sku - SKU produk yang akan diedit. Jika null, mode tambah.
 */
function openProductModal(sku = null) {
    const modal = document.getElementById('product-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('add-product-form');
    const skuInput = document.getElementById('product-sku');

    form.reset();

    if (sku) { // Mode Edit
        isEditMode = true;
        editingSku = sku;
        const product = allProducts.find(p => p.sku === sku);
        if (product) {
            modalTitle.textContent = 'Edit Produk';
            skuInput.value = product.sku;
            skuInput.readOnly = true; // SKU tidak bisa diubah saat edit
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock;
            // Anda bisa menambahkan field lain di sini (kategori, merek)
        }
    } else { // Mode Tambah
        isEditMode = false;
        editingSku = null;
        modalTitle.textContent = 'Tambah Produk Baru';
        skuInput.readOnly = false;
    }

    modal.classList.remove('hidden');
    lucide.createIcons();
}

/**
 * Menutup modal form produk.
 */
function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

/**
 * Mengirim data dari form ke Apps Script untuk disimpan.
 */
function saveProduct() {
    const productData = {
        sku: document.getElementById('product-sku').value.toUpperCase(),
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        // Ambil data kategori dan merek jika ada formnya
        category: 'Uncategorized', // Ganti dengan input form jika ada
        brand: 'N/A' // Ganti dengan input form jika ada
    };

    // Validasi sederhana
    if (!productData.sku || !productData.name || isNaN(productData.price) || isNaN(productData.stock)) {
        showToast('Harap isi semua kolom dengan benar.', 'error');
        return;
    }

    const payload = {
        action: isEditMode ? 'updateProduct' : 'addProduct',
        productData: productData
    };

    fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log(result.message);
            closeProductModal();
            populateInventoryTable(); // Muat ulang tabel
            showToast(result.message, 'success');
        } else {
            console.error('Error saat menyimpan produk:', result.message);
            showToast(`Gagal menyimpan: ${result.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error saat menyimpan produk:', error);
        showToast('Terjadi kesalahan jaringan saat menyimpan produk: ' + error.message, 'error');
    });
}

/**
 * Menangani proses penghapusan produk.
 * @param {string} sku - SKU produk yang akan dihapus.
 */
function handleDelete(sku) {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk dengan SKU: ${sku}?`)) {
        return;
    }

    const payload = {
        action: 'deleteProduct',
        sku: sku
    };

    fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log(result.message);
            // Hapus baris dari tabel secara visual untuk respons cepat
            const row = document.querySelector(`tr[data-sku='${sku}']`);
            if (row) row.remove();
            populateInventoryTable(); // Muat ulang tabel untuk data yang lebih akurat
            showToast(result.message, 'success');
        } else {
            console.error('Gagal menghapus produk:', result.message);
            showToast(`Gagal menghapus: ${result.message}`, 'error');
        }
    })
    .catch(error => {
        console.error('Error saat menghapus produk:', error);
        showToast('Terjadi kesalahan jaringan saat menghapus produk: ' + error.message, 'error');
    });
}

// Panggil fungsi inisialisasi saat DOM siap jika file ini dimuat secara mandiri
// Namun, karena ini adalah SPA, pemanggilan utama dilakukan oleh router.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventoryDaftarProdukPage);
} else {
    // initInventoryDaftarProdukPage(); // Router akan memanggil ini
}
