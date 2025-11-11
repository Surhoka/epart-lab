    const inventoryTableBody = document.getElementById('inventory-table-body');
    const inventorySearchInput = document.getElementById('inventory-search');
    const searchButton = document.getElementById('search-button');
    const resetTableButton = document.getElementById('reset-table-button');
    const loadingOverlay = document.getElementById('loading-overlay');
    const tableHeaders = document.querySelectorAll('#inventory-table-container th[data-sort]');

    let allProducts = [];
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    // Pagination variables
    const productsPerPage = 10;
    let currentPage = 1;

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
        return new Promise(resolve => {
            window.sendDataToGoogle('getProducts', {}, (response) => {
                hideLoading();
                if (response.status === 'success') {
                    allProducts = response.data;
                    resolve(allProducts);
                } else {
                    console.error('Error fetching products:', response.message);
                    showToast('Gagal memuat data produk: ' + response.message, 'error');
                    allProducts = [];
                    resolve([]);
                }
            }, (error) => {
                hideLoading();
                console.error('Network error fetching products:', error);
                showToast('Kesalahan jaringan saat memuat data produk.', 'error');
                allProducts = [];
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

        const startIndex = (currentPage - 1) * productsPerPage;
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

    const renderPagination = (totalProducts, totalPages) => {
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
                applyFiltersAndSort();
            }
        });
        paginationButtonsContainer.appendChild(prevButton);

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = `p-2 rounded-md ${currentPage === i ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'hover:bg-gray-100 action-button'}`;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                applyFiltersAndSort();
            });
            paginationButtonsContainer.appendChild(pageButton);
        }

        // Next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Berikutnya';
        nextButton.className = `p-2 rounded-md hover:bg-gray-100 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'action-button'}`;
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                applyFiltersAndSort();
            }
        });
        paginationButtonsContainer.appendChild(nextButton);
    };

    const applyFiltersAndSort = () => {
        let filteredProducts = [...allProducts];
        const searchTerm = inventorySearchInput.value.toLowerCase();

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(product =>
                (product.SKU && product.SKU.toLowerCase().includes(searchTerm)) ||
                (product.NamaProduk && product.NamaProduk.toLowerCase().includes(searchTerm)) ||
                (product.Merek && product.Merek.toLowerCase().includes(searchTerm))
            );
        }

        if (currentSortColumn) {
            filteredProducts.sort((a, b) => {
                const aValue = a[currentSortColumn];
                const bValue = b[currentSortColumn];

                if (currentSortColumn === 'HargaSupplier') {
                    const numA = parseFloat(aValue);
                    const numB = parseFloat(bValue);
                    if (numA < numB) return currentSortDirection === 'asc' ? -1 : 1;
                    if (numA > numB) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                } else {
                    if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
                    if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                }
            });
        }

        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / productsPerPage);

        // Adjust currentPage if it's out of bounds after filtering/sorting
        if (totalPages === 0) {
            currentPage = 1; // Always keep currentPage at 1, even if no products
        } else if (currentPage > totalPages) {
            currentPage = totalPages;
        } else if (currentPage < 1) {
            currentPage = 1;
        }

        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        renderTable(paginatedProducts);
        renderPagination(totalProducts, totalPages);
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
            await fetchProductData(); // Re-fetch original data
            applyFiltersAndSort();
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

                applyFiltersAndSort();
            });
        });
    };

    // Initial load function for SPA router
    window.initInventoryMasterProdukPage = async () => {
        await fetchProductData();
        applyFiltersAndSort();
        setupEventListeners();
        // Render Lucide icons if they are present on the page
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };
