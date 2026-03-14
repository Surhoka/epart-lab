/**
 * js/home-admin.js
 * Frontend logic for Public Content Manager (Hero Slides, Categories, Featured Products, Landing Config)
 */
(function () {
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(msg, type);
        else setTimeout(() => window.showToast?.(msg, type), 500);
    }

    function getDbId() {
        try {
            return JSON.parse(localStorage.getItem('EzypartsConfig') || '{}').sheetId || null;
        } catch (e) { return null; }
    }

    // ================================================================
    // HERO SLIDES MANAGER
    // ================================================================
    const registerHeroManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('heroManager')) {
            window.Alpine.data('heroManager', () => ({
                dbId: null,
                slides: [],
                isLoading: false,
                isUploading: false,
                showModal: false,
                isEditing: false,
                editingItem: {},

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID tidak ditemukan.', 'error');
                    await this.fetchSlides();
                },

                async fetchSlides() {
                    this.isLoading = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getHeroSlides', { dbId: this.dbId }, resolve, reject);
                        });
                        this.slides = res.status === 'success' ? (res.data || []) : [];
                        if (res.status !== 'success') showToast(res.message || 'Gagal memuat data', 'error');
                    } catch (e) {
                        console.error('fetchSlides:', e);
                        showToast('Gagal memuat hero slides', 'error');
                    } finally {
                        this.isLoading = false;
                    }
                },

                openAddModal() {
                    this.isEditing = false;
                    this.editingItem = { title: '', subtitle: '', imageurl: '', buttontext: '', buttonlink: '', active: true, sortorder: 0 };
                    this.showModal = true;
                },

                editSlide(item) {
                    this.isEditing = true;
                    this.editingItem = { ...item };
                    this.showModal = true;
                },

                async saveSlide() {
                    if (!this.editingItem.title) { showToast('Judul slide harus diisi', 'warning'); return; }
                    const btn = document.getElementById('save-hero-btn');
                    window.setButtonLoading?.(btn, true);
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveHeroSlide', { ...this.editingItem, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') {
                            showToast('Slide berhasil disimpan');
                            this.showModal = false;
                            await this.fetchSlides();
                        } else {
                            showToast(res.message || 'Gagal menyimpan', 'error');
                        }
                    } catch (e) {
                        showToast('Terjadi kesalahan: ' + e, 'error');
                    } finally {
                        window.setButtonLoading?.(btn, false);
                    }
                },

                async deleteSlide(id) {
                    if (!confirm('Hapus slide ini?')) return;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('deleteHeroSlide', { id, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') { showToast('Slide dihapus'); await this.fetchSlides(); }
                        else showToast(res.message || 'Gagal menghapus', 'error');
                    } catch (e) {
                        showToast('Gagal menghapus: ' + e, 'error');
                    }
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar', 'warning'); return; }
                    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran file maksimal 5MB', 'warning'); return; }
                    this.isUploading = true;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: `hero-${Date.now()}-${file.name}`,
                            fileData: e.target.result,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            this.isUploading = false;
                            if (res?.status === 'success') { this.editingItem.imageurl = res.url; showToast('Gambar berhasil diupload'); }
                            else showToast('Gagal upload: ' + (res?.message || ''), 'error');
                        }, () => { this.isUploading = false; showToast('Gagal upload gambar', 'error'); });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                }
            }));
        }
    };

    // ================================================================
    // CATEGORIES MANAGER
    // ================================================================
    const registerCategoryManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('categoryManager')) {
            window.Alpine.data('categoryManager', () => ({
                dbId: null,
                categories: [],
                isLoading: false,
                isUploading: false,
                showModal: false,
                isEditing: false,
                editingItem: {},

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID tidak ditemukan.', 'error');
                    await this.fetchCategories();
                },

                async fetchCategories() {
                    this.isLoading = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getCategories', { dbId: this.dbId }, resolve, reject);
                        });
                        this.categories = res.status === 'success' ? (res.data || []) : [];
                        if (res.status !== 'success') showToast(res.message || 'Gagal memuat data', 'error');
                    } catch (e) {
                        console.error('fetchCategories:', e);
                        showToast('Gagal memuat kategori', 'error');
                    } finally {
                        this.isLoading = false;
                    }
                },

                openAddModal() {
                    this.isEditing = false;
                    this.editingItem = { name: '', slug: '', description: '', imageurl: '', parentid: '', active: true, sortorder: 0 };
                    this.showModal = true;
                },

                editCategory(item) {
                    this.isEditing = true;
                    this.editingItem = { ...item };
                    this.showModal = true;
                },

                async saveCategory() {
                    if (!this.editingItem.name) { showToast('Nama kategori harus diisi', 'warning'); return; }
                    const btn = document.getElementById('save-category-btn');
                    window.setButtonLoading?.(btn, true);
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveCategory', { ...this.editingItem, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') {
                            showToast('Kategori berhasil disimpan');
                            this.showModal = false;
                            await this.fetchCategories();
                        } else {
                            showToast(res.message || 'Gagal menyimpan', 'error');
                        }
                    } catch (e) {
                        showToast('Terjadi kesalahan: ' + e, 'error');
                    } finally {
                        window.setButtonLoading?.(btn, false);
                    }
                },

                async deleteCategory(id) {
                    if (!confirm('Hapus kategori ini?')) return;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('deleteCategory', { id, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') { showToast('Kategori dihapus'); await this.fetchCategories(); }
                        else showToast(res.message || 'Gagal menghapus', 'error');
                    } catch (e) {
                        showToast('Gagal menghapus: ' + e, 'error');
                    }
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar', 'warning'); return; }
                    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran file maksimal 5MB', 'warning'); return; }
                    this.isUploading = true;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: `category-${Date.now()}-${file.name}`,
                            fileData: e.target.result,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            this.isUploading = false;
                            if (res?.status === 'success') { this.editingItem.imageurl = res.url; showToast('Gambar berhasil diupload'); }
                            else showToast('Gagal upload: ' + (res?.message || ''), 'error');
                        }, () => { this.isUploading = false; showToast('Gagal upload gambar', 'error'); });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                }
            }));
        }
    };

    // ================================================================
    // FEATURED PRODUCTS MANAGER
    // ================================================================
    const registerFeaturedProductManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('featuredProductManager')) {
            window.Alpine.data('featuredProductManager', () => ({
                dbId: null,
                products: [],
                isLoading: false,
                isUploading: false,
                showModal: false,
                isEditing: false,
                editingItem: {},

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID tidak ditemukan.', 'error');
                    await this.fetchProducts();
                },

                async fetchProducts() {
                    this.isLoading = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getFeaturedProducts', { dbId: this.dbId }, resolve, reject);
                        });
                        this.products = res.status === 'success' ? (res.data || []) : [];
                        if (res.status !== 'success') showToast(res.message || 'Gagal memuat data', 'error');
                    } catch (e) {
                        console.error('fetchProducts:', e);
                        showToast('Gagal memuat produk', 'error');
                    } finally {
                        this.isLoading = false;
                    }
                },

                openAddModal() {
                    this.isEditing = false;
                    this.editingItem = { name: '', description: '', imageurl: '', price: 0, originalprice: 0, category: '', badge: '', link: '', active: true, sortorder: 0 };
                    this.showModal = true;
                },

                editProduct(item) {
                    this.isEditing = true;
                    this.editingItem = { ...item };
                    this.showModal = true;
                },

                async saveProduct() {
                    if (!this.editingItem.name) { showToast('Nama produk harus diisi', 'warning'); return; }
                    const btn = document.getElementById('save-product-btn');
                    window.setButtonLoading?.(btn, true);
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveFeaturedProduct', { ...this.editingItem, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') {
                            showToast('Produk berhasil disimpan');
                            this.showModal = false;
                            await this.fetchProducts();
                        } else {
                            showToast(res.message || 'Gagal menyimpan', 'error');
                        }
                    } catch (e) {
                        showToast('Terjadi kesalahan: ' + e, 'error');
                    } finally {
                        window.setButtonLoading?.(btn, false);
                    }
                },

                async deleteProduct(id) {
                    if (!confirm('Hapus produk ini?')) return;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('deleteFeaturedProduct', { id, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') { showToast('Produk dihapus'); await this.fetchProducts(); }
                        else showToast(res.message || 'Gagal menghapus', 'error');
                    } catch (e) {
                        showToast('Gagal menghapus: ' + e, 'error');
                    }
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar', 'warning'); return; }
                    if (file.size > 5 * 1024 * 1024) { showToast('Ukuran file maksimal 5MB', 'warning'); return; }
                    this.isUploading = true;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: `product-${Date.now()}-${file.name}`,
                            fileData: e.target.result,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            this.isUploading = false;
                            if (res?.status === 'success') { this.editingItem.imageurl = res.url; showToast('Gambar berhasil diupload'); }
                            else showToast('Gagal upload: ' + (res?.message || ''), 'error');
                        }, () => { this.isUploading = false; showToast('Gagal upload gambar', 'error'); });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                },

                formatPrice(price) {
                    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);
                }
            }));
        }
    };

    // ================================================================
    // LANDING CONFIG MANAGER
    // ================================================================
    const registerLandingConfigManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('landingConfigManager')) {
            window.Alpine.data('landingConfigManager', () => ({
                dbId: null,
                formData: {
                    sitename: '', tagline: '', logourl: '',
                    heroenabled: true, categoriesenabled: true, featuredenabled: true,
                    marqueetext: '', marqueeactive: true
                },
                isLoading: false,
                isUploading: false,
                submitting: false,

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID tidak ditemukan.', 'error');
                    await this.fetchConfig();
                },

                async fetchConfig() {
                    this.isLoading = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getLandingConfig', { dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success' && res.data) {
                            this.formData = { ...this.formData, ...res.data };
                        }
                    } catch (e) {
                        console.error('fetchConfig:', e);
                        showToast('Gagal memuat konfigurasi', 'error');
                    } finally {
                        this.isLoading = false;
                    }
                },

                async saveConfig() {
                    this.submitting = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveLandingConfig', { ...this.formData, dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') showToast('Konfigurasi berhasil disimpan');
                        else showToast(res.message || 'Gagal menyimpan', 'error');
                    } catch (e) {
                        showToast('Terjadi kesalahan: ' + e, 'error');
                    } finally {
                        this.submitting = false;
                    }
                },

                handleLogoUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { showToast('File harus berupa gambar', 'warning'); return; }
                    this.isUploading = true;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: `logo-${Date.now()}-${file.name}`,
                            fileData: e.target.result,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            this.isUploading = false;
                            if (res?.status === 'success') { this.formData.logourl = res.url; showToast('Logo berhasil diupload'); }
                            else showToast('Gagal upload: ' + (res?.message || ''), 'error');
                        }, () => { this.isUploading = false; showToast('Gagal upload logo', 'error'); });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                }
            }));
        }
    };

    // Register all components
    const registerAll = () => {
        registerHeroManager();
        registerCategoryManager();
        registerFeaturedProductManager();
        registerLandingConfigManager();
    };

    if (window.Alpine) registerAll();
    else document.addEventListener('alpine:init', registerAll);
})();
