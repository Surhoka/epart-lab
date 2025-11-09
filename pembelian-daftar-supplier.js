window.initPembelianDaftarSupplierPage = function() {
    console.log('Initializing Pembelian Daftar Supplier Page');

    // --- FUNGSI MODAL SUPPLIER ---
    function openAddSupplierModal() {
        document.getElementById('supplier-modal-title').textContent = 'Tambah Supplier Baru';
        document.getElementById('add-supplier-form').reset();
        document.getElementById('supplier-modal').classList.remove('hidden');
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function closeSupplierModal() {
        document.getElementById('supplier-modal').classList.add('hidden');
    }

    // Event listeners
    const addSupplierButton = document.getElementById('add-supplier-button');
    if (addSupplierButton) {
        addSupplierButton.addEventListener('click', openAddSupplierModal);
    } else {
        console.warn('Add Supplier button not found.');
    }

    const supplierModalCloseButton = document.getElementById('supplier-modal-close-button');
    if (supplierModalCloseButton) {
        supplierModalCloseButton.addEventListener('click', closeSupplierModal);
    }

    const supplierModalCancelButton = document.getElementById('supplier-modal-cancel-button');
    if (supplierModalCancelButton) {
        supplierModalCancelButton.addEventListener('click', closeSupplierModal);
    }

    const addSupplierForm = document.getElementById('add-supplier-form');
    if (addSupplierForm) {
        addSupplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Implementasi untuk menyimpan data supplier (mock)
            const name = document.getElementById('supplier-name').value;
            const contactPerson = document.getElementById('supplier-contact-person').value;
            const phone = document.getElementById('supplier-phone').value;
            const address = document.getElementById('supplier-address').value;

            console.log('New Supplier:', { name, contactPerson, phone, address });
            // Di aplikasi nyata, kirim data ke backend atau update tabel
            
            closeSupplierModal();
            // Refresh tabel atau tambahkan baris baru secara dinamis jika diperlukan
            if (window.showToast) {
                window.showToast('Supplier berhasil ditambahkan!', 'success');
            }
        });
    }

    // Initial rendering or data loading for the supplier table can go here
    // For now, it's mock data in the HTML. If dynamic, you'd fetch it here.
};
