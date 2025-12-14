// Store uploaded images globally for the page
const uploadedImages = [null, null, null, null, null];

// Handle image upload for each slot
function handleImageUpload(event, index) {
    const file = event.target.files[0];
    if (file) {
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimal 2MB per gambar.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            uploadedImages[index] = e.target.result;

            // Show preview in slot
            const imageSlot = document.getElementById(`imageSlot${index}`);
            const imagePreview = document.getElementById(`imagePreview${index}`);
            const removeBtn = document.getElementById(`removeBtn${index}`);

            if(imageSlot && imagePreview && removeBtn) {
                imageSlot.classList.add('hidden');
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
                removeBtn.classList.remove('hidden');
                removeBtn.classList.add('flex');
            }

            // Update sidebar preview with first image
            updateSidebarPreview();
        };
        reader.readAsDataURL(file);
    }
}

// Remove image from slot
function removeImage(index) {
    // Check if the image slot elements exist before proceeding
    const imageSlot = document.getElementById(`imageSlot${index}`);
    if (!imageSlot) return; // If elements are not on the page, do nothing

    uploadedImages[index] = null;

    const imagePreview = document.getElementById(`imagePreview${index}`);
    const removeBtn = document.getElementById(`removeBtn${index}`);
    const fileInput = document.getElementById(`gambarProduk${index + 1}`);

    if(imageSlot && imagePreview && removeBtn && fileInput) {
        imageSlot.classList.remove('hidden');
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        removeBtn.classList.add('hidden');
        removeBtn.classList.remove('flex');
        fileInput.value = '';
    }

    // Update sidebar preview
    updateSidebarPreview();
}

// Update sidebar preview with the main image (slot 0)
function updateSidebarPreview() {
    const sidebarImagePreview = document.getElementById('sidebarImagePreview');
    const previewImage = document.getElementById('previewImage');
    const placeholderDiv = sidebarImagePreview ? sidebarImagePreview.querySelector('div') : null;

    if (!sidebarImagePreview || !previewImage || !placeholderDiv) return;

    const mainImage = uploadedImages[0];

    if (mainImage) {
        previewImage.src = mainImage;
        previewImage.classList.remove('hidden');
        placeholderDiv.classList.add('hidden');
    } else {
        previewImage.src = '';
        previewImage.classList.add('hidden');
        placeholderDiv.classList.remove('hidden');
    }
}


// Main initialization function called by the SPA router
window.initTambahProdukPage = function () {
    console.log("Tambah Produk Page Initialized. Setting up event listeners.");

    const productId = localStorage.getItem('selectedProductId');
    const isEditMode = productId !== null;

    // Initialize Breadcrumb and titles
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb(isEditMode ? 'Edit Produk' : 'Tambah Produk');
    }
    const pageTitle = document.querySelector('h2'); // Assuming there is a title element
    if(pageTitle) pageTitle.textContent = isEditMode ? 'Edit Produk' : 'Tambah Produk';


    // Reset form and image previews from previous states
    const form = document.getElementById('addNewProductForm');
    if (form) form.reset();
    for (let i = 0; i < 5; i++) {
        removeImage(i);
    }

    const setupLivePreview = () => {
        // --- Live Preview Logic ---
        const updatePreview = (inputId, previewId, prefix = '', suffix = '') => {
            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);
            if (input && preview) {
                const newInput = input.cloneNode(true);
                input.replaceWith(newInput);
                newInput.addEventListener('input', function () {
                    const value = this.value || '-';
                    preview.textContent = prefix + (value === '-' ? value : this.value) + suffix;
                });
            }
        };

        const formatCurrency = (num) => {
            return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '0';
        };

        // Set up all live previews
        updatePreview('namaProduk', 'previewNamaProduk');
        updatePreview('kodeProduk', 'previewKodeProduk');

        const hargaModalInput = document.getElementById('hargaModal');
        const hargaJualInput = document.getElementById('hargaJual');
        const previewHargaModal = document.getElementById('previewHargaModal');
        const previewHargaJual = document.getElementById('previewHargaJual');

        if (hargaModalInput && previewHargaModal) {
            const newHargaModalInput = hargaModalInput.cloneNode(true);
            hargaModalInput.replaceWith(newHargaModalInput);
            newHargaModalInput.addEventListener('input', function () {
                previewHargaModal.textContent = 'Rp ' + formatCurrency(this.value);
            });
        }

        if (hargaJualInput && previewHargaJual) {
            const newHargaJualInput = hargaJualInput.cloneNode(true);
            hargaJualInput.replaceWith(newHargaJualInput);
            newHargaJualInput.addEventListener('input', function () {
                previewHargaJual.textContent = 'Rp ' + formatCurrency(this.value);
            });
        }

        const kategoriSelect = document.getElementById('kategoriProduk');
        const previewKategori = document.getElementById('previewKategori');
        if (kategoriSelect && previewKategori) {
            const newKategoriSelect = kategoriSelect.cloneNode(true);
            kategoriSelect.replaceWith(newKategoriSelect);
            newKategoriSelect.addEventListener('change', function () {
                previewKategori.textContent = this.value || '-';
            });
        }

        const statusRadios = document.querySelectorAll('input[name="status"]');
        const previewStatus = document.getElementById('previewStatus');
        if (statusRadios.length > 0 && previewStatus) {
            statusRadios.forEach(radio => {
                const newRadio = radio.cloneNode(true);
                radio.replaceWith(newRadio);
                newRadio.addEventListener('change', function () {
                    if (this.checked && this.value === 'Aktif') {
                        previewStatus.textContent = 'Aktif';
                        previewStatus.className = 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400';
                    } else if (this.checked) {
                        previewStatus.textContent = 'Tidak Aktif';
                        previewStatus.className = 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400';
                    }
                });
            });
        }
    };

    const populateForm = (product) => {
        if (!product) return;
        
        // Populate text and select fields
        document.getElementById('namaProduk').value = product.namaProduk || '';
        const kodeProdukElement = document.getElementById('kodeProduk');
        if (kodeProdukElement) {
            kodeProdukElement.value = product.kodeProduk || '';
        }
        const deskripsiElement = document.getElementById('deskripsi');
        if (deskripsiElement) {
            deskripsiElement.value = product.deskripsi || '';
        }
        const kategoriProdukElement = document.getElementById('kategoriProduk');
        if (kategoriProdukElement) {
            kategoriProdukElement.value = product.kategoriProduk || '';
        }
        const subKategoriElement = document.getElementById('subKategori');
        if (subKategoriElement) {
            subKategoriElement.value = product.subKategori || '';
        }
        const stokElement = document.getElementById('stok');
        if (stokElement) {
            stokElement.value = product.stok || '';
        }
        const hargaModalElement = document.getElementById('hargaModal');
        if (hargaModalElement) {
            hargaModalElement.value = product.hargamodal || '';
        }
        const beratElement = document.getElementById('berat');
        if (beratElement) {
            beratElement.value = product.berat || '';
        }
        const panjangElement = document.getElementById('panjang');
        if (panjangElement) {
            panjangElement.value = product.panjang || '';
        }
        const lebarElement = document.getElementById('lebar');
        if (lebarElement) {
            lebarElement.value = product.lebar || '';
        }
        const tinggiElement = document.getElementById('tinggi');
        if (tinggiElement) {
            tinggiElement.value = product.tinggi || '';
        }
        const hargaJualElement = document.getElementById('hargaJual');
        if (hargaJualElement) {
            hargaJualElement.value = product.price || '';
        }
        const stokMinimalElement = document.getElementById('stokMinimal');
        if (stokMinimalElement) {
            stokMinimalElement.value = product.stokminimal || '';
        }
        const satuanElement = document.getElementById('satuan');
        if (satuanElement) {
            satuanElement.value = product.satuan || '';
        }
        const catatanElement = document.getElementById('catatan');
        if (catatanElement) {
            catatanElement.value = product.catatan || '';
        }

        // Populate status radio
        if (product.status) {
            const statusRadio = document.querySelector(`input[name="status"][value="${product.status}"]`);
            if (statusRadio) statusRadio.checked = true;
        }

        // Populate checkbox
        const produkUnggulanElement = document.getElementById('produkUnggulan');
        if (produkUnggulanElement) {
            produkUnggulanElement.checked = product.produkUnggulan;
        }

        // Populate image
        if (product.produkUrl) {
            uploadedImages[0] = product.produkUrl;
            const imageSlot = document.getElementById(`imageSlot0`);
            const imagePreview = document.getElementById(`imagePreview0`);
            const removeBtn = document.getElementById(`removeBtn0`);

            if (imageSlot && imagePreview && removeBtn) {
                imageSlot.classList.add('hidden');
                imagePreview.src = product.produkUrl;
                imagePreview.classList.remove('hidden');
                removeBtn.classList.remove('hidden');
                removeBtn.classList.add('flex');
            }
        }
        
        updateSidebarPreview();
        // Manually trigger input events to update live preview
        document.getElementById('namaProduk').dispatchEvent(new Event('input'));
        document.getElementById('kodeProduk').dispatchEvent(new Event('input'));
        document.getElementById('hargaJual').dispatchEvent(new Event('input'));
        document.getElementById('kategoriProduk').dispatchEvent(new Event('change'));
    };

    const setupFormSubmission = () => {
        const saveButton = document.getElementById('saveProductBtn');
        if (saveButton) {
            const newSaveButton = saveButton.cloneNode(true);
            saveButton.parentNode.replaceChild(newSaveButton, saveButton);

            newSaveButton.addEventListener('click', function () {
                const originalButtonHTML = newSaveButton.innerHTML;

                if (window.setButtonLoading) {
                    window.setButtonLoading(newSaveButton, 'Menyimpan...');
                } else {
                    newSaveButton.disabled = true;
                }

                const productData = {
                    id: isEditMode ? productId : null,
                    namaProduk: document.getElementById('namaProduk')?.value || '',
                    kodeProduk: document.getElementById('kodeProduk')?.value || '',
                    deskripsi: document.getElementById('deskripsi')?.value || '',
                    kategoriProduk: document.getElementById('kategoriProduk')?.value || '',
                    stok: document.getElementById('stok')?.value || '', // Added stok field
                    hargaModal: document.getElementById('hargaModal')?.value || '',
                    hargaJual: document.getElementById('hargaJual')?.value || '',
                    satuan: document.getElementById('satuan')?.value || '',
                    status: document.querySelector('input[name="status"]:checked')?.value || 'Aktif',
                    produkUnggulan: document.getElementById('produkUnggulan')?.checked || false,
                    berat: document.getElementById('berat')?.value || '',
                    panjang: document.getElementById('panjang')?.value || '',
                    lebar: document.getElementById('lebar')?.value || '',
                    tinggi: document.getElementById('tinggi')?.value || '',
                    catatan: document.getElementById('catatan')?.value || '',
                    images: uploadedImages.filter(img => img !== null) // Re-added images field
                };

                if (!productData.namaProduk || !productData.kodeProduk || !productData.hargaJual) {
                    alert('Nama Produk, Kode Produk, dan Harga Jual wajib diisi.');
                    if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                    else newSaveButton.disabled = false;
                    return;
                }

                const apiFunction = isEditMode ? 'updateProduk' : 'simpanProdukBaru';
                
                const successCallback = response => {
                    if (window.showToast) window.showToast(response.message, response.status);
                    else alert(response.message);

                    if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                    else newSaveButton.disabled = false;
                    
                    if (response.status === 'success') {
                        if (!isEditMode && form) form.reset();
                        // Clear image previews and data array
                        for (let i = 0; i < 5; i++) {
                            removeImage(i); 
                        }
                    }
                };

                const errorCallback = error => {
                    if (window.showToast) window.showToast(`Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} produk: ` + error.message, 'error');
                    else alert(`Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} produk: ` + error.message);
                    
                    if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                    else newSaveButton.disabled = false;
                };

                window.sendDataToGoogle(apiFunction, productData, successCallback, errorCallback);
            });
        } else {
            console.error("Tombol Simpan (saveProductBtn) tidak ditemukan saat inisialisasi.");
        }
    };

    // --- Main Logic Flow ---
    setupLivePreview();
    setupFormSubmission();

    if (isEditMode) {
        // Fetch product data for editing
        if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle('getProdukById', { productId }, (response) => {
                if (response.status === 'success' && response.data) {
                    populateForm(response.data);
                } else {
                    console.error('Failed to fetch product for editing:', response.message);
                    if(window.showToast) window.showToast('Gagal memuat data produk: ' + response.message, 'error');
                }
                // Clear the ID after attempting to load
                localStorage.removeItem('selectedProductId');
            }, (error) => {
                console.error('Error fetching product by ID:', error);
                if(window.showToast) window.showToast('Error koneksi saat memuat produk.', 'error');
                localStorage.removeItem('selectedProductId');
            });
        }
    } else {
        // It's a new product, just make sure previews are cleared
        updateSidebarPreview();
    }
};
