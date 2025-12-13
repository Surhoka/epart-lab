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

    // Initialize Breadcrumb  
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Tambah Produk');
    }

    const form = document.getElementById('addNewProductForm');
    
    // --- Live Preview Logic ---
    const updatePreview = (inputId, previewId, prefix = '', suffix = '') => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (input && preview) {
            // To prevent duplicate listeners, we can remove any old one, but cloning the node is safer.
            input.replaceWith(input.cloneNode(true));
            document.getElementById(inputId).addEventListener('input', function () {
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
         hargaModalInput.replaceWith(hargaModalInput.cloneNode(true));
         document.getElementById('hargaModal').addEventListener('input', function () {
            previewHargaModal.textContent = 'Rp ' + formatCurrency(this.value);
        });
    }

    if (hargaJualInput && previewHargaJual) {
        hargaJualInput.replaceWith(hargaJualInput.cloneNode(true));
        document.getElementById('hargaJual').addEventListener('input', function () {
            previewHargaJual.textContent = 'Rp ' + formatCurrency(this.value);
        });
    }

    const kategoriSelect = document.getElementById('kategoriProduk');
    const previewKategori = document.getElementById('previewKategori');
    if (kategoriSelect && previewKategori) {
        kategoriSelect.replaceWith(kategoriSelect.cloneNode(true));
        document.getElementById('kategoriProduk').addEventListener('change', function () {
            previewKategori.textContent = this.value || '-';
        });
    }

    const statusRadios = document.querySelectorAll('input[name="status"]');
    const previewStatus = document.getElementById('previewStatus');
    if (statusRadios.length > 0 && previewStatus) {
        statusRadios.forEach(radio => {
            radio.replaceWith(radio.cloneNode(true));
        });
        document.querySelectorAll('input[name="status"]').forEach(radio => {
             radio.addEventListener('change', function () {
                if (this.checked && this.value === 'Aktif') {
                    previewStatus.textContent = 'Aktif';
                    previewStatus.className = 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400';
                } else if (this.checked) {
                    previewStatus.textContent = 'Tidak Aktif';
                    previewStatus.className = 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400';
                }
            });
        })
    }

    // --- Form Submission Handler ---
    const saveButton = document.getElementById('saveProductBtn');
    if (saveButton) {
        // By cloning and replacing, we ensure no old listeners are attached from previous page loads.
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
                namaProduk: document.getElementById('namaProduk').value,
                kodeProduk: document.getElementById('kodeProduk').value,
                deskripsi: document.getElementById('deskripsi').value,
                kategoriProduk: document.getElementById('kategoriProduk').value,
                subKategori: document.getElementById('subKategori').value,
                hargaModal: document.getElementById('hargaModal').value,
                hargaJual: document.getElementById('hargaJual').value,
                stokMinimal: document.getElementById('stokMinimal').value,
                satuan: document.getElementById('satuan').value,
                status: document.querySelector('input[name="status"]:checked') ? document.querySelector('input[name="status"]:checked').value : 'Aktif',
                produkUnggulan: document.getElementById('produkUnggulan').checked,
                berat: document.getElementById('berat').value,
                panjang: document.getElementById('panjang').value,
                lebar: document.getElementById('lebar').value,
                tinggi: document.getElementById('tinggi').value,
                catatan: document.getElementById('catatan').value,
                images: uploadedImages.filter(img => img !== null)
            };
            
            if (!productData.namaProduk || !productData.kodeProduk || !productData.hargaJual) {
                alert('Nama Produk, Kode Produk, dan Harga Jual wajib diisi.');
                if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                else newSaveButton.disabled = false;
                return;
            }

            const successCallback = response => {
                if (window.showToast) window.showToast(response.message, response.status);
                else alert(response.message);

                if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                else newSaveButton.disabled = false;
                
                if (response.status === 'success') {
                    if (form) form.reset();
                    // Clear image previews and data array
                    for (let i = 0; i < 5; i++) {
                        removeImage(i); 
                    }
                }
            };

            const errorCallback = error => {
                if (window.showToast) window.showToast('Gagal menyimpan produk: ' + error.message, 'error');
                else alert('Gagal menyimpan produk: ' + error.message);
                
                if (window.resetButtonState) window.resetButtonState(newSaveButton, originalButtonHTML);
                else newSaveButton.disabled = false;
            };

            window.sendDataToGoogle('simpanProduk', productData, successCallback, errorCallback);
        });
    } else {
        console.error("Tombol Simpan (saveProductBtn) tidak ditemukan saat inisialisasi.");
    }
};
