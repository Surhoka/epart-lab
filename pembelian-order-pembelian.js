// Pastikan fungsi ini hanya didefinisikan sekali
if (typeof window.initPembelianOrderPembelianPage === 'undefined') {
    window.initPembelianOrderPembelianPage = function() {
        console.log('Memulai inisialisasi halaman Order Pembelian...');

        // -----------------------------------------------------
        // EzyParts - Halaman Order Pembelian (Purchase Order)
        // v2 - Disesuaikan dengan pola inventory-daftar-produk.js
        // -----------------------------------------------------

        // --- Variabel Global & State ---
        let isEditMode = false;
        let editingPoNumber = null;

        // --- Inisialisasi Elemen ---
        const createPoButton = document.getElementById('create-po-button');
        console.log('createPoButton:', createPoButton); // Debug log
        
        const poFormContainer = document.getElementById('po-form-container');
        console.log('poFormContainer:', poFormContainer); // Debug log
        const poPageContent = document.getElementById('page-pembelian-order-pembelian'); // Reference the main page content
        console.log('poPageContent:', poPageContent); // Debug log
        const poProductList = document.getElementById('po-product-list');
        const poNumberInput = document.getElementById('po-number');
        const poDateInput = document.getElementById('po-date');
        const cancelPoButton = document.getElementById('cancel-po-button'); // Added this line

        // --- Helper Functions ---
        const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
        // formatDate is not strictly needed here, but keeping it for consistency if other parts of the form use it.

        // --- Event Handlers ---

        function handleNewOrder(event) {
            event.stopPropagation();
            event.preventDefault();
            console.log('handleNewOrder triggered!');
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

            poPageContent.classList.add('hidden'); // Hide the main page content
            poFormContainer.classList.remove('hidden'); // Show the form
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function handleSaveOrder(event) {
            event.preventDefault();
            console.log('Menyimpan order pembelian...');
            
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
                        poPageContent.classList.remove('hidden'); // Show the main page content
                        // Trigger a reload of the purchase order list if it's active
                        if (typeof window.initPembelianDaftarPembelianPage === 'function') {
                            window.initPembelianDaftarPembelianPage(); // Re-initialize to refresh data
                        }
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
            poPageContent.classList.remove('hidden'); // Show the main page content
            if (typeof showToast === 'function') {
                showToast('Pembuatan order dibatalkan.', 'info');
            }
        }
        
        function addEventListeners() {
            const poForm = document.getElementById('po-form');
            if (createPoButton) {
                console.log('Attaching direct click listener to createPoButton:', createPoButton);
                createPoButton.addEventListener('click', handleNewOrder);
            }
            if (poForm) poForm.addEventListener('submit', handleSaveOrder);
            if (cancelPoButton) cancelPoButton.addEventListener('click', handleCancelOrder);
            
            console.log('Event listeners untuk Order Pembelian (Form) telah ditambahkan/diperbarui.');
        }

        function initializePage() {
            addEventListeners();

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('Halaman Order Pembelian (Form) berhasil diinisialisasi.');
        }

        // --- Jalankan Inisialisasi ---
        initializePage();
    };
}
