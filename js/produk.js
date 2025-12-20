// Global state for produk
let produkData = [];
let currentSearchTerm = '';
let currentPage = 1;
let pageSize = 5; // Display 5 products per page
let paginationInfo = {};

// Produk page initialization
window.initProdukPage = function () {
    console.log("Produk Page Initialized");

    // Initialize Breadcrumb  
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Produk');
    }

    // Setup search functionality
    setupSearchListener();

    // Fetch and render products for the first page
    fetchProdukData(currentPage);
};

/**
 * Setup search input listener
 */
function setupSearchListener() {
    const searchInput = document.querySelector('input[placeholder*="Search products"]');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim();

            searchTimeout = setTimeout(() => {
                currentSearchTerm = searchTerm;
                currentPage = 1; // Reset to first page for new search
                if (currentSearchTerm) {
                    searchProduk(currentSearchTerm, currentPage);
                } else {
                    fetchProdukData(currentPage);
                }
            }, 500); // Wait 500ms after user stops typing
        });
    }
}

/**
 * Fetch product data from Google Sheets API with pagination
 * @param {number} page - The page number to fetch.
 */
function fetchProdukData(page = 1) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center"><div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p class="text-gray-500 dark:text-gray-400">Loading products...</p></div></td></tr>`;

    const options = { page, pageSize };

    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('getProduk', options, (response) => {
            if (response.status === 'success' && response.data && response.pagination) {
                produkData = response.data;
                paginationInfo = response.pagination;
                currentPage = paginationInfo.page;
                renderProdukTable();
                renderPagination();
            } else {
                const version = response.version || 'unknown';
                console.error(`Failed to load products. The response was invalid (version: ${version}).`, response);
                showErrorState(response.message || `Invalid server response (v: ${version}).`);
            }
        }, (error) => {
            console.error('Error fetching products:', error);
            showErrorState('Error connecting to server');
        });
    } else {
        console.error('sendDataToGoogle function not found.');
        showErrorState('API function not available');
    }
}

/**
 * Search products by term with pagination
 * @param {String} searchTerm - Search keyword.
 * @param {number} page - The page number to fetch.
 */
function searchProduk(searchTerm, page = 1) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center"><div class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><p class="text-gray-500 dark:text-gray-400">Searching...</p></div></td></tr>`;

    const options = { searchTerm, page, pageSize };

    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('searchProduk', options, (response) => {
            if (response.status === 'success' && response.data && response.pagination) {
                produkData = response.data;
                paginationInfo = response.pagination;
                currentPage = paginationInfo.page;
                renderProdukTable();
                renderPagination();
            } else {
                const version = response.version || 'unknown';
                console.error(`Search failed. The response was invalid (version: ${version}).`, response);
                showErrorState(response.message || `Invalid search response (v: ${version}).`);
            }
        }, (error) => {
            console.error('Error searching products:', error);
            showErrorState('Error connecting to server');
        });
    } else {
        console.error('sendDataToGoogle function not found');
        showErrorState('API function not available');
    }
}

/**
 * Render pagination controls
 */
function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container || !paginationInfo || paginationInfo.total === 0) {
        if (container) container.innerHTML = '';
        return;
    }

    const { total, page, pageSize, totalPages } = paginationInfo;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(startItem + pageSize - 1, total);

    let paginationHTML = `
        <div class="px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                Showing <span class="text-gray-800 dark:text-white">${startItem}</span> to <span class="text-gray-800 dark:text-white">${endItem}</span> of <span class="text-gray-800 dark:text-white">${total}</span> results
            </p>
            <div class="flex items-center gap-2">
                <button
                    onclick="changeProdukPage(${page - 1})"
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                    ${page === 1 ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Prev
                </button>
                
                <div class="hidden sm:flex items-center gap-1.5">
    `;

    // Page number logic (simplified for now but styled)
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === page;
        paginationHTML += `
            <button
                onclick="changeProdukPage(${i})"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 ring-4 ring-brand-500/10' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]'}"
                ${isActive ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }

    paginationHTML += `
                </div>

                <button
                    onclick="changeProdukPage(${page + 1})"
                    class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.08]"
                    ${page === totalPages ? 'disabled' : ''}>
                    Next
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    `;

    container.innerHTML = paginationHTML;
}

/**
 * Handle page change for pagination
 * @param {number} page - The new page number to navigate to.
 */
window.changeProdukPage = function (page) {
    if (page < 1 || page > paginationInfo.totalPages || page === currentPage) {
        return;
    }
    currentPage = page;
    if (currentSearchTerm) {
        searchProduk(currentSearchTerm, currentPage);
    } else {
        fetchProdukData(currentPage);
    }
}


/**
 * Get badge class based on product status
 * @param {String} status - Product status
 * @returns {String} - Tailwind CSS classes for the badge
 */
function getBadgeClass(status) {
    switch (status) {
        case 'Aktif':
            return 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500';
        case 'Habis':
            return 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500';
        case 'Arsip':
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400';
        default:
            return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500';
    }
}

/**
 * Render products table
 */
function renderProdukTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    if (!produkData || produkData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center">
                    <p class="text-gray-500 dark:text-gray-400">
                        ${currentSearchTerm ? 'No products found matching your search' : 'No products available'}
                    </p>
                </td>
            </tr>
        `;
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    const selectedProductId = localStorage.getItem('selectedProductId');

    tbody.innerHTML = produkData.map(produk => {
        const isSelected = produk.id === selectedProductId;
        return `
            <tr 
                data-id="${produk.id}" 
                onclick="viewProduk('${produk.id}')" 
                class="group cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50/80 dark:border-gray-800 dark:hover:bg-white/[0.02] transition-colors"
            >
                <td class="px-6 py-4">
                    <div class="flex items-center gap-4">
                         <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 flex items-center justify-center">
                            ${produk.produkUrl ?
                `<img src="${produk.produkUrl}" alt="${produk.NamaProduk}" class="h-full w-full object-cover transition-transform group-hover:scale-110" onerror="this.onerror=null; this.parentElement.innerHTML='<svg class=\\'w-6 h-6 text-gray-300\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\'></path></svg>'"/>`
                : `<svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
            }
                        </div>
                        <div>
                            <p class="font-bold text-gray-800 text-sm dark:text-white/90 group-hover:text-brand-500 transition-colors">${produk.namaProduk || '-'}</p>
                            <span class="text-gray-400 text-xs font-medium dark:text-gray-500">${produk.kodeProduk || '-'}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <p class="text-gray-600 text-sm dark:text-gray-400 font-medium">${produk.kategori || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-gray-600 text-sm dark:text-gray-400 font-bold">${produk.stok !== undefined ? produk.stok : '-'}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="text-brand-600 text-sm dark:text-brand-400 font-bold">${produk.hargaJual || '-'}</p>
                </td>
                <td class="px-6 py-4">
                    <p class="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${getBadgeClass(produk.status)}">
                        ${produk.status || 'Unknown'}
                    </p>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="event.stopPropagation(); viewProduk('${produk.id}')" class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-brand-500 hover:text-white transition-all dark:bg-white/[0.05] dark:text-gray-400" title="View Product">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button onclick="event.stopPropagation(); deleteProduk('${produk.id}')" class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all dark:bg-red-500/10 dark:text-red-400" title="Delete Product">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Show error state in table
 * @param {String} message - Error message to display
 */
function showErrorState(message) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="py-8 text-center">
                <div class="flex flex-col items-center gap-2">
                    <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-gray-700 dark:text-gray-300 font-medium">Error Loading Products</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">${message}</p>
                    <button onclick="fetchProdukData(currentPage)" class="mt-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
                        Retry
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * View product details
 * @param {String} productId - Product ID
 */
window.viewProduk = function (productId) {
    console.log('View product:', productId);
    localStorage.setItem('selectedProductId', productId);
    window.location.hash = '#tambah-produk';
};

/**
 * Delete product
 * @param {String} productId - Product ID
 */
window.deleteProduk = function (productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('deleteProduk', { productId }, (response) => {
            if (response.status === 'success') {
                if (window.showToast) {
                    window.showToast('Product deleted successfully', 'success');
                }
                // Refresh the product list on the current page
                if (currentSearchTerm) {
                    searchProduk(currentSearchTerm, currentPage);
                } else {
                    fetchProdukData(currentPage);
                }
            } else {
                console.error('Failed to delete product:', response.message);
                if (window.showToast) {
                    window.showToast('Failed to delete product: ' + response.message, 'error');
                }
            }
        }, (error) => {
            console.error('Error deleting product:', error);
            if (window.showToast) {
                window.showToast('Error deleting product', 'error');
            }
        });
    } else {
        console.error('sendDataToGoogle function not found');
        if (window.showToast) {
            window.showToast('API function not available', 'error');
        }
    }
};
