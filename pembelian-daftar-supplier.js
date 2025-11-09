window.initPembelianDaftarSupplierPage = function() {
    console.log('Initializing Pembelian Daftar Supplier Page');

    // --- Global Variables & State ---
    let allSuppliers = [];
    let isEditMode = false;
    let editingSupplierId = null;

    // --- DOM Elements ---
    const supplierTableBody = document.getElementById('supplier-table-body');
    const addSupplierButton = document.getElementById('add-supplier-button');
    const supplierModal = document.getElementById('supplier-modal');
    const supplierModalTitle = document.getElementById('supplier-modal-title');
    const supplierModalCloseButton = document.getElementById('supplier-modal-close-button');
    const supplierModalCancelButton = document.getElementById('supplier-modal-cancel-button');
    const addSupplierForm = document.getElementById('add-supplier-form');
    const supplierNameInput = document.getElementById('supplier-name');
    const supplierContactPersonInput = document.getElementById('supplier-contact-person');
    const supplierPhoneInput = document.getElementById('supplier-phone');
    const supplierAddressInput = document.getElementById('supplier-address');
    const searchSupplierInput = document.getElementById('search-supplier-input'); // Assuming a search input will be added
    const searchSupplierButton = document.getElementById('search-supplier-button'); // Assuming a search button will be added

    // --- Helper Functions ---
    function showLoading(isLoading) {
        // Implement a loading indicator if needed
        if (isLoading) {
            supplierTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Memuat data...</td></tr>';
        }
    }

    function showToast(message, type = 'info') {
        // Placeholder for a toast notification function
        console.log(`Toast (${type}): ${message}`);
        // In a real app, you'd display a visual toast here
    }

    // --- Modal Functions ---
    function openSupplierModal(mode, supplier = null) {
        isEditMode = mode === 'edit';
        supplierModalTitle.textContent = isEditMode ? 'Edit Supplier' : 'Tambah Supplier Baru';
        addSupplierForm.reset();

        if (isEditMode && supplier) {
            editingSupplierId = supplier.ID; // Assuming 'ID' is the unique identifier
            supplierNameInput.value = supplier.NamaSupplier || '';
            supplierContactPersonInput.value = supplier.KontakPerson || '';
            supplierPhoneInput.value = supplier.NoTelepon || '';
            supplierAddressInput.value = supplier.Alamat || '';
        } else {
            editingSupplierId = null;
        }
        supplierModal.classList.remove('hidden');
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function closeSupplierModal() {
        supplierModal.classList.add('hidden');
    }

    // --- Data Fetching & Rendering ---
    function renderSuppliersTable(suppliers) {
        showLoading(false);
        if (!Array.isArray(suppliers) || suppliers.length === 0) {
            supplierTableBody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-gray-500">Belum ada data supplier.</td></tr>';
            return;
        }

        const fragment = document.createDocumentFragment();
        suppliers.forEach(supplier => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 text-xs border-b';
            tr.dataset.supplierId = supplier.ID; // Assuming 'ID' is the unique identifier
            tr.innerHTML = `
                <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900">${supplier.ID || 'N/A'}</td>
                <td class="px-3 py-2 whitespace-nowrap font-medium text-gray-900">${supplier['Nama Supplier'] || 'N/A'}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-700">${supplier['Kontak Person'] || 'N/A'}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-500">${supplier['No.Telepon'] || 'N/A'}</td>
                <td class="px-3 py-2 whitespace-nowrap text-gray-500">${supplier.Alamat || 'N/A'}</td>
                <td class="px-3 py-2 text-center">
                    <button class="text-indigo-600 hover:text-indigo-900 edit-supplier-btn" title="Edit">
                        <i data-lucide="square-pen" class="w-4 h-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 delete-supplier-btn ml-2" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            fragment.appendChild(tr);
        });

        supplierTableBody.innerHTML = '';
        supplierTableBody.appendChild(fragment);
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function loadSuppliers(searchTerm = '', forceRefresh = false) {
        showLoading(true);
        const action = searchTerm ? 'searchSuppliers' : 'getSuppliers'; // Assuming a searchSuppliers action in backend
        const params = searchTerm ? { searchTerm: searchTerm } : {};

        window.sendDataToGoogle(action, params,
            (response) => {
                if (response.status === 'success' && Array.isArray(response.data)) {
                    allSuppliers = response.data;
                    renderSuppliersTable(allSuppliers);
                    if (response.message) showToast(response.message, 'success');
                } else {
                    showToast(response.message || 'Gagal memuat data supplier.', 'error');
                    renderSuppliersTable([]); // Render empty table on error
                }
            },
            (error) => {
                console.error('Error loading suppliers:', error);
                showToast('Terjadi kesalahan saat memuat data supplier.', 'error');
                renderSuppliersTable([]); // Render empty table on error
            }
        );
    }

    // --- Event Handlers ---
    function handleAddEditSupplier(e) {
        e.preventDefault();
        const supplierData = {
            NamaSupplier: supplierNameInput.value,
            KontakPerson: supplierContactPersonInput.value,
            NoTelepon: supplierPhoneInput.value,
            Alamat: supplierAddressInput.value
        };

        let action = 'addSupplier';
        if (isEditMode) {
            action = 'updateSupplier';
            supplierData.ID = editingSupplierId; // Add ID for update
        }

        window.sendDataToGoogle(action, { supplierData: supplierData },
            (response) => {
                if (response.status === 'success') {
                    showToast(response.message, 'success');
                    closeSupplierModal();
                    loadSuppliers(searchSupplierInput.value); // Reload with current search term
                } else {
                    showToast(response.message || 'Gagal menyimpan supplier.', 'error');
                }
            },
            (error) => {
                console.error('Error saving supplier:', error);
                showToast('Terjadi kesalahan saat menyimpan supplier.', 'error');
            }
        );
    }

    function handleTableClick(e) {
        const target = e.target.closest('button');
        if (!target) return;

        const row = target.closest('tr');
        const supplierId = row.dataset.supplierId;
        const supplier = allSuppliers.find(s => s.ID == supplierId); // Find by ID

        if (target.classList.contains('edit-supplier-btn')) {
            if (supplier) {
                openSupplierModal('edit', supplier);
            } else {
                showToast('Supplier tidak ditemukan untuk diedit.', 'error');
            }
        } else if (target.classList.contains('delete-supplier-btn')) {
            if (confirm(`Apakah Anda yakin ingin menghapus supplier ${supplier.NamaSupplier}?`)) {
                window.sendDataToGoogle('deleteSupplier', { supplierId: supplierId },
                    (response) => {
                        if (response.status === 'success') {
                            showToast(response.message, 'success');
                            loadSuppliers(searchSupplierInput.value); // Reload with current search term
                        } else {
                            showToast(response.message || 'Gagal menghapus supplier.', 'error');
                        }
                    },
                    (error) => {
                        console.error('Error deleting supplier:', error);
                        showToast('Terjadi kesalahan saat menghapus supplier.', 'error');
                    }
                );
            }
        }
    }

    function handleSearch() {
        loadSuppliers(searchSupplierInput.value);
    }

    // --- Event Listeners ---
    if (addSupplierButton) addSupplierButton.addEventListener('click', () => openSupplierModal('add'));
    if (supplierModalCloseButton) supplierModalCloseButton.addEventListener('click', closeSupplierModal);
    if (supplierModalCancelButton) supplierModalCancelButton.addEventListener('click', closeSupplierModal);
    if (addSupplierForm) addSupplierForm.addEventListener('submit', handleAddEditSupplier);
    if (supplierTableBody) supplierTableBody.addEventListener('click', handleTableClick);
    if (searchSupplierButton) searchSupplierButton.addEventListener('click', handleSearch);
    if (searchSupplierInput) searchSupplierInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission
            handleSearch();
        }
    });

    // --- Initialization ---
    loadSuppliers(); // Initial load of suppliers
};
