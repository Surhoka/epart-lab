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
        
        // Flag untuk menandai apakah event listener sudah ditambahkan
        let listenersAttached = false;

        /**
         * Menghasilkan nomor Purchase Order (PO) baru berdasarkan tanggal.
         * @returns {string} Nomor PO baru, contoh: "PO-20251109-001"
         */
        function generateNewPONumber() {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            return `PO-${year}${month}${day}-${randomSuffix}`;
        }

        /**
         * Menangani event klik pada tombol "Order Baru".
         */
        function handleNewOrder() {
            console.log('Membuat order pembelian baru...');
            if (poNumberInput) {
                poNumberInput.value = generateNewPONumber();
            }
            const supplierSelect = document.getElementById('po-supplier');
            if(supplierSelect) supplierSelect.value = '';
            if(poProductList) poProductList.innerHTML = '';
            alert('Form siap untuk order pembelian baru.');
        }

        /**
         * Menangani event klik pada tombol "Cari".
         */
        function handleSearch() {
            const searchTerm = document.getElementById('po-search').value;
            console.log(`Mencari order pembelian dengan kata kunci: "${searchTerm}"`);
            alert(`Fungsi pencarian untuk "${searchTerm}" belum diimplementasikan.`);
        }

        /**
         * Menangani event klik pada tombol "Reset Tabel".
         */
        function handleResetTable() {
            console.log('Mereset tampilan tabel...');
            document.getElementById('po-search').value = '';
            alert('Fungsi reset tabel belum diimplementasikan.');
        }

        /**
         * Menangani event klik pada tombol "Tambah Produk".
         */
        function handleAddProduct() {
            console.log('Menambah produk baru ke dalam list...');
            const newRowHTML = `
                <tr>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-center font-medium text-gray-900 border-r">${poProductList.rows.length + 1}</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-left text-gray-900 border-r">SKU-BARU</td>
                    <td class="px-3 py-2 whitespace-nowrap text-sm text-left font-medium text-gray-900 border-r">Produk Baru</td>
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

        /**
         * Menangani event klik pada tombol "Simpan".
         * @param {Event} event - Event object.
         */
        function handleSaveOrder(event) {
            event.preventDefault();
            console.log('Menyimpan order pembelian...');
            alert('Fungsi simpan order pembelian belum diimplementasikan.');
        }
        
        /**
         * Menangani klik pada tabel produk (delegasi event).
         */
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

        /**
         * Menambahkan semua event listener ke elemen.
         */
        function addEventListeners() {
            if (listenersAttached) return; // Hanya tambahkan sekali

            if (createPoButton) createPoButton.addEventListener('click', handleNewOrder);
            if (searchPoButton) searchPoButton.addEventListener('click', handleSearch);
            if (resetPoTableButton) resetPoTableButton.addEventListener('click', handleResetTable);
            
            const addProductButton = document.querySelector('button.ml-4.bg-indigo-600');
            if (addProductButton && addProductButton.textContent.includes('Tambah Produk')) {
                addProductButton.addEventListener('click', handleAddProduct);
            }

            const saveButton = document.querySelector('button[type="submit"]');
            if (saveButton) saveButton.addEventListener('click', handleSaveOrder);
            
            if (poProductList) poProductList.addEventListener('click', handleTableClick);
            
            listenersAttached = true;
            console.log('Event listeners untuk Order Pembelian telah ditambahkan.');
        }

        /**
         * Inisialisasi utama halaman.
         */
        function initializePage() {
            // Set tanggal hari ini
            const today = new Date().toISOString().split('T')[0];
            if (poDateInput) poDateInput.value = today;

            // Generate nomor PO baru
            if (poNumberInput) poNumberInput.value = generateNewPONumber();

            // Tambahkan event listeners
            addEventListeners();

            // Inisialisasi ikon Lucide
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('Halaman Order Pembelian berhasil diinisialisasi.');
        }

        // --- Jalankan Inisialisasi ---
        initializePage();
    };
}
