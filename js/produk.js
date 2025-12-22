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
    const mobileView = document.getElementById('products-mobile-view');
    
    const loadingContent = `
        <div class="flex items-center justify-center gap-2 py-8">
            <svg class="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 dark:text-gray-400">Loading products...</p>
        </div>
    `;

    // Show loading state
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">${loadingContent}</td></tr>`;
    }
    if (mobileView) {
        mobileView.innerHTML = loadingContent;
    }

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
    const mobileView = document.getElementById('products-mobile-view');
    
    const searchingContent = `
        <div class="flex items-center justify-center gap-2 py-8">
            <svg class="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 dark:text-gray-400">Searching...</p>
        </div>
    `;

    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">${searchingContent}</td></tr>`;
    }
    if (mobileView) {
        mobileView.innerHTML = searchingContent;
    }

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
        <div class="px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between w-full sm:px-6">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm text-center md:text-left">
                Showing <span class="text-gray-800 dark:text-white">${startItem}</span> to <span class="text-gray-800 dark:text-white">${endItem}</span> of <span class="text-gray-800 dark:text-white">${total}</span> results
            </p>
            <div class="flex items-center justify-center gap-2">
                <button
                    onclick="changeProdukPage(${page - 1})"
                    class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.08] sm:h-10 sm:px-4 sm:text-sm"
                    ${page === 1 ? 'disabled' : ''}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-4 sm:h-4">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span class="hidden xs:inline">Prev</span>
                </button>
                
                <div class="hidden sm:flex items-center gap-1.5">
    `;

    // Show fewer page numbers on mobile
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === page;
        paginationHTML += `
            <button
                onclick="changeProdukPage(${i})"
                class="inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all sm:h-10 sm:w-10 sm:text-sm ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 ring-4 ring-brand-500/10' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]'}"
                ${isActive ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }

    paginationHTML += `
                </div>

                <!-- Mobile page indicator -->
                <div class="flex sm:hidden items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/[0.05]">
                    <span class="text-xs font-medium text-gray-600 dark:text-gray-400">${page} of ${totalPages}</span>
                </div>

                <button
                    onclick="changeProdukPage(${page + 1})"
                    class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:text-brand-500 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400 dark:hover:bg-white/[0.08] sm:h-10 sm:px-4 sm:text-sm"
                    ${page === totalPages ? 'disabled' : ''}>
                    <span class="hidden xs:inline">Next</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="sm:w-4 sm:h-4">
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
            return 'badge-success';
        case 'Habis':
            return 'badge-warning';
        case 'Arsip':
            return 'badge-gray';
        default:
            return 'badge-error';
    }
}

/**
 * Render products table and mobile cards
 */
function renderProdukTable() {
    const tbody = document.getElementById('products-table-body');
    const mobileView = document.getElementById('products-mobile-view');
    
    if (!tbody && !mobileView) return;

    if (!produkData || produkData.length === 0) {
        const emptyMessage = `
            <div class="py-8 text-center">
                <p class="text-gray-500 dark:text-gray-400">
                    ${currentSearchTerm ? 'No products found matching your search' : 'No products available'}
                </p>
            </div>
        `;
        
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center"><p class="text-gray-500 dark:text-gray-400">${currentSearchTerm ? 'No products found matching your search' : 'No products available'}</p></td></tr>`;
        }
        if (mobileView) {
            mobileView.innerHTML = emptyMessage;
        }
        
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    // Render mobile cards
    if (mobileView) {
        renderMobileCards();
    }

    // Render desktop table
    if (tbody) {
        renderDesktopTable();
    }
}

/**
 * Render mobile card view
 */
function renderMobileCards() {
    const mobileView = document.getElementById('products-mobile-view');
    if (!mobileView) return;

    const selectedProductId = localStorage.getItem('selectedProductId');

    mobileView.innerHTML = produkData.map(produk => {
        const isSelected = produk.id === selectedProductId;
        return `
            <div 
                data-id="${produk.id}" 
                onclick="viewProduk('${produk.id}')" 
                class="p-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-white/[0.02] transition-colors"
            >
                <div class="flex items-start gap-3">
                    <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 flex items-center justify-center">
                        ${produk.produkUrl ?
                `<img src="${produk.produkUrl}" alt="${produk.NamaProduk}" class="h-full w-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<svg class=\\'w-8 h-8 text-gray-300\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\'></path></svg>'"/>` 
                : `<svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
            }
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2 mb-2">
                            <div class="flex-1 min-w-0">
                                <h3 class="font-bold text-gray-800 dark:text-white/90 text-sm truncate">${produk.namaProduk || '-'}</h3>
                                <p class="text-xs text-gray-400 dark:text-gray-500 font-medium">${produk.kodeProduk || '-'}</p>
                            </div>
                            <span class="badge ${getBadgeClass(produk.status)} text-xs">
                                ${produk.status || 'Unknown'}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-3 text-xs">
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Category:</span>
                                <p class="font-medium text-gray-700 dark:text-gray-300">${produk.kategori || '-'}</p>
                            </div>
                            <div>
                                <span class="text-gray-500 dark:text-gray-400">Stock:</span>
                                <p class="font-bold text-gray-700 dark:text-gray-300">${produk.stok !== undefined ? produk.stok : '-'}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between mt-3">
                            <div>
                                <span class="text-gray-500 dark:text-gray-400 text-xs">Price:</span>
                                <p class="font-bold text-brand-600 dark:text-brand-400 text-sm">${produk.hargaJual || '-'}</p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button onclick="event.stopPropagation(); viewProduk('${produk.id}')" class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-brand-500 hover:text-white transition-all dark:bg-white/[0.05] dark:text-gray-400" title="View Product">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </button>
                                <button onclick="event.stopPropagation(); deleteProduk('${produk.id}')" class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all dark:bg-red-500/10 dark:text-red-400" title="Delete Product">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render desktop table view
 */
function renderDesktopTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

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
                    <span class="badge ${getBadgeClass(produk.status)}">
                        ${produk.status || 'Unknown'}
                    </span>
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
 * Show error state in table and mobile view
 * @param {String} message - Error message to display
 */
function showErrorState(message) {
    const tbody = document.getElementById('products-table-body');
    const mobileView = document.getElementById('products-mobile-view');

    const errorContent = `
        <div class="flex flex-col items-center gap-2 py-8">
            <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p class="text-gray-700 dark:text-gray-300 font-medium">Error Loading Products</p>
            <p class="text-gray-500 dark:text-gray-400 text-sm text-center">${message}</p>
            <button onclick="fetchProdukData(currentPage)" class="mt-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm">
                Retry
            </button>
        </div>
    `;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    ${errorContent}
                </td>
            </tr>
        `;
    }

    if (mobileView) {
        mobileView.innerHTML = errorContent;
    }
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
