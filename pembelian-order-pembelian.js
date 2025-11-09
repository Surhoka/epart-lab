// Pastikan fungsi ini hanya didefinisikan sekali
if (typeof window.initPembelianOrderPembelianPage === 'undefined') {

    window.initPembelianOrderPembelianPage = function() {
        console.log('Memulai inisialisasi halaman Order Pembelian...');

        // -----------------------------------------------------
        // EzyParts - Halaman Order Pembelian (Purchase Order)
        // -----------------------------------------------------

        // --- Inisialisasi Elemen ---
        const createPoButton = document.getElementById('create-po-button');
        const searchPoButton = document.getElementById('search-po-button');
        const resetPoTableButton = document.getElementById('reset-po-table-button');
        const poProductList = document.getElementById('po-product-list');
        const poNumberInput = document.getElementById('po-number');
        const poDateInput = document.getElementById('po-date');
        const poFormContainer = document.getElementById('po-form-container');
        const purchaseOrdersTableBody = document.getElementById('purchase-orders-table-body');

        let listenersAttached = false;

        // --- Helper Functions ---
        const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        function showLoading(isLoading) {
            if (isLoading) {
                purchaseOrdersTableBody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center p-5">
                            <div class="flex justify-center items-center">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                <span class="ml-3">Memuat data...</span>
                            </div>
                        </td>
                    </tr>`;
            } else {
                purchaseOrdersTableBody.innerHTML = '';
            }
        }

        function renderPurchaseOrdersTable(orders) {
            showLoading(false);
            if (!orders || orders.length === 0) {
                purchaseOrdersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-gray-500">Tidak ada data order pembelian.</td></tr>';
                return;
            }

            const tableRows = orders.map(order => `
                <tr class="hover:bg-gray-50">
                    <td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">${order.poNumber || 'N/A'}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-600 border-r">${formatDate(order.poDate)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-600 border-r">${order.supplier || 'N/A'}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-800 font-medium border-r">${formatCurrency(order.total || 0)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-center border-r">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                        </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-800 action-button mr-2" title="Lihat Detail">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 action-button" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `).join('');

            purchaseOrdersTableBody.innerHTML = tableRows;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        function loadPurchaseOrders(searchTerm = "") {
            console.log(`Memuat data order pembelian dengan filter: "${searchTerm}"`);
            showLoading(true);

            if (typeof google !== 'undefined' && typeof google.script !== 'undefined' && typeof google.script.run !== 'undefined') {
                google.script.run
                    .withSuccessHandler(response => {
                        if (response.success) {
                            renderPurchaseOrdersTable(response.data);
                        } else {
                            console.error('Gagal memuat data:', response.message);
                            purchaseOrdersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-5 text-red-500">Error: ${response.message}</td></tr>`;
                        }
                    })
                    .withFailureHandler(error => {
                        console.error('Error saat memanggil Apps Script:', error);
                        purchaseOrdersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-5 text-red-500">Error: ${error.message}</td></tr>`;
                    })
                    .getPurchaseOrders(searchTerm);
            } else {
                console.warn('Google Apps Script API not found. Loading mock data for development.');
                // Mock data for local development
                const mockData = [
                    { poNumber: 'PO-202511-001', poDate: '2025-11-01', supplier: 'PT. Maju Jaya', total: 500000, status: 'Completed' },
                    { poNumber: 'PO-202511-002', poDate: '2025-11-02', supplier: 'CV. Sparepart Sejati', total: 750000, status: 'Completed' },
                    { poNumber: 'PO-202511-003', poDate: '2025-11-03', supplier: 'Toko Sinar Abadi', total: 250000, status: 'Completed' }
                ];
                setTimeout(() => renderPurchaseOrdersTable(mockData), 1000); // Simulate network delay
            }
        }

        function generateNewPONumber() {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `PO-${year}${month}${day}-${randomSuffix}`;
        }

        function handleNewOrder() {
            console.log('Membuka form order pembelian baru...');
            poFormContainer.classList.remove('hidden');
            if (poNumberInput) poNumberInput.value = generateNewPONumber();
            const supplierSelect = document.getElementById('po-supplier');
            if(supplierSelect) supplierSelect.value = '';
            if(poProductList) poProductList.innerHTML = '';
            document.getElementById('po-total-amount').textContent = formatCurrency(0);
        }

        function handleSearch() {
            const searchTerm = document.getElementById('po-search').value;
            loadPurchaseOrders(searchTerm);
        }

        function handleResetTable() {
            document.getElementById('po-search').value = '';
            loadPurchaseOrders();
        }

        function handleAddProduct() {
            console.log('Menambah produk baru ke dalam list...');
            const newRowHTML = `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-900 border-r">${poProductList.rows.length + 1}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-left text-gray-900 border-r">SKU-BARU</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-left font-medium text-gray-900 border-r">Produk Baru</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-center border-r">1</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-right border-r">Rp 0</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-right border-r">0%</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-right border-r">Rp 0</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-right font-medium border-r">Rp 0</td>
                    <td class="px-3 py-2 whitespace-nowrap text-center text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-800 action-button mr-2" title="Edit">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 action-button" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
            if (poProductList) {
                poProductList.insertAdjacentHTML('beforeend', newRowHTML);
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }

        function handleSaveOrder(event) {
            event.preventDefault();
            console.log('Menyimpan order pembelian...');
            alert('Fungsi simpan order pembelian belum diimplementasikan.');
        }
        
        function handleTableClick(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const row = target.closest('tr');
            if (target.title === 'Hapus') {
                console.log('Menghapus baris produk...');
                row.remove();
            } else if (target.title === 'Edit') {
                console.log('Mengedit baris produk...');
                alert('Fungsi edit belum diimplementasikan.');
            }
        }

        function addEventListeners() {
            if (listenersAttached) return;

            if (createPoButton) createPoButton.addEventListener('click', handleNewOrder);
            if (searchPoButton) searchPoButton.addEventListener('click', handleSearch);
            if (resetPoTableButton) resetPoTableButton.addEventListener('click', handleResetTable);
            
            const addProductButton = poFormContainer.querySelector('button.ml-4.bg-indigo-600');
            if (addProductButton && addProductButton.textContent.includes('Tambah Produk')) {
                addProductButton.addEventListener('click', handleAddProduct);
            }

            const saveButton = poFormContainer.querySelector('button[type="submit"]');
            if (saveButton) saveButton.addEventListener('click', handleSaveOrder);
            
            if (poProductList) poProductList.addEventListener('click', handleTableClick);
            
            listenersAttached = true;
            console.log('Event listeners untuk Order Pembelian telah ditambahkan.');
        }

        function initializePage() {
            const today = new Date().toISOString().split('T')[0];
            if (poDateInput) poDateInput.value = today;

            loadPurchaseOrders();
            addEventListeners();

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('Halaman Order Pembelian berhasil diinisialisasi.');
        }

        // --- Jalankan Inisialisasi ---
        initializePage();
    };
}
