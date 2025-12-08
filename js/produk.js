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
    const searchInput = document.querySelector('input[type="text"][placeholder="Search..."]');
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
        if(container) container.innerHTML = ''; // Clear if no products
        return;
    }

    const { total, page, pageSize, totalPages } = paginationInfo;
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(startItem + pageSize - 1, total);

    let paginationHTML = `
        <p class="text-theme-xs font-medium text-gray-500 dark:text-gray-400">
            Showing ${startItem}-${endItem} of ${total}
        </p>
        <div class="flex items-center gap-2">
            <button
                onclick="changeProdukPage(${page - 1})"
                class="flex items-center justify-center rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                ${page === 1 ? 'disabled' : ''}>
                Prev
            </button>
            <div class="flex items-center gap-1">
    `;

    // Page number logic
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === page;
        paginationHTML += `
            <button
                onclick="changeProdukPage(${i})"
                class="flex items-center justify-center rounded-lg border ${isActive ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-300 bg-white'} py-1.5 px-3 text-theme-xs font-medium shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] ${isActive ? 'dark:bg-brand-500/10 dark:text-brand-400' : ''}"
                ${isActive ? 'disabled' : ''}>
                ${i}
            </button>
        `;
    }

    paginationHTML += `
            </div>
            <button
                onclick="changeProdukPage(${page + 1})"
                class="flex items-center justify-center rounded-lg border border-gray-300 bg-white py-1.5 px-3 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                ${page === totalPages ? 'disabled' : ''}>
                Next
            </button>
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
            return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
        default:
            return 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500';
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
        // Clear pagination if no results
        const paginationContainer = document.getElementById('pagination-container');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    tbody.innerHTML = produkData.map(produk => `
        <tr>
            <td class="py-3">
                <div class="flex items-center gap-3">
                     <div class="h-[50px] w-[50px] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        ${produk.produkUrl ?
            `<img src="${produk.produkUrl}" alt="${produk.name}" class="h-full w-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<svg class=\\'w-6 h-6 text-gray-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z\\'></path></svg>'"/>`
            : `<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
        }
                    </div>
                    <div>
                        <p class="font-medium text-gray-800 text-theme-sm dark:text-white/90">${produk.name || '-'}</p>
                        <span class="text-gray-500 text-theme-xs dark:text-gray-400">${produk.kodeProduk || '-'}</span>
                    </div>
                </div>
            </td>
            <td class="py-3">
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">${produk.category || '-'}</p>
            </td>
            <td class="py-3">
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">${produk.stock !== undefined ? produk.stock : '-'}</p>
            </td>
            <td class="py-3">
                <p class="text-gray-500 text-theme-sm dark:text-gray-400">${produk.price || '-'}</p>
            </td>
            <td class="py-3">
                <p class="inline-flex rounded-full px-2 py-0.5 text-theme-xs font-medium ${getBadgeClass(produk.status)}">
                    ${produk.status || 'Unknown'}
                </p>
            </td>
            <td class="py-3">
                <div class="flex items-center gap-2">
                    <button onclick="viewProduk('${produk.id}')" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="View Product">
                        <svg class="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.17812 8.99981 3.17812C14.5686 3.17812 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.6873 8.99999C2.41856 10.3219 5.24231 13.6969 8.99981 13.6969C12.7573 13.6969 15.5811 10.3219 16.3123 8.99999C15.5811 7.67812 12.7573 4.30312 8.99981 4.30312C5.24231 4.30312 2.41856 7.67812 1.6873 8.99999Z" fill=""/>
                            <path d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.73438C8.32499 7.73438 7.73438 8.32499 7.73438 9C7.73438 9.675 8.32499 10.2656 9 10.2656C9.675 10.2656 10.2656 9.675 10.2656 9C10.2656 8.32499 9.675 7.73438 9 7.73438Z" fill=""/>
                        </svg>
                    </button>
                    <button onclick="deleteProduk('${produk.id}')" class="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500" title="Delete Product">
                        <svg class="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.875 2.16563H12.9375V1.26563C12.9375 0.5625 12.375 0 11.6719 0H6.32812C5.625 0 5.0625 0.5625 5.0625 1.26563V2.16563H1.125C0.50625 2.16563 0 2.67188 0 3.29063V3.43125C0 3.65625 0.196875 3.825 0.421875 3.825H1.4625L2.10938 16.3125C2.16562 17.2688 2.95312 18 3.90938 18H14.1187C15.075 18 15.8625 17.2406 15.9187 16.2844L16.5656 3.825H17.5781C17.8031 3.825 18 3.62813 18 3.43125V3.29063C18 2.67188 17.4937 2.16563 16.875 2.16563ZM14.7937 16.2281C14.7656 16.6219 14.4562 16.875 14.1187 16.875H3.90937C3.57187 16.875 3.2625 16.6219 3.23437 16.2563L2.5875 3.825H15.4406L14.7937 16.2281ZM6.1875 1.26563C6.1875 1.18125 6.24375 1.125 6.32812 1.125H11.6719C11.7562 1.125 11.8125 1.18125 11.8125 1.26563V2.16563H6.1875V1.26563Z" fill=""/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
    // TODO: Implement view product modal or navigate to detail page
    if (window.showToast) {
        window.showToast('View product feature coming soon', 'info');
    }
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
