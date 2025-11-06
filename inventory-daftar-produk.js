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

    // Tambahkan event listener ke form HANYA SEKALI
    const productForm = document.getElementById('add-product-form');
    if (productForm) {
        // Hapus listener lama jika ada untuk menghindari duplikasi
        productForm.removeEventListener('submit', handleFormSubmit);
        productForm.addEventListener('submit', handleFormSubmit);
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
 */
function populateInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8"><div class="spinner"></div> Memuat data...</td></tr>'; // Tampilkan loading

    google.script.run
        .withSuccessHandler(products => {
            allProducts = products; // Simpan data ke variabel global
            tableBody.innerHTML = ''; // Kosongkan tabel

            if (products.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
                return;
            }

            products.forEach(product => {
                let stockColor = 'text-green-600';
                if (product.stock < 50) stockColor = 'text-yellow-600';
                if (product.stock < 20) stockColor = 'text-red-600 font-bold';
                
                const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : 'N/A';

                const row = `
                    <tr class="hover:bg-gray-50" data-sku="${product.sku}">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.sku}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${product.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.category}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.brand}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">Rp ${formattedPrice}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-center ${stockColor}">${product.stock}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button onclick="openProductModal('${product.sku}')" class="text-indigo-600 hover:text-indigo-900 mx-1 action-button" title="Edit">
                                <i data-lucide="square-pen" class="w-4 h-4"></i>
                            </button>
                            <button onclick="handleDelete('${product.sku}')" class="text-red-600 hover:text-red-900 mx-1 action-button" title="Hapus">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
            lucide.createIcons(); // Perbarui ikon setelah tabel diisi
        })
        .withFailureHandler(error => {
            console.error('Gagal mengambil data produk:', error);
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-8 text-red-500">Error: ${error.message}</td></tr>`;
        })
        .getProducts();
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
        alert('Harap isi semua kolom dengan benar.');
        return;
    }

    const handler = google.script.run
        .withSuccessHandler(response => {
            console.log(response.message);
            closeProductModal();
            populateInventoryTable(); // Muat ulang tabel
        })
        .withFailureHandler(error => {
            console.error('Error saat menyimpan produk:', error);
            alert(`Gagal menyimpan: ${error.message}`);
        });

    if (isEditMode) {
        handler.updateProduct(productData);
    } else {
        handler.addProduct(productData);
    }
}

/**
 * Menangani proses penghapusan produk.
 * @param {string} sku - SKU produk yang akan dihapus.
 */
function handleDelete(sku) {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk dengan SKU: ${sku}?`)) {
        return;
    }

    google.script.run
        .withSuccessHandler(response => {
            console.log(response.message);
            // Hapus baris dari tabel secara visual untuk respons cepat
            const row = document.querySelector(`tr[data-sku='${sku}']`);
            if (row) row.remove();
            // Atau panggil populateInventoryTable() untuk data yang lebih akurat
            // populateInventoryTable(); 
        })
        .withFailureHandler(error => {
            console.error('Gagal menghapus produk:', error);
            alert(`Gagal menghapus: ${error.message}`);
        })
        .deleteProduct(sku);
}

// Panggil fungsi inisialisasi saat DOM siap jika file ini dimuat secara mandiri
// Namun, karena ini adalah SPA, pemanggilan utama dilakukan oleh router.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInventoryDaftarProdukPage);
} else {
    // initInventoryDaftarProdukPage(); // Router akan memanggil ini
}
