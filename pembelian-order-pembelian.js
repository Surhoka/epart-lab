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
        const poListView = document.getElementById('po-list-view'); // Reference the new list view container
        console.log('poListView:', poListView); // Debug log
        const poProductList = document.getElementById('po-product-list');
        const poNumberInput = document.getElementById('po-number');
        const poDateInput = document.getElementById('po-date');
        const poSupplierSelect = document.getElementById('po-supplier'); // Reference the new select element
        const addProductButton = document.getElementById('add-product-button'); // Reference the add product button
        const cancelPoButton = document.getElementById('cancel-po-button'); // Added this line

        // --- Helper Functions ---
        const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
        // formatDate is not strictly needed here, but keeping it for consistency if other parts of the form use it.

        let productRowCount = 0; // To keep track of product rows

        function addProductRow() {
            productRowCount++;
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap text-center border-r">${productRowCount}</td>
                <td class="px-3 py-2 whitespace-nowrap border-r">
                    <input type="text" class="product-sku w-full p-1 border rounded-md" placeholder="SKU">
                </td>
                <td class="px-3 py-2 whitespace-nowrap border-r">
                    <input type="text" class="product-name w-full p-1 border rounded-md" placeholder="Nama Produk">
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-center border-r">
                    <input type="number" class="product-qty w-20 p-1 border rounded-md text-center" value="1" min="1">
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-right border-r">
                    <input type="number" class="product-buy-price w-full p-1 border rounded-md text-right" value="0" min="0">
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-right border-r">
                    <input type="number" class="product-discount w-full p-1 border rounded-md text-right" value="0" min="0">
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-right border-r">
                    <input type="number" class="product-sell-price w-full p-1 border rounded-md text-right" value="0" min="0">
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-right border-r product-subtotal">${formatCurrency(0)}</td>
                <td class="px-3 py-2 whitespace-nowrap text-center">
                    <button type="button" class="delete-product-row text-red-600 hover:text-red-800 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            poProductList.appendChild(newRow);
            if (typeof lucide !== 'undefined') lucide.createIcons();
            updateTotalAmount(); // Update total when a new row is added
        }

        function updateTotalAmount() {
            let total = 0;
            poProductList.querySelectorAll('tr').forEach(row => {
                const qty = parseFloat(row.querySelector('.product-qty').value) || 0;
                const buyPrice = parseFloat(row.querySelector('.product-buy-price').value) || 0;
                const discount = parseFloat(row.querySelector('.product-discount').value) || 0;
                const subtotal = (qty * buyPrice) - discount;
                row.querySelector('.product-subtotal').textContent = formatCurrency(subtotal);
                total += subtotal;
            });
            document.getElementById('po-total-amount').textContent = formatCurrency(total);
        }

        // Event delegation for deleting product rows
        poProductList.addEventListener('click', (event) => {
            if (event.target.closest('.delete-product-row')) {
                event.target.closest('tr').remove();
                productRowCount--; // Decrement count
                // Re-number rows
                poProductList.querySelectorAll('tr').forEach((row, index) => {
                    row.children[0].textContent = index + 1;
                });
                updateTotalAmount();
            }
        });

        // Event delegation for input changes to update total
        poProductList.addEventListener('input', (event) => {
            if (event.target.classList.contains('product-qty') ||
                event.target.classList.contains('product-buy-price') ||
                event.target.classList.contains('product-discount')) {
                updateTotalAmount();
            }
        });

        async function loadSuppliers() {
            console.log('Memuat data supplier...');
            window.sendDataToGoogle('getSuppliers', {},
                (response) => {
                    if (response.status === 'success' && response.data) {
                        poSupplierSelect.innerHTML = '<option value="">Pilih Supplier</option>'; // Reset and add default
                        response.data.forEach(supplier => {
                            const option = document.createElement('option');
                            option.value = supplier['Nama Supplier']; // Use the correct key 'Nama Supplier'
                            option.textContent = supplier['Nama Supplier']; // Use the correct key 'Nama Supplier'
                            poSupplierSelect.appendChild(option);
                        });
                        console.log('Data supplier berhasil dimuat.');
                    } else {
                        console.error('Gagal memuat data supplier:', response.message);
                        if (typeof showToast === 'function') showToast('Gagal memuat data supplier.', 'error');
                    }
                },
                (error) => {
                    console.error('Error koneksi saat memuat supplier:', error);
                    if (typeof showToast === 'function') showToast('Error koneksi saat memuat supplier.', 'error');
                }
            );
        }

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

            poListView.classList.add('hidden'); // Hide the list view
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
                        poListView.classList.remove('hidden'); // Show the list view
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
            poListView.classList.remove('hidden'); // Show the list view
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
            if (addProductButton) {
                console.log('Attaching click listener to addProductButton:', addProductButton);
                addProductButton.addEventListener('click', addProductRow);
            }
            if (poForm) poForm.addEventListener('submit', handleSaveOrder);
            if (cancelPoButton) cancelPoButton.addEventListener('click', handleCancelOrder);
            
            console.log('Event listeners untuk Order Pembelian (Form) telah ditambahkan/diperbarui.');
        }

        function initializePage() {
            addEventListeners();
            loadSuppliers(); // Load suppliers when the page initializes

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('Halaman Order Pembelian (Form) berhasil diinisialisasi.');
        }

        // --- Jalankan Inisialisasi ---
        initializePage();
    };
}
