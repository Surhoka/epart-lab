// Produk page initialization
window.initTambahProdukPage = function () {
    console.log("Tambah Produk Page Initialized");

    // Initialize Breadcrumb  
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Tambah Produk');
    }
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

// Update sidebar preview with first available image
function updateSidebarPreview() {
    const sidebarImagePreview = document.getElementById('sidebarImagePreview');
    const previewImage = document.getElementById('previewImage');
    const placeholderDiv = sidebarImagePreview.querySelector('div');

    // Find first uploaded image
    const firstImage = uploadedImages.find(img => img !== null);

    if (firstImage) {
        previewImage.src = firstImage;
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
    updatePreview('stokAwal', 'previewStokAwal');

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
});

