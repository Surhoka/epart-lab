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


// Variabel lokal untuk menyimpan data produk dan status edit
let allProducts = []; // This will now store the currently displayed page of products
let isEditMode = false;
let editingSku = null;
let currentSortColumn = null;
let currentSortOrder = 'asc';
let hasFetchedInitialData = false;

// Global state for pagination
const currentPaginationState = {
    currentPage: 1,
    totalProducts: 0,
    totalPages: 0,
    limit: 10 // Default limit
};

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

    // Re-fetch data from server with new sorting
    populateInventoryTable();
}

function renderTable(productsToRender, currentPageParam, productsPerPageParam) {
    const tableBody = document.getElementById('inventory-table-body');
    const paginationInfo = document.getElementById('pagination-info');
    console.log("Data received by client for rendering:", productsToRender);

    // Validasi bahwa 'productsToRender' adalah array
    if (!Array.isArray(productsToRender)) {
        console.error("Data yang diterima bukan array:", productsToRender);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-red-500">Error: Format data produk tidak valid.</td></tr>';
        if (typeof showToast === 'function') {
            showToast('Format data produk tidak valid.', 'error');
        }
        return;
    }

    // Update global pagination variables based on server response
    allProducts = productsToRender; // Store the current page's products
    // currentPaginationState is already updated in populateInventoryTable
    
    // Update table headers to show sort state
    updateTableHeaders();

    if (productsToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk. Silakan tambahkan produk baru.</td></tr>';
        renderPagination(currentPaginationState.totalProducts, currentPaginationState.totalPages, currentPaginationState.currentPage, currentPaginationState.limit);
        lucide.createIcons();
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    const startIndex = (currentPageParam - 1) * productsPerPageParam; // Calculate start index for numbering
    productsToRender.forEach((product, index) => {
        let stockColor = 'text-green-600';
        if (product.stock < 50) stockColor = 'text-yellow-600';
        if (product.stock < 20) stockColor = 'text-red-600 font-bold';
        
        const formattedPrice = (typeof product.price === 'number') ? product.price.toLocaleString('id-ID') : 'N/A';

        const rowHtmlContent = `
                <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900 border-r">${startIndex + index + 1}</td>
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

    tableBody.innerHTML = '';
    tableBody.appendChild(fragment);
    lucide.createIcons();

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }

    // Update pagination info is now handled solely by renderPagination
    console.log("Before calling renderPagination, currentPaginationState:", JSON.stringify(currentPaginationState));
    renderPagination(currentPaginationState.totalProducts, currentPaginationState.totalPages, currentPaginationState.currentPage, currentPaginationState.limit);
}

const renderPagination = (totalProducts, totalPages, currentPage, productsPerPage) => {
    console.log("renderPagination called with:", `totalProducts: ${totalProducts}, totalPages: ${totalPages}, currentPage: ${currentPage}, productsPerPage: ${productsPerPage}`);
    const paginationButtonsContainer = document.getElementById('pagination-buttons');
    paginationButtonsContainer.innerHTML = '';

    const paginationInfoSpan = document.getElementById('pagination-info');

    // Jika tidak ada produk, tampilkan pesan dan jangan render tombol paginasi
    if (totalProducts === 0) {
        paginationInfoSpan.textContent = 'Tidak ada produk ditemukan.';
        return;
    }

    const maxPageButtons = 5; // Number of page buttons to display at once (excluding first/last and ellipses)
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, currentPage + Math.floor(maxPageButtons / 2));

    if (endPage - startPage + 1 < maxPageButtons) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
        } else if (endPage === totalPages) {
            startPage = Math.max(1, totalPages - maxPageButtons + 1);
        }
    }

    const addPageButton = (page, isCurrent) => {
        const pageButton = document.createElement('button');
        pageButton.textContent = page;
        pageButton.className = `p-2 rounded-md ${isCurrent ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'hover:bg-gray-100 action-button'}`;
        pageButton.addEventListener('click', () => {
            currentPaginationState.currentPage = page;
            populateInventoryTable(); // Re-fetch data for new page
        });
        paginationButtonsContainer.appendChild(pageButton);
    };

    const addEllipsis = () => {
        const ellipsisSpan = document.createElement('span');
        ellipsisSpan.textContent = '...';
        ellipsisSpan.className = 'p-2';
        paginationButtonsContainer.appendChild(ellipsisSpan);
    };

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Sebelumnya';
    prevButton.className = `p-2 rounded-md hover:bg-gray-100 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'action-button'}`;
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPaginationState.currentPage--;
            populateInventoryTable();
        }
    });
    paginationButtonsContainer.appendChild(prevButton);

    if (totalPages > 1) {
        // Always show first page
        if (startPage > 1) {
            addPageButton(1, currentPage === 1);
            if (startPage > 2) {
                addEllipsis();
            }
        }

        // Show pages around current page
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i, currentPage === i);
        }

        // Always show last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                addEllipsis();
            }
            addPageButton(totalPages, currentPage === totalPages);
        }
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Berikutnya';
    // Disable next button if current page is the last page OR if there are no pages at all
    const isNextDisabled = (currentPage === totalPages) || (totalPages === 0);
    nextButton.className = `p-2 rounded-md hover:bg-gray-100 ${isNextDisabled ? 'opacity-50 cursor-not-allowed' : 'action-button'}`;
    nextButton.disabled = isNextDisabled;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPaginationState.currentPage++;
            populateInventoryTable();
        }
    });
    paginationButtonsContainer.appendChild(nextButton);
};

// Fungsi inisialisasi utama yang akan dipanggil oleh router SPA
window.initInventoryDaftarProdukPage = function() {
    console.log("Halaman Daftar Produk Dimuat.");
    
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

/**
 * Mengambil data dari Google Sheet dan mengisi tabel.
 * @param {string} [searchTerm] - The term to filter products by. If not provided, it's taken from the search input.
 */
function populateInventoryTable(searchTerm) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }

    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
    tableBody.innerHTML = ''; 

    const handleSuccess = (response) => {
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        if (!response || response.status !== 'success') {
            handleFailure(response || { message: 'Tidak ada respons dari server.' });
            return;
        }
        
        console.log('Server Response:', response);

        // Data is now in response.data, pagination info in response.pagination
        const { data, pagination } = response;

        // Defensive check: Ensure pagination is an object before accessing its properties
        const safePagination = pagination || {};
        const totalRecords = safePagination.totalRecords || 0;
        const pageNum = safePagination.page || 1;
        const pageSize = safePagination.pageSize || currentPaginationState.limit; // Use client-side default if not provided

        // Update currentPaginationState unconditionally
        currentPaginationState.totalProducts = totalRecords;
        currentPaginationState.currentPage = pageNum;
        currentPaginationState.limit = pageSize;
        currentPaginationState.totalPages = Math.ceil(currentPaginationState.totalProducts / currentPaginationState.limit);

        if (!data || data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center p-8 text-gray-500">Belum ada produk atau tidak ada hasil yang cocok.</td></tr>';
            allProducts = [];
            // currentPaginationState is already updated above, no need to reset to 0 here
            renderTable([], 0, 1, currentPaginationState.limit); // Render empty table but keep pagination consistent
        } else {
            // The renderTable function signature is (products, currentPage, itemsPerPage)
            renderTable(data, pageNum, pageSize);
        }
        
        hasFetchedInitialData = true;
        if (response.message && typeof showToast === 'function') {
            showToast(response.message, 'success');
        }
    };

    const handleFailure = (error) => {
        console.error("Gagal mengambil data produk:", error);
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        const errorMessage = (error && error.message) ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center p-8 text-red-500">Error: ${errorMessage}</td></tr>`;
        if (typeof showToast === 'function') {
            showToast(`Gagal memuat data: ${errorMessage}`, 'error');
        }
        hasFetchedInitialData = true;
    };

    // The search term now comes from the input field directly if not passed as an argument
    const finalSearchTerm = searchTerm !== undefined ? searchTerm : (document.getElementById('inventory-search') ? document.getElementById('inventory-search').value : '');

    const options = {
        page: currentPaginationState.currentPage,
        pageSize: currentPaginationState.limit,
        searchTerm: finalSearchTerm,
        sortColumn: currentSortColumn,
        sortOrder: currentSortOrder
    };

    // Call the new paginated function on the server
    window.sendDataToGoogle('getProductsPaginated', options, handleSuccess, handleFailure);
}

/**
 * Menangani proses pencarian produk.
 */
function handleSearch() {
    currentPaginationState.currentPage = 1; // Reset to first page on new search
    populateInventoryTable(); // Will pick up search term from input and fetch data
}

    /**
     * Mereset tampilan tabel ke kondisi awal.
     */
    function handleResetTable() {
        // Reset variabel sort
        currentSortColumn = null;
        currentSortOrder = 'asc';
        currentPaginationState.currentPage = 1; // Reset pagination

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
    const productNameInput = document.getElementById('product-name');
    const productSupplierPriceInput = document.getElementById('product-supplier-price');
    const productStockInput = document.getElementById('product-stock');
    const productCategoryInput = document.getElementById('product-category');
    const productBrandInput = document.getElementById('product-brand');


    form.reset();

    if (sku) { // Mode Edit
        isEditMode = true;
        editingSku = sku;
        const product = allProducts.find(p => p.sku === sku); // Find in the currently displayed products
        if (product) {
            modalTitle.textContent = 'Edit Produk';
            skuInput.value = product.sku;
            skuInput.readOnly = true; // SKU tidak bisa diubah saat edit
            productNameInput.value = product.name;
            productSupplierPriceInput.value = product.price; // Assuming 'price' from table is 'Harga Jual' which is 'Harga Supplier'
            productStockInput.value = product.stock;
            productCategoryInput.value = product.category;
            productBrandInput.value = product.brand;

            // Set fields as read-only and add styling
            productNameInput.readOnly = true;
            productNameInput.classList.add('bg-gray-100');
            productNameInput.setAttribute('data-source', 'master');

            productSupplierPriceInput.readOnly = true;
            productSupplierPriceInput.classList.add('bg-gray-100');
            productSupplierPriceInput.setAttribute('data-source', 'master');
        }
    } else { // Mode Tambah
        isEditMode = false;
        editingSku = null;
        modalTitle.textContent = 'Tambah Produk Baru';
        skuInput.readOnly = false;
        productNameInput.readOnly = false;
        productNameInput.classList.remove('bg-gray-100');
        productNameInput.removeAttribute('data-source');
        productSupplierPriceInput.readOnly = false;
        productSupplierPriceInput.classList.remove('bg-gray-100');
        productSupplierPriceInput.removeAttribute('data-source');
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
 * Menangani event submit dari form produk.
 * @param {Event} event Objek event dari form submission.
 */
function handleFormSubmit(event) {
    event.preventDefault(); // Mencegah reload halaman
    saveProduct();
}

/**
 * Mengirim data dari form ke Apps Script untuk disimpan.
 */
function saveProduct() {
    const productData = {
        sku: document.getElementById('product-sku').value.toUpperCase(),
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-supplier-price').value), // Use supplier price for saving
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        brand: document.getElementById('product-brand').value
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
                // Force a refresh from the server to ensure the table reflects the latest data
                // including any server-side logic (like MasterProduk lookup)
                currentPaginationState.currentPage = 1; // Reset to first page after saving
                populateInventoryTable(); 
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
            // Force a refresh from the server to ensure the table reflects the latest data
            currentPaginationState.currentPage = 1; // Reset to first page after deleting
            populateInventoryTable(); 
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

    // Debounce function to limit API calls
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Function to handle SKU input and search MasterProduk
    const handleSkuInput = () => {
        const skuInput = document.getElementById('product-sku');
        const productNameInput = document.getElementById('product-name');
        const productPriceInput = document.getElementById('product-price');
        const productSupplierPriceInput = document.getElementById('product-supplier-price');
        const skuLoadingSpinner = document.getElementById('sku-loading-spinner');

        const currentSku = skuInput.value.trim().toUpperCase();

        // Clear previous data and reset fields
        productNameInput.value = '';
        productNameInput.readOnly = false;
        productNameInput.classList.remove('bg-gray-100');
        productNameInput.removeAttribute('data-source');

        productPriceInput.value = '';
        productPriceInput.readOnly = false;
        productPriceInput.classList.remove('bg-gray-100');
        productPriceInput.removeAttribute('data-source');

        productSupplierPriceInput.value = '';

        if (currentSku.length < 3) { // Only search if SKU is long enough
            if (skuLoadingSpinner) skuLoadingSpinner.classList.add('hidden');
            return;
        }

        if (skuLoadingSpinner) skuLoadingSpinner.classList.remove('hidden');

        const handleMasterProductSuccess = (response) => {
            if (skuLoadingSpinner) skuLoadingSpinner.classList.add('hidden');
            if (response.status === 'success' && response.data) {
                const masterProduct = response.data;
                productNameInput.value = masterProduct.NamaProduk || '';
                productSupplierPriceInput.value = masterProduct.HargaSupplier || '';
                productPriceInput.value = masterProduct.HargaSupplier || ''; // Harga Jual = Harga Supplier

                // Set fields as read-only and add styling
                productNameInput.readOnly = true;
                productNameInput.classList.add('bg-gray-100');
                productNameInput.setAttribute('data-source', 'master');

                productPriceInput.readOnly = true;
                productPriceInput.classList.add('bg-gray-100');
                productPriceInput.setAttribute('data-source', 'master');

                if (typeof showToast === 'function') showToast('Data produk ditemukan di MasterProduk.', 'success');
            } else {
                // Product not found in MasterProduk
                if (typeof showToast === 'function') showToast(`SKU '${currentSku}' tidak ditemukan di MasterProduk.`, 'info');
            }
        };

        const handleMasterProductFailure = (error) => {
            if (skuLoadingSpinner) skuLoadingSpinner.classList.add('hidden');
            console.error('Error searching MasterProduk:', error);
            if (typeof showToast === 'function') showToast(`Gagal mencari SKU di MasterProduk: ${error.message}`, 'error');
        };

        window.sendDataToGoogle('getProductBySKU', { sku: currentSku }, handleMasterProductSuccess, handleMasterProductFailure);
    };

    const handleSkuInputDebounced = debounce(handleSkuInput, 500); // Debounce for 500ms

    // The router will call window.initInventoryDaftarProdukPage()

/**
 * Mengambil semua data produk dari server tanpa paginasi atau pencarian.
 * Berguna untuk mendapatkan daftar lengkap produk.
 * @param {Function} successCallback - Fungsi yang akan dipanggil jika berhasil.
 * @param {Function} failureCallback - Fungsi yang akan dipanggil jika gagal.
 */
function getDaftarProductClient(successCallback, failureCallback) {
    window.sendDataToGoogle('getDaftarProduct', {}, successCallback, failureCallback);
}
