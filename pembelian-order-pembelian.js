// Pastikan fungsi ini hanya didefinisikan sekali
if (typeof window.initPembelianOrderPembelianPage === 'undefined') {
    window.initPembelianOrderPembelianPage = function() {
        console.log('Memulai inisialisasi halaman Order Pembelian...');

        // -----------------------------------------------------
        // EzyParts - Halaman Order Pembelian (Purchase Order)
        // v2 - Disesuaikan dengan pola inventory-daftar-produk.js
        // -----------------------------------------------------

        // --- Variabel Global & State ---
        let allPurchaseOrders = [];
        let hasFetchedInitialData = false;
        let isEditMode = false;
        let editingPoNumber = null;

        // --- Inisialisasi Elemen ---
        const createPoButton = document.getElementById('create-po-button');
        console.log('createPoButton:', createPoButton); // Debug log
        const searchPoInput = document.getElementById('po-search');
        const searchPoButton = document.getElementById('search-po-button');
        const resetPoTableButton = document.getElementById('reset-po-table-button');
        
        const poFormContainer = document.getElementById('po-form-container');
        console.log('poFormContainer:', poFormContainer); // Debug log
        const purchaseOrdersTableContainer = document.getElementById('purchase-orders-table-container'); // Added this line
        console.log('purchaseOrdersTableContainer:', purchaseOrdersTableContainer); // Debug log
        const poProductList = document.getElementById('po-product-list');
        const poNumberInput = document.getElementById('po-number');
        const poDateInput = document.getElementById('po-date');
        const purchaseOrdersTableBody = document.getElementById('purchase-orders-table-body');
        const loadingOverlay = document.getElementById('loading-overlay-po'); // Asumsi ada overlay loading
        const cancelPoButton = document.getElementById('cancel-po-button'); // Added this line

        // Removed pagePembelianOrderPembelian for direct event listener approach

        // --- Helper Functions ---
        const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        };

        // --- Fungsi Render & UI ---

        function showLoading(isLoading) {
            if (loadingOverlay) {
                loadingOverlay.classList.toggle('hidden', !isLoading);
            }
            if(isLoading) {
                purchaseOrdersTableBody.innerHTML = ''; // Kosongkan tabel saat loading
            }
        }

        function renderPurchaseOrdersTable(orders) {
            showLoading(false);
            if (!Array.isArray(orders)) {
                console.error("Data yang diterima bukan array:", orders);
                purchaseOrdersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-red-500">Error: Format data order tidak valid.</td></tr>';
                return;
            }

            if (orders.length === 0) {
                purchaseOrdersTableBody.innerHTML = '<tr><td colspan="6" class="text-center p-8 text-gray-500">Belum ada order pembelian. Silakan buat order baru.</td></tr>';
                return;
            }

            const fragment = document.createDocumentFragment();
            orders.forEach(order => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-gray-50 text-xs border-b';
                tr.dataset.poNumber = order.poNumber;
                tr.innerHTML = `
                    <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900 border-r">${order.poNumber || 'N/A'}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-gray-600 border-r">${formatDate(order.poDate)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-gray-600 border-r">${order.supplier || 'N/A'}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-right text-gray-800 font-medium border-r">${formatCurrency(order.total)}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-center border-r">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            ${order.status || 'Completed'}
                        </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap text-center font-medium">
                        <button class="text-indigo-600 hover:text-indigo-800 action-button mr-2 view-po-btn" title="Lihat Detail">
                            <i data-lucide="eye" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 action-button delete-po-btn" title="Hapus">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </td>
                `;
                fragment.appendChild(tr);
            });

            purchaseOrdersTableBody.innerHTML = '';
            purchaseOrdersTableBody.appendChild(fragment);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        // --- Fungsi Pengambilan Data ---

        function loadPurchaseOrders(forceRefresh = false) {
            if (hasFetchedInitialData && !forceRefresh) {
                renderPurchaseOrdersTable(allPurchaseOrders);
                return;
            }
            
            showLoading(true);

            const handleSuccess = (response) => {
                showLoading(false);
                if (response && response.status === 'success' && Array.isArray(response.data)) {
                    allPurchaseOrders = response.data;
                    renderPurchaseOrdersTable(allPurchaseOrders);
                    hasFetchedInitialData = true;
                    if (response.message && typeof showToast === 'function') {
                        showToast(response.message, 'success');
                    }
                } else {
                    handleFailure({ message: response.message || 'Gagal memuat data dengan format yang benar.' });
                }
            };

            const handleFailure = (error) => {
                showLoading(false);
                console.error("Gagal mengambil data order:", error);
                const errorMessage = error.message || 'Terjadi kesalahan koneksi.';
                purchaseOrdersTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-red-500">Error: ${errorMessage}</td></tr>`;
                if (typeof showToast === 'function') {
                    showToast(`Gagal memuat data: ${errorMessage}`, 'error');
                }
            };

            // Menggunakan sendDataToGoogle yang konsisten
            window.sendDataToGoogle('getPurchaseOrders', {}, handleSuccess, handleFailure);
        }

        // --- Event Handlers ---

        function handleSearch() {
            const searchTerm = searchPoInput.value.toLowerCase().trim();
            if (!searchTerm) {
                renderPurchaseOrdersTable(allPurchaseOrders);
                return;
            }
            const filteredOrders = allPurchaseOrders.filter(order => {
                return (order.poNumber && order.poNumber.toLowerCase().includes(searchTerm)) ||
                       (order.supplier && order.supplier.toLowerCase().includes(searchTerm));
            });
            renderPurchaseOrdersTable(filteredOrders);
        }

        function handleResetTable() {
            searchPoInput.value = '';
            loadPurchaseOrders(true); // Paksa muat ulang dari server
            if (typeof showToast === 'function') {
                showToast('Tabel telah dimuat ulang.', 'info');
            }
        }

        function handleNewOrder(event) { // Added event parameter
            event.stopPropagation(); // Prevent event from bubbling up
            event.preventDefault();  // Prevent default action (e.g., form submission if button type is submit)
            console.log('handleNewOrder triggered!'); // Debug log
            isEditMode = false;
            editingPoNumber = null;
            console.log('Membuka form order pembelian baru...');
            
            // Reset form
            document.getElementById('po-form').reset();
            poProductList.innerHTML = '';
            document.getElementById('po-total-amount').textContent = formatCurrency(0);

            // Set tanggal hari ini
            poDateInput.value = new Date().toISOString().split('T')[0];

            // Dapatkan nomor PO baru dari server
            window.sendDataToGoogle('getNewPoNumber', {}, 
                (response) => {
                    if(response.status === 'success') {
                        poNumberInput.value = response.data;
                    } else {
                        // Fallback jika gagal
                        poNumberInput.value = `PO-${Date.now()}`;
                        if (typeof showToast === 'function') showToast('Gagal mendapatkan No. PO baru, gunakan nomor sementara.', 'warning');
                    }
                },
                (error) => {
                    console.error("Gagal mendapatkan No. PO baru:", error);
                    poNumberInput.value = `PO-${Date.now()}`;
                    if (typeof showToast === 'function') showToast('Error koneksi saat meminta No. PO.', 'error');
                }
            );

            purchaseOrdersTableContainer.classList.add('hidden'); // Hide the table
            poFormContainer.classList.remove('hidden'); // Show the form
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function handleSaveOrder(event) {
            event.preventDefault();
            console.log('Menyimpan order pembelian...');
            // Logika penyimpanan akan ditambahkan di sini
            // alert('Fungsi simpan order pembelian belum diimplementasikan sepenuhnya.');
            
            // Contoh pengiriman data
            
            const orderData = {
                poNumber: poNumberInput.value,
                poDate: poDateInput.value,
                supplier: document.getElementById('po-supplier').value,
                total: 0, // Hitung total dari produk
                products: [] // Ambil dari tabel produk
            };

            window.sendDataToGoogle('savePurchaseOrder', { orderData }, 
                (response) => {
                    if(response.status === 'success') {
                        if (typeof showToast === 'function') showToast(response.message, 'success');
                        poFormContainer.classList.add('hidden');
                        purchaseOrdersTableContainer.classList.remove('hidden'); // Show the table
                        loadPurchaseOrders(true); // Muat ulang data
                    } else {
                        if (typeof showToast === 'function') showToast(response.message, 'error');
                    }
                },
                (error) => {
                    if (typeof showToast === 'function') showToast(`Error: ${error.message}`, 'error');
                }
            );
            
        }

        function handleCancelOrder() {
            console.log('Membatalkan order pembelian...');
            poFormContainer.classList.add('hidden'); // Hide the form
            purchaseOrdersTableContainer.classList.remove('hidden'); // Show the table
            if (typeof showToast === 'function') {
                showToast('Pembuatan order dibatalkan.', 'info');
            }
        }

        function handleDelete(poNumber) {
            if (!confirm(`Apakah Anda yakin ingin menghapus Order Pembelian No: ${poNumber}?`)) {
                return;
            }
            alert(`Fungsi hapus untuk ${poNumber} belum diimplementasikan.`);
            // Logika penghapusan akan ditambahkan di sini
        }

        function handleViewDetails(poNumber) {
            alert(`Fungsi lihat detail untuk ${poNumber} belum diimplementasikan.`);
            // Logika untuk menampilkan detail akan ditambahkan di sini
        }

        function handleTableClick(e) {
            const target = e.target.closest('button');
            if (!target) return;

            const poNumber = target.closest('tr').dataset.poNumber;

            if (target.classList.contains('view-po-btn')) {
                handleViewDetails(poNumber);
            } else if (target.classList.contains('delete-po-btn')) {
                handleDelete(poNumber);
            }
        }
        
        function addEventListeners() {
            // Hapus listener lama untuk mencegah duplikasi
            // if (createPoButton) createPoButton.removeEventListener('click', handleNewOrder); // Removed direct listener
            if (searchPoButton) searchPoButton.removeEventListener('click', handleSearch);
            if (resetPoTableButton) resetPoTableButton.removeEventListener('click', handleResetTable);
            if (purchaseOrdersTableBody) purchaseOrdersTableBody.removeEventListener('click', handleTableClick);
            const poForm = document.getElementById('po-form');
            if (poForm) poForm.removeEventListener('submit', handleSaveOrder);
            if (cancelPoButton) cancelPoButton.removeEventListener('click', handleCancelOrder);

            // Tambah listener baru (direct listener)
            if (createPoButton) {
                console.log('Attaching direct click listener to createPoButton:', createPoButton); // Debug log
                createPoButton.addEventListener('click', handleNewOrder);
            }
            if (searchPoButton) searchPoButton.addEventListener('click', handleSearch);
            if (resetPoTableButton) resetPoTableButton.addEventListener('click', handleResetTable);
            if (purchaseOrdersTableBody) purchaseOrdersTableBody.addEventListener('click', handleTableClick);
            if (poForm) poForm.addEventListener('submit', handleSaveOrder);
            if (cancelPoButton) cancelPoButton.addEventListener('click', handleCancelOrder);
            
            console.log('Event listeners untuk Order Pembelian telah ditambahkan/diperbarui.');
        }

        function initializePage() {
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

// Panggil inisialisasi jika file ini dimuat dalam konteks pengembangan (opsional)
// Pada SPA, router akan memanggil window.initPembelianOrderPembelianPage()
// document.addEventListener('DOMContentLoaded', () => {
//     // if (!document.body.classList.contains('spa-mode')) {
//          window.initPembelianOrderPembelianPage();
//     // }
// });
