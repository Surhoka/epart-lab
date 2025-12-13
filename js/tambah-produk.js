// Tambah Produk page initialization
window.initTambahProdukPage = function () {
    console.log("Tambah Produk Page Initialized");

    // Initialize Breadcrumb  
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Tambah Produk');
    }
};

// Store uploaded images
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

            imageSlot.classList.add('hidden');
            imagePreview.src = e.target.result;
            imagePreview.classList.remove('hidden');
            removeBtn.classList.remove('hidden');
            removeBtn.classList.add('flex');

            // Update sidebar preview with first image
            updateSidebarPreview();
        };
        reader.readAsDataURL(file);
    }
}

// Remove image from slot
function removeImage(index) {
    uploadedImages[index] = null;

    const imageSlot = document.getElementById(`imageSlot${index}`);
    const imagePreview = document.getElementById(`imagePreview${index}`);
    const removeBtn = document.getElementById(`removeBtn${index}`);
    const fileInput = document.getElementById(`gambarProduk${index + 1}`);

    imageSlot.classList.remove('hidden');
    imagePreview.src = '';
    imagePreview.classList.add('hidden');
    removeBtn.classList.add('hidden');
    removeBtn.classList.remove('flex');
    fileInput.value = '';

    // Update sidebar preview
    updateSidebarPreview();
}

// Update sidebar preview with the main image (slot 0)
function updateSidebarPreview() {
    const sidebarImagePreview = document.getElementById('sidebarImagePreview');
    const previewImage = document.getElementById('previewImage');
    const placeholderDiv = sidebarImagePreview.querySelector('div');

    // Use the first image (main image) for the preview
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

// Initialize live preview functionality
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('addNewProductForm');

    // Live preview updates
    const updatePreview = (inputId, previewId, prefix = '', suffix = '') => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (input && preview) {
            input.addEventListener('input', function () {
                const value = this.value || '-';
                preview.textContent = prefix + (value === '-' ? value : this.value) + suffix;
            });
        }
    };

    // Format number with thousand separator
    const formatCurrency = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    // Update previews
    updatePreview('namaProduk', 'previewNamaProduk');
    updatePreview('kodeProduk', 'previewKodeProduk');


    // Currency fields with formatting
    const hargaModalInput = document.getElementById('hargaModal');
    const hargaJualInput = document.getElementById('hargaJual');
    const previewHargaModal = document.getElementById('previewHargaModal');
    const previewHargaJual = document.getElementById('previewHargaJual');

    if (hargaModalInput && previewHargaModal) {
        hargaModalInput.addEventListener('input', function () {
            const value = this.value ? formatCurrency(this.value) : '0';
            previewHargaModal.textContent = 'Rp ' + value;
        });
    }

    if (hargaJualInput && previewHargaJual) {
        hargaJualInput.addEventListener('input', function () {
            const value = this.value ? formatCurrency(this.value) : '0';
            previewHargaJual.textContent = 'Rp ' + value;
        });
    }

    // Category preview
    const kategoriSelect = document.getElementById('kategoriProduk');
    const previewKategori = document.getElementById('previewKategori');
    if (kategoriSelect && previewKategori) {
        kategoriSelect.addEventListener('change', function () {
            previewKategori.textContent = this.value || '-';
        });
    }

    // Status preview
    const statusRadios = document.querySelectorAll('input[name="status"]');
    const previewStatus = document.getElementById('previewStatus');
    if (statusRadios.length > 0 && previewStatus) {
        statusRadios.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'Aktif') {
                    previewStatus.textContent = 'Aktif';
                    previewStatus.className = 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400';
                } else {
                    previewStatus.textContent = 'Tidak Aktif';
                    previewStatus.className = 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400';
                }
            });
        });
    }

    // Form submission handler
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonHTML = submitButton.innerHTML;

            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menyimpan...`;

            // Gather form data explicitly
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
            
            // Basic validation
            if (!productData.namaProduk || !productData.kodeProduk || !productData.hargaJual) {
                alert('Nama Produk, Kode Produk, dan Harga Jual wajib diisi.');
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
                return;
            }

            console.log("Sending data to Google Apps Script:", productData);

            // Call Google Apps Script function
            google.script.run
                .withSuccessHandler(response => {
                    console.log('Success:', response);
                    alert(response.message);
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonHTML;
                    
                    if(response.status === 'success') {
                        form.reset();
                        // Clear image previews and data
                        for (let i = 0; i < 5; i++) {
                            removeImage(i);
                        }
                        // Redirect to product list page after a short delay
                        setTimeout(() => {
                           // Assuming you have a produk.html page to list products
                           // window.location.href = 'produk.html'; 
                        }, 1500);
                    }
                })
                .withFailureHandler(error => {
                    console.error('Failure:', error);
                    alert('Gagal menyimpan produk: ' + error.message);
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonHTML;
                })
                .simpanProdukBaru(productData);
        });
    }
});
