/**
 * =================================================================
 *      SKRIP SISI KLIEN UNTUK HALAMAN DAFTAR PRODUK
 * =================================================================
 * v3
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

    // Render the table with the new sorting order using existing data
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
    
    // Create a document fragment to build the new table content off-DOM
    const fragment = document.createDocumentFragment();
    
    // Use the sorted products for rendering
    products = sortedProducts;
    
    // Update table headers to show sort state
    updateTableHeaders();

    if (products.length === 0) {
        // If no products, just set the innerHTML directly for the empty state
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
        lucide.createIcons(); // Perbarui ikon setelah tabel diisi
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden'); // Hide overlay for empty state
        }
        return;
    }

    products.forEach((product, index) => {
        let stockColor = 'text-green-600';
        if (product.stock < 50) stockColor = 'text-yellow-600';
        if (product.stock < 20) stockColor = 'text-red-600 font-bold';
        
        const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : 'N/A';

        const rowHtmlContent = `
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
        `;
        const tr = document.createElement('tr');
        tr.classList.add('hover:bg-gray-50', 'text-xs', 'border-b');
        tr.dataset.sku = product.sku;
        tr.innerHTML = rowHtmlContent;
        fragment.appendChild(tr);
    });

    // Clear the table body once and append the fragment in a single DOM operation
    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    lucide.createIcons(); // Perbarui ikon setelah tabel diisi

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden'); // Hide overlay after content is rendered
    }
}

// Fungsi inisialisasi utama yang akan dipanggil oleh router SPA
window.initInventoryDaftarProdukPage = function() {
    console.log("Halaman Daftar Produk Dimuat.");

    // Variabel lokal untuk menyimpan data produk dan status edit
    let allProducts = [];
    let isEditMode = false;
    let editingSku = null;
    let currentSortColumn = null;
    let currentSortOrder = 'asc';
    let hasFetchedInitialData = false;

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

        // Render the table with the new sorting order using existing data
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
        
        // Create a document fragment to build the new table content off-DOM
        const fragment = document.createDocumentFragment();
        
        // Use the sorted products for rendering
        products = sortedProducts;
        
        // Update table headers to show sort state
        updateTableHeaders();

        if (products.length === 0) {
            // If no products, just set the innerHTML directly for the empty state
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
            lucide.createIcons(); // Perbarui ikon setelah tabel diisi
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden'); // Hide overlay for empty state
            }
            return;
        }

        products.forEach((product, index) => {
            let stockColor = 'text-green-600';
            if (product.stock < 50) stockColor = 'text-yellow-600';
            if (product.stock < 20) stockColor = 'text-red-600 font-bold';
            
            const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : 'N/A';

            const rowHtmlContent = `
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
            `;
            const tr = document.createElement('tr');
            tr.classList.add('hover:bg-gray-50', 'text-xs', 'border-b');
            tr.dataset.sku = product.sku;
            tr.innerHTML = rowHtmlContent;
            fragment.appendChild(tr);
        });

        // Clear the table body once and append the fragment in a single DOM operation
        tableBody.innerHTML = '';
        tableBody.appendChild(fragment);
        lucide.createIcons(); // Perbarui ikon setelah tabel diisi

        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden'); // Hide overlay after content is rendered
        }
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

        // If products are provided directly (e.g., from search), render them immediately and exit.
        if (productsToDisplay) {
            allProducts = [...productsToDisplay];
            renderTable(allProducts);
            return;
        }

        // If data has already been fetched and we are not explicitly forcing a refresh (e.g., from reset button),
        // just render existing data. This prevents redundant server calls on SPA re-initialization.
        if (hasFetchedInitialData) {
            renderTable(allProducts);
            return;
        }

        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        // Clear table body content immediately to prevent old data from showing under overlay
        tableBody.innerHTML = ''; 

        const handleSuccess = (response) => {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden'); // Hide overlay on success
            }
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
                allProducts = []; // Ensure allProducts is empty if no data
                renderTable(allProducts); // Render empty table
                hasFetchedInitialData = true; // Mark as fetched even if empty
                return;
            }
            
            // If response has data array or is an array itself
            if ((response.status === 'success' && Array.isArray(response.data)) || Array.isArray(response)) {
                const products = Array.isArray(response) ? response : response.data;
                allProducts = products; // Update the global product list
                renderTable(products);
                hasFetchedInitialData = true; // Mark as fetched
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
            hasFetchedInitialData = true; // Mark as fetched even on failure to prevent re-fetching immediately
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden'); // Hide overlay on failure
            }
        };

        // If we reached here, it means productsToDisplay was null, so we fetch from the server.
        window.sendDataToGoogle('getProducts', {}, handleSuccess, handleFailure);
    }

    /**
     * Menangani proses pencarian produk.
     */
    function handleSearch() {
        const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
        if (searchTerm.trim() === '') {
            renderTable(allProducts); // Show all products if search term is empty
            return;
        }

        // Filter locally from allProducts
        const filteredProducts = allProducts.filter(product => {
            // Customize search logic here: search by SKU, name, category, brand
            return (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
                   (product.name && product.name.toLowerCase().includes(searchTerm)) ||
                   (product.category && product.category.toLowerCase().includes(searchTerm)) ||
                   (product.brand && product.brand.toLowerCase().includes(searchTerm));
        });

        renderTable(filteredProducts); // Render the filtered results
    }

    /**
     * Mereset tampilan tabel ke kondisi awal.
     */
    function handleResetTable() {
        // Reset variabel sort
        currentSortColumn = null;
        currentSortOrder = 'asc';

        // Kosongkan input pencarian
        const searchInput = document.getElementById('inventory-search');
        if (searchInput) {
            searchInput.value = '';
        }

        // Reset the flag to force a fresh data fetch
        hasFetchedInitialData = false; 
        // Muat ulang data tabel dari awal
        populateInventoryTable();
        
        if (typeof showToast === 'function') {
            showToast('Tabel telah direset.', 'info');
        }
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
                if (isEditMode) {
                    // Find and replace the updated product in allProducts
                    const index = allProducts.findIndex(p => p.sku === editingSku);
                    if (index !== -1) {
                        allProducts[index] = result.data; // Assuming result.data is the updated product
                    }
                } else {
                    // Add the new product to allProducts
                    allProducts.push(result.data); // Assuming result.data is the new product
                }
                renderTable(allProducts); // Re-render the table with local data
                if (typeof showToast === 'function') showToast(result.message, 'success');
            } else {
                handleFailure({ message: result.message || 'Gagal menyimpan produk.' });
            }
        };

        const handleFailure = (error) => {
            console.error('Error saat menyimpan produk:', error);
            const errorMessage = (error && error.message) ? error.message : JSON.stringify(error);
            if (typeof showToast === 'function') showToast(`Gagal menyimpan: ${errorMessage}`, 'error');
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
                // Remove the deleted product from allProducts locally
                allProducts = allProducts.filter(p => p.sku !== sku);
                renderTable(allProducts); // Re-render the table with local data
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

    const resetButton = document.getElementById('reset-table-button');
    if (resetButton) {
        resetButton.addEventListener('click', handleResetTable);
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

    // If products are provided directly (e.g., from search), render them immediately and exit.
    if (productsToDisplay) {
        allProducts = [...productsToDisplay];
        renderTable(allProducts);
        return;
    }

    // If data has already been fetched and we are not explicitly forcing a refresh (e.g., from reset button),
    // just render existing data. This prevents redundant server calls on SPA re-initialization.
    if (hasFetchedInitialData) {
        renderTable(allProducts);
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    // Clear table body content immediately to prevent old data from showing under overlay
    tableBody.innerHTML = ''; 

    const handleSuccess = (response) => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden'); // Hide overlay on success
        }
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
            allProducts = []; // Ensure allProducts is empty if no data
            renderTable(allProducts); // Render empty table
            hasFetchedInitialData = true; // Mark as fetched even if empty
            return;
        }
        
        // If response has data array or is an array itself
        if ((response.status === 'success' && Array.isArray(response.data)) || Array.isArray(response)) {
            const products = Array.isArray(response) ? response : response.data;
            allProducts = products; // Update the global product list
            renderTable(products);
            hasFetchedInitialData = true; // Mark as fetched
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
        hasFetchedInitialData = true; // Mark as fetched even on failure to prevent re-fetching immediately
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden'); // Hide overlay on failure
        }
    };

    // If we reached here, it means productsToDisplay was null, so we fetch from the server.
    window.sendDataToGoogle('getProducts', {}, handleSuccess, handleFailure);
}

/**
 * Menangani proses pencarian produk.
 */
function handleSearch() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    if (searchTerm.trim() === '') {
        renderTable(allProducts); // Show all products if search term is empty
        return;
    }

    // Filter locally from allProducts
    const filteredProducts = allProducts.filter(product => {
        // Customize search logic here: search by SKU, name, category, brand
        return (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
               (product.name && product.name.toLowerCase().includes(searchTerm)) ||
               (product.category && product.category.toLowerCase().includes(searchTerm)) ||
               (product.brand && product.brand.toLowerCase().includes(searchTerm));
    });

    renderTable(filteredProducts); // Render the filtered results
}

/**
 * Mereset tampilan tabel ke kondisi awal.
 */
function handleResetTable() {
    // Reset variabel sort
    currentSortColumn = null;
    currentSortOrder = 'asc';

    // Kosongkan input pencarian
    const searchInput = document.getElementById('inventory-search');
    if (searchInput) {
        searchInput.value = '';
    }

    // Reset the flag to force a fresh data fetch
    hasFetchedInitialData = false; 
    // Muat ulang data tabel dari awal
    populateInventoryTable();
    
    if (typeof showToast === 'function') {
        showToast('Tabel telah direset.', 'info');
    }
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
            if (isEditMode) {
                // Find and replace the updated product in allProducts
                const index = allProducts.findIndex(p => p.sku === editingSku);
                if (index !== -1) {
                    allProducts[index] = result.data; // Assuming result.data is the updated product
                }
            } else {
                // Add the new product to allProducts
                allProducts.push(result.data); // Assuming result.data is the new product
            }
            renderTable(allProducts); // Re-render the table with local data
            if (typeof showToast === 'function') showToast(result.message, 'success');
        } else {
            handleFailure({ message: result.message || 'Gagal menyimpan produk.' });
        }
    };

    const handleFailure = (error) => {
        console.error('Error saat menyimpan produk:', error);
        const errorMessage = (error && error.message) ? error.message : JSON.stringify(error);
        if (typeof showToast === 'function') showToast(`Gagal menyimpan: ${errorMessage}`, 'error');
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
            // Remove the deleted product from allProducts locally
            allProducts = allProducts.filter(p => p.sku !== sku);
            renderTable(allProducts); // Re-render the table with local data
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

// The router will call window.initInventoryDaftarProdukPage()
