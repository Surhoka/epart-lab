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
let currentSortColumn = null;
let currentSortOrder = 'asc';

// Function to update table header sort icons
function updateTableHeaders() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        if (!column) return;

        // Reset existing icon classes
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.classList.remove('text-indigo-600', 'text-gray-400');
            if (column === currentSortColumn) {
                icon.classList.add('text-indigo-600');
                icon.dataset.lucide = currentSortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
            } else {
                icon.classList.add('text-gray-400');
                icon.dataset.lucide = 'chevrons-up-down';
            }
        }

        // Update cursor style
        header.classList.toggle('active-sort', column === currentSortColumn);
    });
    
    // Refresh Lucide icons
    lucide.createIcons();
}

// Add sorting functionality
function handleSort(column) {
    // If clicking the same column, toggle direction
    if (currentSortColumn === column) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortOrder = 'asc';
    }

    // Re-render the table with sorted data directly
    renderTable(allProducts);
}

function renderTable(products) {
    const tableBody = document.getElementById('inventory-table-body');
    console.log("Data received by client for rendering:", products);

    // Validasi bahwa 'products' adalah array
    if (!Array.isArray(products)) {
        console.error("Data yang diterima bukan array:", products);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-red-500">Error: Format data produk tidak valid.</td></tr>';
        if (typeof showToast === 'function') {
            showToast('Format data produk tidak valid.', 'error');
        }
        return;
    }

    // Create a copy of the products array for sorting
    let sortedProducts = [...products];
    
    // Sort products if a sort column is active
    if (currentSortColumn) {
        sortedProducts.sort((a, b) => {
            let aValue = a[currentSortColumn];
            let bValue = b[currentSortColumn];
            
            // Handle numeric values
            if (['price', 'stock'].includes(currentSortColumn)) {
                aValue = Number(aValue) || 0;
                bValue = Number(bValue) || 0;
            } else {
                // Convert to strings for text comparison
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }
            
            if (aValue < bValue) return currentSortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    tableBody.innerHTML = ''; // Kosongkan tabel
    
    // Use the sorted products for rendering
    products = sortedProducts;
    
    // Update table headers to show sort state
    updateTableHeaders();

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
            <tr class="hover:bg-gray-50 text-xs border-b" data-sku="${product.sku}">
                <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900 border-r">${index + 1}</td>
                <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900 border-r">${product.sku}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-700 border-r">${product.name}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-500 border-r">${product.category}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-500 border-r">${product.brand}</td>
                <td class="px-3 py-2 whitespace-nowrap text-right text-gray-900 border-r">Rp ${formattedPrice}</td>
                <td class="px-3 py-2 whitespace-nowrap text-center ${stockColor} border-r">${product.stock}</td>
                <td class="px-2 py-2 whitespace-nowrap text-center">
                    <button class="text-indigo-600 hover:text-indigo-900 mx-0.5 action-button edit-product-btn" title="Edit">
                        <i data-lucide="square-pen" class="w-3.5 h-3.5"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 mx-0.5 action-button delete-product-btn" title="Hapus">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons(); // Perbarui ikon setelah tabel diisi
}

// Fungsi inisialisasi utama yang akan dipanggil oleh router SPA
window.initInventoryDaftarProdukPage = function() {
    console.log("Halaman Daftar Produk Dimuat.");
    
    // Wait for Lucide to be available
    if (typeof lucide === 'undefined') {
        console.error('Lucide not loaded. Icons may not appear correctly.');
    } else {
        lucide.createIcons();
    }
    
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

    // Add click event listeners for sorting and initialize sort icons
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            handleSort(column);
            // updateTableHeaders is called inside handleSort
        });
    });

    // Initialize Lucide icons
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
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }

    // Update global products array first
    if (productsToDisplay) {
        allProducts = [...productsToDisplay];
    }
    
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8"><div class="spinner"></div> Memuat data...</td></tr>'; // Tampilkan loading

    const handleSuccess = (response) => {
        if (!response) {
            handleFailure({ message: 'Tidak ada respons dari server.' });
            return;
        }
        
        console.log('Response received:', response); // Debug log
        
        // If response indicates empty data
        if (response.status === 'success' && (!response.data || response.data.length === 0)) {
            if (response.message && !response.message.toLowerCase().includes('error')) {
                // Show success message if provided
                console.log('Success message:', response.message);
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
                if (typeof showToast === 'function') {
                    showToast(response.message, 'success');
                }
            } else {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
            }
            return;
        }
        
        // If response has data array or is an array itself
        if ((response.status === 'success' && Array.isArray(response.data)) || Array.isArray(response)) {
            const products = Array.isArray(response) ? response : response.data;
            renderTable(products);
            if (response.message && typeof showToast === 'function') {
                showToast(response.message, 'success');
            }
        } else {
            handleFailure({ message: response.message || 'Terjadi kesalahan di server.' });
        }
    };

    const handleFailure = (error) => {
        console.error("Gagal mengambil data produk:", error);
        
        // Check if the error message is actually a success message
        if (error.message && error.message.toLowerCase().includes('berhasil')) {
            handleSuccess({
                status: 'success',
                message: error.message,
                data: []
            });
            return;
        }
        
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Error: ${error.message}</td></tr>`;
        if (typeof showToast === 'function') {
            showToast('Gagal memuat data produk: ' + error.message, 'error');
        }
    };

    if (productsToDisplay) {
        renderTable(productsToDisplay);
    } else {
        sendDataToGoogle('getProducts', {}, handleSuccess, handleFailure);
    }
}

function sendDataToGoogle(action, data, successCallback, errorCallback) {
    // Check if appsScriptUrl is defined
    if (!window.appsScriptUrl) {
        errorCallback(new Error('appsScriptUrl is not defined. Make sure EzyParts.xml has loaded completely.'));
        return;
    }

    // Create URL with query parameters for GET request
    const url = new URL(window.appsScriptUrl);
    url.searchParams.append('action', action);
    // Add all data as query parameters
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object') {
            url.searchParams.append(key, JSON.stringify(value));
        } else {
            url.searchParams.append(key, value);
        }
    }

    // Create a unique callback name
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    url.searchParams.append('callback', callbackName);

    // Create promise to handle JSONP
    const promise = new Promise((resolve, reject) => {
        let timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Request timed out'));
        }, 30000); // 30 second timeout

        function cleanup() {
            clearTimeout(timeout);
            delete window[callbackName];
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }

        // Create script element
        const script = document.createElement('script');
        script.src = url.toString();
        
        // Define the callback function
        window[callbackName] = function(rawData) {
            cleanup();
            console.log('Raw JSONP Response:', rawData); // Debug log

            // Directly handle the response without throwing errors
            let responseObject;

            // If it's a success message string
            if (typeof rawData === 'string' && rawData.toLowerCase().includes('berhasil')) {
                responseObject = {
                    status: 'success',
                    message: rawData,
                    data: []
                };
                resolve(responseObject);
                return;
            }

            // If it's an array, directly pass it as data
            if (Array.isArray(rawData)) {
                responseObject = {
                    status: 'success',
                    message: 'Data berhasil diambil',
                    data: rawData
                };
                resolve(responseObject);
                return;
            }

            // If it's a non-array object
            if (typeof rawData === 'object' && rawData !== null) {
                responseObject = {
                    status: rawData.status || 'success',
                    message: rawData.message || 'Operation successful',
                    data: rawData.records || rawData.data || rawData.items || []
                };
                resolve(responseObject);
                return;
            }

            // Try to parse as JSON if it's a string
            if (typeof rawData === 'string') {
                try {
                    const parsed = JSON.parse(rawData);
                    responseObject = {
                        status: parsed.status || 'success',
                        message: parsed.message || 'Operation successful',
                        data: parsed.records || parsed.data || parsed.items || []
                    };
                    resolve(responseObject);
                    return;
                } catch (e) {
                    // If not JSON but doesn't contain error keywords, treat as success message
                    if (!rawData.toLowerCase().includes('error') && 
                        !rawData.toLowerCase().includes('gagal') && 
                        !rawData.toLowerCase().includes('kesalahan')) {
                        responseObject = {
                            status: 'success',
                            message: rawData,
                            data: []
                        };
                        resolve(responseObject);
                        return;
                    }
                }
            }

            // If we get here, something went wrong
            reject(new Error(typeof rawData === 'string' ? rawData : 'Invalid response format'));
        };

        // Handle script load error
        script.onerror = () => {
            cleanup();
            reject(new Error('Gagal memuat data dari server.'));
        };

        // Add script to document
        document.body.appendChild(script);
    });

    // Handle the promise
    promise
        .then(data => {
            console.log('Promise resolved with:', data);
            successCallback(data);
        })
        .catch(error => {
            console.error('JSONP error:', error);
            errorCallback(error);
        });
}

/**
 * Menangani proses pencarian produk.
 */
function handleSearch() {
    const searchTerm = document.getElementById('inventory-search').value;
    if (searchTerm.trim() === '') {
        populateInventoryTable(); // Re-fetch all products
        return;
    }

    const handleSuccess = (response) => {
        if (response.status === 'success') {
            populateInventoryTable(response.data); // Re-use the populate function with the filtered data
        } else {
            handleFailure({ message: response.message || 'Gagal mencari produk.' });
        }
    };

    const handleFailure = (error) => {
        console.error('Gagal mencari produk:', error);
        if (typeof showToast === 'function') {
            showToast(`Gagal mencari: ${error.message}`, 'error');
        }
    };

    sendDataToGoogle('searchProducts', { searchTerm: searchTerm }, handleSuccess, handleFailure);
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
        if (typeof showToast === 'function') showToast('Harap isi semua kolom dengan benar.', 'error');
        return;
    }

    const handleSuccess = (result) => {
        if (result.status === 'success') {
            console.log(result.message);
            closeProductModal();
            populateInventoryTable(); // Reload the table
            if (typeof showToast === 'function') showToast(result.message, 'success');
        } else {
            handleFailure({ message: result.message || 'Gagal menyimpan produk.' });
        }
    };

    const handleFailure = (error) => {
        console.error('Error saat menyimpan produk:', error);
        if (typeof showToast === 'function') showToast(`Gagal menyimpan: ${error.message}`, 'error');
    };

    const action = isEditMode ? 'updateProduct' : 'addProduct';

    sendDataToGoogle(action, { productData: productData }, handleSuccess, handleFailure);
}

/**
 * Menangani proses penghapusan produk.
 * @param {string} sku - SKU produk yang akan dihapus.
 */
function handleDelete(sku) {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk dengan SKU: ${sku}?`)) {
        return;
    }

    const handleSuccess = (result) => {
        if (result.status === 'success') {
            console.log(result.message);
            populateInventoryTable(); // Reload the table for accurate data
            if (typeof showToast === 'function') showToast(result.message, 'success');
        } else {
            handleFailure({ message: result.message || 'Gagal menghapus produk.' });
        }
    };

    const handleFailure = (error) => {
        console.error('Gagal menghapus produk:', error);
        if (typeof showToast === 'function') showToast(`Gagal menghapus: ${error.message}`, 'error');
    };

    sendDataToGoogle('deleteProduct', { sku: sku }, handleSuccess, handleFailure);
}

// Panggil fungsi inisialisasi saat DOM siap jika file ini dimuat secara mandiri
// Namun, karena ini adalah SPA, pemanggilan utama dilakukan oleh router.
// Fungsi untuk mengupdate header tabel dengan ikon sort yang aktif
function updateTableHeaders() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        if (!column) return;

        // Reset existing icon classes
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.classList.remove('hidden');
            if (column === currentSortColumn) {
                icon.dataset.lucide = currentSortOrder === 'asc' ? 'chevron-up' : 'chevron-down';
            } else {
                icon.classList.add('hidden');
            }
        }
    });
    
    // Refresh Lucide icons
    lucide.createIcons();
}

// The router will call window.initInventoryDaftarProdukPage()
