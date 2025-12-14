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
            hargaModalElement.value = product.hargaModal || '';
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

                const resetSaveButtonState = () => {
                    if (window.resetButtonState) {
                        window.resetButtonState(newSaveButton, originalButtonHTML);
                    } else {
                        newSaveButton.disabled = false;
                        newSaveButton.innerHTML = originalButtonHTML;
                    }
                };

                if (window.setButtonLoading) {
                    window.setButtonLoading(newSaveButton, 'Menyimpan...');
                } else {
                    newSaveButton.disabled = true;
                }

                const productData = getProductData(); // Get product data using our new function
                console.log('Data to be sent:', JSON.stringify(productData, null, 2));

                if (!productData.namaProduk || !productData.kodeProduk || !('hargaJual' in productData)) {
                    if (window.showToast) {
                        window.showToast('Nama Produk, Kode Produk, dan Harga Jual wajib diisi.', 'error');
                    } else {
                        alert('Nama Produk, Kode Produk, dan Harga Jual wajib diisi.');
                    }
                    resetSaveButtonState();
                    return;
                }

                const apiFunction = isEditMode ? 'updateProduk' : 'simpanProdukBaru';
                
                const successCallback = response => {
                    resetSaveButtonState();
                    if (window.showToast) window.showToast(response.message, response.status);
                    else alert(response.message);
                    
                    if (response.status === 'success') {
                        // Store the product data that was just saved for later access
                        window.lastSavedProductData = getProductData();
                    }
                };

                const errorCallback = error => {
                    resetSaveButtonState();
                    if (window.showToast) window.showToast(`Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} produk: ` + error.message, 'error');
                    else alert(`Gagal ${isEditMode ? 'mengupdate' : 'menyimpan'} produk: ` + error.message);
                };

                window.sendDataToGoogle(apiFunction, productData, successCallback, errorCallback);
            });
        } else {
            console.error("Tombol Simpan (saveProductBtn) tidak ditemukan saat inisialisasi.");
        }
    };

    // Function to return new product data
    window.getNewProductData = function() {
        return getProductData();
    };
    
    // Function to get product data from form (alias for getNewProductData)
    window.getProductDataFromForm = function() {
        return getProductData();
    };
    
    // Function to reset form and return new product data
    window.resetFormAndGetNewProductData = function() {
        const form = document.getElementById('addNewProductForm');
        if (form) form.reset();
        // Clear image previews and data array
        for (let i = 0; i < 5; i++) {
            removeImage(i); 
        }
        
        // Reset preview elements
        document.getElementById('previewNamaProduk').textContent = '-';
        document.getElementById('previewKodeProduk').textContent = '-';
        document.getElementById('previewHargaModal').textContent = 'Rp 0';
        document.getElementById('previewHargaJual').textContent = 'Rp 0';
        document.getElementById('previewKategori').textContent = '-';
        const previewStatus = document.getElementById('previewStatus');
        if (previewStatus) {
            previewStatus.textContent = 'Aktif';
            previewStatus.className = 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400';
        }
        
        // Reset radio buttons
        const statusRadios = document.querySelectorAll('input[name="status"]');
        if (statusRadios.length > 0) {
            statusRadios[0].checked = true; // Select first radio (Aktif)
        }
        
        // Reset checkbox
        const produkUnggulanElement = document.getElementById('produkUnggulan');
        if (produkUnggulanElement) {
            produkUnggulanElement.checked = false;
        }
        
        // Return new product data (empty)
        return getProductData();
    };
    
    // Additional function to get product data after saving
    window.getLastSavedProductData = function() {
        // This function will be used to get data that was just saved
        // We store it during the save process
        return getProductData();
    };

    // Function to get product data from form
    function getProductData() {
        const getNumericValue = (id) => {
            const value = document.getElementById(id)?.value;
            if (value === null || value === undefined || value.trim() === '') return null;
            const num = Number(value);
            return isNaN(num) ? null : num;
        };

        const productData = {
            id: isEditMode ? productId : null,
            namaProduk: document.getElementById('namaProduk')?.value || '',
            kodeProduk: document.getElementById('kodeProduk')?.value || '',
            deskripsi: document.getElementById('deskripsi')?.value || '',
            kategoriProduk: document.getElementById('kategoriProduk')?.value || '',
            subKategori: document.getElementById('subKategori')?.value || '',
            stok: getNumericValue('stok'),
            hargaModal: getNumericValue('hargaModal'), // Match updateProduk expectation
            hargaJual: getNumericValue('hargaJual'),  // Match updateProduk expectation
            satuan: document.getElementById('satuan')?.value || '',
            status: document.querySelector('input[name="status"]:checked')?.value || 'Aktif',
            produkUnggulan: document.getElementById('produkUnggulan')?.checked || false,
            berat: getNumericValue('berat'),
            panjang: getNumericValue('panjang'),
            lebar: getNumericValue('lebar'),
            tinggi: getNumericValue('tinggi'),
            stokMinimal: getNumericValue('stokMinimal'), // Match updateProduk expectation
            catatan: document.getElementById('catatan')?.value || ''
        };

        const newImages = uploadedImages.filter(img => img && img.startsWith('data:image'));
        if (newImages.length > 0) {
            productData.images = newImages;
        }

        // Remove null or empty string value properties for cleaner data
        Object.keys(productData).forEach(key => {
            if (productData[key] === null || productData[key] === '') {
                delete productData[key];
            }
        });

        return productData;
    };

    // Setup reset form button functionality
    const resetButton = document.getElementById('resetFormBtn');
    if (resetButton) {
        const newResetButton = resetButton.cloneNode(true);
        resetButton.parentNode.replaceChild(newResetButton, resetButton);
        
        newResetButton.addEventListener('click', function() {
            if (form) form.reset();
            // Clear image previews and data array
            for (let i = 0; i < 5; i++) {
                removeImage(i); 
            }
            
            // Reset preview elements
            document.getElementById('previewNamaProduk').textContent = '-';
            document.getElementById('previewKodeProduk').textContent = '-';
            document.getElementById('previewHargaModal').textContent = 'Rp 0';
            document.getElementById('previewHargaJual').textContent = 'Rp 0';
            document.getElementById('previewKategori').textContent = '-';
            const previewStatus = document.getElementById('previewStatus');
            if (previewStatus) {
                previewStatus.textContent = 'Aktif';
                previewStatus.className = 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400';
            }
            
            // Reset radio buttons
            const statusRadios = document.querySelectorAll('input[name="status"]');
            if (statusRadios.length > 0) {
                statusRadios[0].checked = true; // Select first radio (Aktif)
            }
            
            // Reset checkbox
            const produkUnggulanElement = document.getElementById('produkUnggulan');
            if (produkUnggulanElement) {
                produkUnggulanElement.checked = false;
            }
            
            // Show alert to user
            if (window.showToast) {
                window.showToast('Form telah direset untuk produk baru', 'info');
            } else {
                alert('Form telah direset untuk produk baru');
            }
        });
    }

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

