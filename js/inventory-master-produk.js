    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventorySearchInput = document.getElementById('inventory-search');
    const searchButton = document.getElementById('search-button');
    const resetTableButton = document.getElementById('reset-table-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const tableHeaders = document.querySelectorAll('#inventory-table-container th[data-sort]');

    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    // Pagination variables
    const productsPerPage = 10; // Default limit
    let currentPage = 1;
    let totalProducts = 0;
    let totalPages = 0;

    const paginationInfoSpan = document.getElementById('pagination-info');
    const paginationButtonsContainer = document.getElementById('pagination-buttons');

    // Helper to format Rupiah currency
    const formatRupiah = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const showLoading = () => {
        loadingOverlay.classList.remove('hidden');
    };

    const hideLoading = () => {
        loadingOverlay.classList.add('hidden');
    };

    const fetchProductData = async () => {
        showLoading();
        const searchTerm = inventorySearchInput.value;

        const params = {
            action: 'getProducts',
            page: currentPage,
            limit: productsPerPage,
            searchTerm: searchTerm,
            sortColumn: currentSortColumn,
            sortDirection: currentSortDirection
        };

        return new Promise(resolve => {
            window.sendDataToGoogle('getProducts', params, (response) => {
                hideLoading();
                if (response.status === 'success') {
                    // Update global state with server response
                    allProducts = response.data; // This will be the paginated data
                    totalProducts = response.totalProducts;
                    totalPages = response.totalPages;
                    currentPage = response.currentPage;
                    // productsPerPage = response.limit; // Can update if server enforces a different limit

                    renderTable(allProducts);
                    renderPagination();
                    resolve(allProducts);
                } else {
                    console.error('Error fetching products:', response.message);
                    showToast('Gagal memuat data produk: ' + response.message, 'error');
                    allProducts = [];
                    totalProducts = 0;
                    totalPages = 0;
                    renderTable([]);
                    renderPagination();
                    resolve([]);
                }
            }, (error) => {
                hideLoading();
                console.error('Network error fetching products:', error);
                showToast('Kesalahan jaringan saat memuat data produk.', 'error');
                allProducts = [];
                totalProducts = 0;
                totalPages = 0;
                renderTable([]);
                renderPagination();
                resolve([]);
            });
        });
    };

    const renderTable = (productsToRender) => {
        inventoryTableBody.innerHTML = '';
        if (productsToRender.length === 0) {
            inventoryTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-3 py-2 text-center text-gray-500">Tidak ada produk ditemukan.</td>
                </tr>
            `;
            return;
        }

        // Calculate startIndex based on server's currentPage and limit
        const startIndex = (currentPage - 1) * productsPerPage;
        console.log(`DEBUG: renderTable - currentPage: ${currentPage}, productsPerPage: ${productsPerPage}, startIndex: ${startIndex}`); // Added debug log
        productsToRender.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap border-r">${startIndex + index + 1}</td>
                <td class="px-3 py-2 whitespace-nowrap border-r">${product.SKU || '-'}</td>
                <td class="px-3 py-2 whitespace-nowrap border-r">${product.NamaProduk || '-'}</td>
                <td class="px-3 py-2 whitespace-nowrap text-right border-r">${formatRupiah(product.HargaSupplier || 0)}</td>
            `;
            inventoryTableBody.appendChild(row);
        });
    };

    const renderPagination = () => {
        paginationButtonsContainer.innerHTML = '';
        paginationInfoSpan.textContent = `Menampilkan ${Math.min((currentPage - 1) * productsPerPage + 1, totalProducts)} sampai ${Math.min(currentPage * productsPerPage, totalProducts)} dari ${totalProducts} Produk`;

        // Previous button
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Sebelumnya';
        prevButton.className = `p-2 rounded-md hover:bg-gray-100 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'action-button'}`;
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchProductData(); // Fetch data for previous page
            }
        });
        paginationButtonsContainer.appendChild(prevButton);

        // Page numbers (dynamic rendering)
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
                currentPage = page;
                fetchProductData(); // Fetch data for selected page
            });
            paginationButtonsContainer.appendChild(pageButton);
        };

        const addEllipsis = () => {
            const ellipsisSpan = document.createElement('span');
            ellipsisSpan.textContent = '...';
            ellipsisSpan.className = 'p-2';
            paginationButtonsContainer.appendChild(ellipsisSpan);
        };

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
        nextButton.className = `p-2 rounded-md hover:bg-gray-100 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'action-button'}`;
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchProductData(); // Fetch data for next page
            }
        });
        paginationButtonsContainer.appendChild(nextButton);
    };

    const applyFiltersAndSort = () => {
        // Client-side filtering, sorting, and pagination logic removed.
        // All these operations are now handled by the server.
        // Just trigger a data fetch with current parameters.
        currentPage = 1; // Reset to first page on new filter/sort
        fetchProductData();
    };

    const setupEventListeners = () => {
        searchButton.addEventListener('click', applyFiltersAndSort);
        inventorySearchInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                applyFiltersAndSort();
            }
        });

        resetTableButton.addEventListener('click', async () => {
            inventorySearchInput.value = '';
            currentSortColumn = null;
            currentSortDirection = 'asc';
            currentPage = 1; // Reset pagination
            // Reset sort icons
            tableHeaders.forEach(header => {
                const icon = header.querySelector('.sort-icon');
                if (icon) {
                    icon.setAttribute('data-lucide', 'chevrons-up-down');
                    lucide.createIcons();
                }
            });
            await fetchProductData(); // Re-fetch data with default parameters
        });

        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortColumn = header.dataset.sort;
                const icon = header.querySelector('.sort-icon');

                if (currentSortColumn === sortColumn) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortColumn = sortColumn;
                    currentSortDirection = 'asc';
                }

                // Reset all icons
                tableHeaders.forEach(h => {
                    const i = h.querySelector('.sort-icon');
                    if (i) {
                        i.setAttribute('data-lucide', 'chevrons-up-down');
                    }
                });

                // Set current sort icon
                if (icon) {
                    icon.setAttribute('data-lucide', currentSortDirection === 'asc' ? 'chevron-up' : 'chevron-down');
                }
                lucide.createIcons(); // Re-render lucide icons after changing data-lucide attribute

                applyFiltersAndSort(); // Trigger server-side sort
            });
        });
    };

    // Initial load function for SPA router
    window.initInventoryMasterProdukPage = async () => {
        await fetchProductData(); // Initial fetch with default parameters
        setupEventListeners();
        // Render Lucide icons if they are present on the page
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };
