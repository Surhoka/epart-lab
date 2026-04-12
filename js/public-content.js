/**
 * js/public-content.js
 * Unified frontend logic for Public Content Manager & Landing Page Admin.
 * Combines Hero Slides, Categories, Featured Products, Landing Config, and Sales Page logic.
 */
(function () {
    // Shared Toast Utility
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            // Retry once if window.showToast is not yet available
            setTimeout(() => {
                if (typeof window.showToast === 'function') {
                    window.showToast(msg, type);
                }
            }, 500);
        }
    }

    // Shared DB ID Utility
    function getDbId() {
        try {
            const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
            return config.sheetId || config.dbId || null;
        } catch (e) {
            console.error('Failed to parse EzypartsConfig:', e);
            return null;
        }
    }

    // Shared Blog ID Utility
    function getBlogId() {
        try {
            const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
            const blogId = config.blogId;
            // Pastikan tidak mengirim string "null" ke backend
            if (blogId === null || blogId === 'null' || blogId === undefined || blogId === '') {
                return '';
            }
            return String(blogId);
        } catch (e) {
            return '';
        }
    }

    // ================================================================
    // HERO SLIDES MANAGER (from home-admin.js)
    // ================================================================
    const registerHeroManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('heroManager')) {
            window.Alpine.data('heroManager', () => ({
                dbId: null,
                slides: [],
                isLoading: false,
                isSyncing: false,
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
                        const payload = {
                            ...this.editingItem,
                            dbId: this.dbId,
                            blogId: getBlogId()
                        };
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveHeroSlide', payload, resolve, reject);
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
                            const payload = {
                                id,
                                dbId: this.dbId,
                                blogId: getBlogId()
                            };
                            window.sendDataToGoogle('deleteHeroSlide', payload, resolve, reject);
                        });
                        if (res.status === 'success') { showToast('Slide dihapus'); await this.fetchSlides(); }
                        else showToast(res.message || 'Gagal menghapus', 'error');
                    } catch (e) {
                        showToast('Gagal menghapus: ' + e, 'error');
                    }
                },

                async syncToBlogger() {
                    this.isSyncing = true;
                    showToast('Menyinkronkan data beranda...', 'info');
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('syncHomeFullToBlogger', { dbId: this.dbId, blogId: getBlogId() }, resolve, reject);
                        });
                        if (res.status === 'success') showToast(res.message);
                        else showToast(res.message, 'error');
                    } catch (e) {
                        showToast('Gagal sinkron: ' + e, 'error');
                    } finally {
                        this.isSyncing = false;
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
    // CATEGORIES MANAGER (from home-admin.js)
    // ================================================================
    const registerCategoryManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('categoryManager')) {
            window.Alpine.data('categoryManager', () => ({
                dbId: null,
                categories: [],
                isLoading: false,
                isSyncing: false,
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
                        const payload = {
                            ...this.editingItem,
                            dbId: this.dbId,
                            blogId: getBlogId()
                        };
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveCategory', payload, resolve, reject);
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
                            const payload = {
                                id,
                                dbId: this.dbId,
                                blogId: getBlogId()
                            };
                            window.sendDataToGoogle('deleteCategory', payload, resolve, reject);
                        });
                        if (res.status === 'success') { showToast('Kategori dihapus'); await this.fetchCategories(); }
                        else showToast(res.message || 'Gagal menghapus', 'error');
                    } catch (e) {
                        showToast('Gagal menghapus: ' + e, 'error');
                    }
                },

                async syncToBlogger() {
                    this.isSyncing = true;
                    showToast('Menyinkronkan kategori...', 'info');
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('syncHomeFullToBlogger', { dbId: this.dbId, blogId: getBlogId() }, resolve, reject);
                        });
                        if (res.status === 'success') showToast(res.message);
                        else showToast(res.message, 'error');
                    } catch (e) {
                        showToast('Gagal sinkron: ' + e, 'error');
                    } finally {
                        this.isSyncing = false;
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
    // FEATURED PRODUCTS MANAGER (from home-admin.js)
    // ================================================================
    const registerFeaturedProductManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('featuredProductManager')) {
            window.Alpine.data('featuredProductManager', () => ({
                dbId: null,
                products: [],
                categories: [],
                isLoading: false,
                isSyncing: false,
                isUploading: false,
                showModal: false,
                isEditing: false,
                editingItem: {},

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID tidak ditemukan.', 'error');
                    await Promise.all([
                        this.fetchProducts(),
                        this.fetchCategories()
                    ]);
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

                async fetchCategories() {
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getCategories', { dbId: this.dbId }, resolve, reject);
                        });
                        if (res.status === 'success') {
                            this.categories = res.data || [];
                        }
                    } catch (e) {
                        console.error('fetchCategories in product manager:', e);
                    }
                },

                async syncAllToBlogger() {
                    const activeCount = this.products.filter(p => p.active === true || p.active === 'TRUE').length;
                    if (activeCount === 0) {
                        showToast('Tidak ada produk aktif yang perlu disinkronkan.', 'warning');
                        return;
                    }

                    if (!confirm(`Apakah Anda yakin ingin menyinkronkan ${activeCount} produk ke Blogger?`)) {
                        return;
                    }

                    this.isSyncing = true;
                    showToast('Sedang menyinkronkan seluruh produk...', 'info');

                    try {
                        const payload = {
                            dbId: this.dbId,
                            blogId: getBlogId()
                        };
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('syncAllProductsToBlogger', payload, resolve, reject);
                        });

                        if (res.status === 'success') {
                            showToast(res.message, 'success');
                        } else {
                            showToast(res.message || 'Gagal melakukan sinkronisasi massal', 'error');
                        }
                    } catch (e) {
                        console.error('syncAllProductsToBlogger error:', e);
                        showToast('Terjadi kesalahan koneksi saat sinkronisasi.', 'error');
                    } finally {
                        this.isSyncing = false;
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
                        const payload = {
                            ...this.editingItem,
                            dbId: this.dbId,
                            blogId: getBlogId()
                        };
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('saveFeaturedProduct', payload, resolve, reject);
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
    // LANDING CONFIG MANAGER (from home-admin.js)
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
                    // Config ‘LandingPage’ has been removed from backend.
                    // Now managed via template or Branding features.
                    this.isLoading = false;
                },

                async saveConfig() {
                    showToast('Konfigurasi ini sudah tidak digunakan. Gunakan menu Branding.', 'warning');
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

    // ================================================================
    // LANDING PAGE ADMIN (from landing-page-admin.js)
    // ================================================================
    const registerLandingPageAdmin = () => {
        if (window.Alpine?.data && !window.Alpine.data('landingPageAdmin')) {
            window.Alpine.data('landingPageAdmin', () => ({
                formData: {
                    id: 'master_sales_page',
                    title: '',
                    subtitle: '',
                    description: '',
                    imageUrl: '',
                    price: 0,
                    originalPrice: 0,
                    category: '',
                    featured: true,
                    active: true,
                    sortOrder: 0,
                    marqueeText: '',
                    marqueeActive: true
                },
                loading: false,
                submitting: false,
                isUploading: false,
                dbId: null,

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) {
                        console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    }
                    await this.fetchData();
                },

                async fetchData() {
                    this.loading = true;
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('getLandingProducts', { dbId: this.dbId }, (res) => {
                            if (res && res.status === 'success') {
                                const master = (res.data || []).find(p => p.id === 'master_sales_page');
                                if (master) {
                                    this.formData = { ...master };
                                }
                            }
                            this.loading = false;
                            resolve();
                        }, () => {
                            this.loading = false;
                            resolve();
                        });
                    });
                },

                async saveProduct() {
                    if (!this.formData.title) {
                        showToast('Judul produk harus diisi', 'warning');
                        return;
                    }

                    this.submitting = true;
                    return new Promise((resolve) => {
                        const payload = { ...this.formData, dbId: this.dbId };
                        window.sendDataToGoogle('saveLandingProduct', payload, (res) => {
                            if (res && res.status === 'success') {
                                showToast('Konfigurasi Sales Page berhasil disimpan', 'success');
                            } else {
                                const msg = res ? res.message : 'Unknown error';
                                showToast('Gagal menyimpan: ' + msg, 'error');
                            }
                            this.submitting = false;
                            resolve();
                        }, (err) => {
                            console.error('Save product error:', err);
                            showToast('Terjadi kesalahan saat menyimpan.', 'error');
                            this.submitting = false;
                            resolve();
                        });
                    });
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;

                    if (!file.type.startsWith('image/')) {
                        showToast('File harus berupa gambar', 'warning');
                        return;
                    }

                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                        showToast('Ukuran file maksimal 5MB', 'warning');
                        return;
                    }

                    this.isUploading = true;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64Data = e.target.result;
                        const fileName = `landing-${Date.now()}-${file.name}`;

                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: fileName,
                            fileData: base64Data,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            this.isUploading = false;
                            if (res && res.status === 'success') {
                                this.formData.imageUrl = res.url;
                                showToast('Gambar berhasil diupload', 'success');
                            } else {
                                showToast('Gagal upload gambar: ' + (res ? res.message : 'Unknown error'), 'error');
                            }
                        }, (err) => {
                            this.isUploading = false;
                            console.error('Upload error:', err);
                            showToast('Terjadi kesalahan saat upload gambar', 'error');
                        });
                    };

                    reader.onerror = () => {
                        this.isUploading = false;
                        showToast('Gagal membaca file', 'error');
                    };

                    reader.readAsDataURL(file);
                }
            }));
        }
    };

    // ================================================================
    // POST EDITOR MANAGER
    // ================================================================
    const registerPostEditor = () => {
        if (window.Alpine?.data && !window.Alpine.data('postEditor')) {
            window.Alpine.data('postEditor', () => ({
                activeTab: 'list', // 'list' or 'editor'
                savedRange: null,
                accordion: { date: false },
                defaultPost: {
                    id: null,
                    title: '',
                    slug: '',
                    content: '',
                    status: 'Draft',
                    category: [],
                    tags: '',
                    image: '',
                    location: '',
                    commentOption: 'allow',
                    dateMode: 'auto',
                    publishDate: '',
                    permalinkMode: 'auto'
                },
                post: {},
                posts: [],
                isLoading: false,
                isSyncing: false,
                currentPage: 1,
                itemsPerPage: 10,

                get totalPages() {
                    return Math.ceil(this.posts.length / this.itemsPerPage) || 1;
                },

                get paginatedPosts() {
                    const start = (this.currentPage - 1) * this.itemsPerPage;
                    const end = start + this.itemsPerPage;
                    return this.posts.slice(start, end);
                },
                publicBlogUrl: window.app?.publicBlogUrl || '',
                siteKey: window.app?.siteKey || '',
                categories: [],
                formattingTools: [
                    { icon: 'bold', cmd: 'bold', label: 'Bold' },
                    { icon: 'italic', cmd: 'italic', label: 'Italic' },
                    { icon: 'underline', cmd: 'underline', label: 'Underline' },
                    { icon: 'strikethrough', cmd: 'strikethrough', label: 'Strikethrough' },
                    { icon: 'eraser', cmd: 'removeFormat', label: 'Clear Formatting' },
                    { icon: 'list-bullet', cmd: 'insertUnorderedList', label: 'Bullet List' },
                    { icon: 'list-number', cmd: 'insertOrderedList', label: 'Numbered List' },
                    { icon: 'outdent', cmd: 'outdent', label: 'Decrease Indent' },
                    { icon: 'indent', cmd: 'indent', label: 'Increase Indent' },
                    { icon: 'quote', cmd: 'formatBlock:blockquote', label: 'Quote' },
                    { icon: 'code', cmd: 'formatBlock:pre', label: 'Code Block' },
                    { icon: 'minus', cmd: 'insertHorizontalRule', label: 'Horizontal Line' }
                ],

                async init() {
                    console.log('[POST.JS] Komponen postEditor diinisialisasi.');
                    this.post = JSON.parse(JSON.stringify(this.defaultPost));
                    this.$watch('post.title', value => {
                        if (value && this.post.permalinkMode === 'auto') {
                            this.post.slug = value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
                        } else if (!value && this.post.permalinkMode === 'auto') {
                            this.post.slug = '';
                        }
                    });
                    this.$nextTick(() => {
                        const editor = document.getElementById('classic-editor-body');
                        if (editor) {
                            // Mengaktifkan handle resize bawaan (terutama untuk Firefox)
                            try { document.execCommand("enableObjectResizers", false, "true"); } catch (e) { }

                            editor.addEventListener('click', (e) => {
                                if (e.target.tagName === 'IMG') {
                                    this.editImageInContent(e.target);
                                }
                            });
                        }
                    });
                    this.$watch('post.dateMode', (val) => {
                        if (val === 'custom') {
                            this.$nextTick(() => this.initDatePicker());
                        } else {
                            this.destroyDatePicker();
                        }
                    });
                    await this.fetchPosts();
                },

                get selectedPostIds() {
                    return this.posts.filter(p => p.selected).map(p => p.id);
                },

                selectAll(event) {
                    const checked = event.target.checked;
                    this.posts.forEach(p => p.selected = checked);
                },

                formatDate(dateString) {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                },

                addCategory(name = null) {
                    if (!name) name = prompt("Nama Label Baru:");
                    if (name && name.trim()) {
                        if (!this.categories.includes(name)) {
                            this.categories.push(name);
                            this.categories.sort();
                        }
                        if (!this.post.category.includes(name)) {
                            this.post.category.push(name);
                        }
                    }
                },

                async fetchPosts() {
                    this.isLoading = true;
                    // Note: Use getDbId() for multi-tenant support if needed, but the original used direct sendDataToGoogle
                    window.sendDataToGoogle('get_posts', { dbId: getDbId() }, (res) => {
                        this.isLoading = false;
                        if (res.status === 'success') {
                            const allCategories = new Set();
                            this.posts = (res.data || []).map(p => {
                                const postData = {
                                    id: p.id,
                                    title: p.title,
                                    slug: p.slug,
                                    content: p.content,
                                    status: p.status,
                                    category: p.category,
                                    tags: p.tags,
                                    image: p.image,
                                    location: p.location,
                                    publishDate: p.publishdate,
                                    commentOption: p.commentoption,
                                    permalinkMode: p.permalinkmode,
                                    date: this.formatDate(p.datecreated),
                                    lastModified: p.lastmodified,
                                    selected: false
                                };
                                if (Array.isArray(postData.category)) {
                                    postData.category.forEach(cat => allCategories.add(cat));
                                } else if (typeof postData.category === 'string') {
                                    postData.category.split(',').forEach(cat => allCategories.add(cat.trim()));
                                }
                                return postData;
                            });
                            this.categories = Array.from(allCategories).sort();
                            this.currentPage = 1;
                        } else {
                            showToast('Gagal memuat post: ' + res.message, 'error');
                        }
                    }, (err) => {
                        showToast('Error API saat memuat post.', 'error');
                        this.isLoading = false;
                    });
                },

                async syncAllToBlogger() {
                    const publishedCount = this.posts.filter(p => p.status === 'Published').length;
                    if (publishedCount === 0) {
                        showToast('Tidak ada postingan Published yang perlu disinkronkan.', 'warning');
                        return;
                    }

                    if (!confirm(`Apakah Anda yakin ingin menyinkronkan ${publishedCount} postingan ke Blogger? Ini akan memperbarui seluruh metadata artikel Anda.`)) {
                        return;
                    }

                    this.isSyncing = true;
                    showToast('Sedang menyinkronkan seluruh postingan...', 'info');

                    try {
                        const payload = {
                            dbId: getDbId(),
                            blogId: getBlogId()
                        };
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('syncAllToBlogger', payload, resolve, reject);
                        });

                        if (res.status === 'success') {
                            showToast(res.message, 'success');
                        } else {
                            showToast(res.message || 'Gagal melakukan sinkronisasi massal', 'error');
                        }
                    } catch (e) {
                        console.error('syncAllToBlogger error:', e);
                        showToast('Terjadi kesalahan koneksi saat sinkronisasi.', 'error');
                    } finally {
                        this.isSyncing = false;
                    }
                },

                execCommand(command, value = null) {
                    if (command.startsWith('formatBlock:')) {
                        const tag = command.split(':')[1];
                        document.execCommand('formatBlock', false, tag);
                    } else {
                        document.execCommand(command, false, value);
                    }
                    document.getElementById('classic-editor-body').focus();
                },

                insertLink() {
                    this.saveSelection();
                    const url = prompt("Enter URL:");
                    if (url) {
                        this.restoreSelection();
                        document.execCommand('createLink', false, url);
                    }
                },

                triggerImageUpload() {
                    this.saveSelection();
                    // Need to find the ref in the actual DOM if using this component
                    const input = document.querySelector('input[x-ref="imageInput"]');
                    if (input) input.click();
                },

                saveSelection() {
                    const sel = window.getSelection();
                    if (sel.getRangeAt && sel.rangeCount) {
                        this.savedRange = sel.getRangeAt(0);
                    }
                },

                restoreSelection() {
                    const editor = document.getElementById('classic-editor-body');
                    if (editor) {
                        editor.focus();
                        if (this.savedRange) {
                            const sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(this.savedRange);
                        }
                    }
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { showToast("Image too large (max 5MB)", "error"); return; }
                    showToast("Uploading image...", "info");
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: file.name,
                            fileData: e.target.result.split(',')[1],
                            fileType: file.type,
                            dbId: getDbId()
                        }, (res) => {
                            if (res.status === 'success') {
                                this.insertImageAtCursor(res.url);
                                // Set gambar utama otomatis jika masih kosong
                                if (!this.post.image) {
                                    this.post.image = res.url;
                                }
                                showToast("Image uploaded!", "success");
                            } else {
                                showToast("Upload failed: " + res.message, "error");
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                },

                insertImageAtCursor(url) {
                    this.restoreSelection();
                    // Menambahkan atribut draggable dan cursor pointer agar user tahu ini bisa berinteraksi
                    const imgHtml = `<img src="${url}" draggable="true" class="max-w-full h-auto rounded-lg my-4 cursor-pointer" alt="Image" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                },

                editImageInContent(imgElement) {
                    // Memberi tanda visual gambar sedang dipilih
                    imgElement.classList.add('selected-img');

                    const action = prompt(
                        "PENGATURAN GAMBAR\n" +
                        "--------------------------\n" +
                        "1. Ganti URL / Sumber Gambar\n" +
                        "2. Atur Lebar (contoh: 50% atau 300px)\n" +
                        "3. Hapus Gambar dari Konten\n\n" +
                        "Ketik nomor pilihan (1/2/3):", "1"
                    );

                    if (action === "1") {
                        const newUrl = prompt("Masukkan URL Gambar baru:", imgElement.src);
                        if (newUrl && newUrl.trim()) {
                            imgElement.src = newUrl;
                            showToast("URL gambar diperbarui", "success");
                        }
                    } else if (action === "2") {
                        const currentWidth = imgElement.style.width || "Auto";
                        const newWidth = prompt("Masukkan lebar baru (contoh: 50%, 100%, atau pixel):", currentWidth);
                        if (newWidth) {
                            imgElement.style.width = newWidth;
                            imgElement.style.height = "auto"; // Menjaga aspek rasio
                            showToast("Ukuran diperbarui", "success");
                        }
                    } else if (action === "3") {
                        if (confirm("Hapus gambar ini dari artikel?")) {
                            imgElement.remove();
                            showToast("Gambar dihapus", "info");
                        }
                    }

                    setTimeout(() => imgElement.classList.remove('selected-img'), 500);
                },

                async saveDraft() {
                    this.post.status = 'Draft';
                    await this.savePost();
                },

                async publishPost() {
                    if (!this.post.title) { showToast("Please enter a title before publishing", "warning"); return; }
                    this.post.status = 'Published';
                    await this.savePost('btn-publish-post');
                },

                async savePost(btnId = 'btn-save-draft') {
                    const btn = document.getElementById(btnId);
                    if (btn) window.setButtonLoading?.(btn, true);

                    const editorBody = document.getElementById('classic-editor-body');
                    if (editorBody) this.post.content = editorBody.innerHTML;
                    if (!this.post.id) this.post.dateCreated = new Date().toISOString();

                    const payload = { ...this.post, dbId: getDbId(), blogId: getBlogId() };

                    if (Array.isArray(payload.category)) payload.category = payload.category.join(',');

                    return new Promise((resolve) => {
                        window.sendDataToGoogle('save_post', payload, (res) => {
                            if (res.status === 'success') {
                                showToast("Postingan berhasil disimpan", "success");
                                if (res.id && !this.post.id) this.post.id = res.id;
                                this.fetchPosts();
                                this.cancelEditor();
                            } else {
                                showToast("Gagal menyimpan: " + res.message, "error");
                            }
                            if (btn) window.setButtonLoading?.(btn, false);
                            resolve();
                        }, () => { if (btn) window.setButtonLoading?.(btn, false); resolve(); });
                    });
                },

                async deletePost(id) {
                    if (!confirm("Are you sure you want to delete this post?")) return;
                    showToast("Deleting...", "info");
                    window.sendDataToGoogle('delete_post', { id: id, dbId: getDbId() }, (res) => {
                        if (res.status === 'success') { showToast("Post removed", "success"); this.fetchPosts(); }
                        else showToast("Delete failed", "error");
                    });
                },

                async bulkDelete() {
                    const ids = this.selectedPostIds;
                    if (ids.length === 0) return;
                    if (!confirm(`Are you sure you want to delete ${ids.length} selected posts?`)) return;
                    showToast(`Deleting ${ids.length} posts...`, "info");
                    const promises = ids.map(id => {
                        return new Promise(resolve => window.sendDataToGoogle('delete_post', { id, dbId: getDbId() }, resolve, resolve));
                    });
                    await Promise.all(promises);
                    showToast(`${ids.length} post(s) deleted!`, "success");
                    this.fetchPosts();
                },

                _switchToEditor(postData) {
                    this.post = postData;
                    this.activeTab = 'editor';
                    this.$nextTick(() => {
                        if (this.post.dateMode === 'custom') this.initDatePicker();
                        else this.destroyDatePicker();
                    });
                    setTimeout(() => {
                        const editorBody = document.getElementById('classic-editor-body');
                        if (editorBody) {
                            editorBody.innerHTML = this.post.content || '';
                            editorBody.focus();
                        }
                        window.scrollTo({ top: 0, behavior: 'instant' });
                    }, 50);
                },

                editPost(item) {
                    const categories = item.category || item.Category || [];
                    const normalizedPost = {
                        id: item.id || item.ID,
                        title: item.title || item.Title || '',
                        slug: item.slug || item.Slug || '',
                        content: item.content || item.Content || '',
                        status: item.status || item.Status || 'Draft',
                        category: Array.isArray(categories) ? [...categories] : String(categories).split(',').map(c => c.trim()).filter(Boolean),
                        tags: item.tags || item.Tags || '',
                        image: item.image || item.Image || '',
                        dateCreated: item.dateCreated || item.DateCreated,
                        location: item.location || item.Location || '',
                        commentOption: item.commentOption || item.CommentOption || 'allow',
                        dateMode: (item.publishDate || item.PublishDate) ? 'custom' : 'auto',
                        publishDate: item.publishDate || item.PublishDate || '',
                        permalinkMode: item.permalinkMode || item.PermalinkMode || 'auto'
                    };
                    this._switchToEditor(normalizedPost);
                },

                cancelEditor() {
                    this.activeTab = 'list';
                    this.post = JSON.parse(JSON.stringify(this.defaultPost));
                    setTimeout(() => {
                        const editorBody = document.getElementById('classic-editor-body');
                        if (editorBody) editorBody.innerHTML = '';
                    }, 50);
                },

                newPost() {
                    this._switchToEditor(JSON.parse(JSON.stringify(this.defaultPost)));
                },

                fpDate: null, fpTime: null,
                initDatePicker() {
                    if (this.fpDate) return;
                    this.$nextTick(() => {
                        const container = document.querySelector('[x-ref="calendarMount"]');
                        const timeInput = document.querySelector('[x-ref="timeInput"]');
                        if (!container || !timeInput) return;
                        const dateVal = this.post.publishDate ? new Date(this.post.publishDate) : new Date();
                        this.updateCompactHeader(dateVal);
                        try {
                            this.fpDate = flatpickr(container, {
                                inline: true, className: 'flatpickr-compact', dateFormat: 'Y-m-d', defaultDate: dateVal,
                                locale: {
                                    firstDayOfWeek: 1,
                                    months: {
                                        shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                                        longhand: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
                                    }
                                },
                                onChange: (selectedDates) => {
                                    this.updateTime(selectedDates[0], null);
                                    if (selectedDates[0]) this.updateCompactHeader(selectedDates[0]);
                                }
                            });
                            this.fpTime = flatpickr(timeInput, {
                                enableTime: true, noCalendar: true, dateFormat: 'H.i', time_24hr: true, defaultDate: dateVal,
                                onChange: (selectedDates) => this.updateTime(null, selectedDates[0])
                            });
                        } catch (e) { console.error(e); }
                    });
                },
                destroyDatePicker() {
                    if (this.fpDate) { this.fpDate.destroy(); this.fpDate = null; }
                    if (this.fpTime) { this.fpTime.destroy(); this.fpTime = null; }
                },
                updateTime(datePart, timePart) {
                    let current = this.post.publishDate ? new Date(this.post.publishDate) : new Date();
                    if (datePart) { current.setFullYear(datePart.getFullYear()); current.setMonth(datePart.getMonth()); current.setDate(datePart.getDate()); }
                    if (timePart) { current.setHours(timePart.getHours()); current.setMinutes(timePart.getMinutes()); }
                    this.post.publishDate = current.toISOString();
                },
                updateCompactHeader(date) {
                    const cy = document.querySelector('[x-ref="compactYear"]');
                    const csd = document.querySelector('[x-ref="compactSelectedDate"]');
                    if (cy && csd && date) {
                        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                        cy.textContent = date.getFullYear();
                        csd.textContent = `${dayNames[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
                    }
                    this.updateMonthLabel(date);
                },
                updateMonthLabel(date) {
                    const cml = document.querySelector('[x-ref="compactMonthLabel"]');
                    if (cml && date) {
                        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                        cml.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                    }
                },
                prevMonth() { if (this.fpDate) this.fpDate.changeMonth(-1); },
                nextMonth() { if (this.fpDate) this.fpDate.changeMonth(1); }
            }));
        }
    };

    // ================================================================
    // ABOUT ADMIN (Static Pages)
    // ================================================================
    const registerAboutAdmin = () => {
        if (window.Alpine?.data && !window.Alpine.data('aboutAdmin')) {
            window.Alpine.data('aboutAdmin', () => ({
                formData: {
                    id: 'about',
                    title: 'Tentang Kami',
                    slug: 'about',
                    payload: { content: '' }
                },
                loading: false,
                submitting: false,
                dbId: null,
                isUploadingHero: false,
                isUploadingVision: false,
                isSyncing: false,
                uploadType: '',

                async init() {
                    this.dbId = getDbId();
                    await this.fetchData();
                },

                async fetchData() {
                    this.loading = true;
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('getStaticPage', { dbId: this.dbId, slug: 'about' }, (res) => {
                            if (res && res.status === 'success' && res.data) {
                                this.formData = { ...res.data };
                                if (!this.formData.payload) this.formData.payload = {};

                                // Pastikan payload adalah objek
                                if (typeof this.formData.payload === 'string') {
                                    try { this.formData.payload = JSON.parse(this.formData.payload); } catch (e) { this.formData.payload = {}; }
                                }

                                // Inisialisasi struktur dinamis (kosong jika tidak ada data)
                                if (!this.formData.payload.hero_image) this.formData.payload.hero_image = '';
                                if (!this.formData.payload.vision_image) this.formData.payload.vision_image = '';
                                if (!this.formData.payload.stats) this.formData.payload.stats = [];
                                if (!this.formData.payload.values) this.formData.payload.values = [];
                            }
                            this.loading = false;
                            resolve();
                        }, () => {
                            this.loading = false;
                            resolve();
                        });
                    });
                },

                async savePage() {
                    this.submitting = true;
                    window.sendDataToGoogle('saveStaticPage', {
                        dbId: this.dbId,
                        blogId: getBlogId(),
                        ...this.formData
                    }, (res) => {
                        this.submitting = false;
                        if (res.status === 'success') {
                            showToast('Laman Tentang Kami berhasil disimpan');
                        } else {
                            showToast('Gagal menyimpan: ' + res.message, 'error');
                        }
                    }, () => {
                        this.submitting = false;
                        showToast('Error saat menyimpan laman', 'error');
                    });
                },

                async syncToBlogger() {
                    this.isSyncing = true;
                    showToast('Menyinkronkan laman ke Blogger...', 'info');
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('deployStandardPagesToBlogger', {
                                dbId: this.dbId,
                                blogId: getBlogId()
                            }, resolve, reject);
                        });
                        if (res.status === 'success') showToast(res.message);
                        else showToast(res.message, 'error');
                    } catch (e) {
                        showToast('Gagal sinkron: ' + e, 'error');
                    } finally {
                        this.isSyncing = false;
                    }
                },

                triggerImageUpload(type) {
                    this.uploadType = type;
                    this.$refs.imageInput.click();
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;

                    const isHero = this.uploadType === 'hero_image';
                    if (isHero) this.isUploadingHero = true;
                    else this.isUploadingVision = true;

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileName: `about-${this.uploadType}-${Date.now()}-${file.name}`,
                            fileData: e.target.result,
                            fileType: file.type,
                            dbId: this.dbId
                        }, (res) => {
                            if (isHero) this.isUploadingHero = false;
                            else this.isUploadingVision = false;

                            if (res?.status === 'success') {
                                this.formData.payload[this.uploadType] = res.url;
                                showToast('Gambar berhasil diunggah');
                            } else {
                                showToast('Gagal upload: ' + (res?.message || ''), 'error');
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                    event.target.value = '';
                },

                addStat() {
                    this.formData.payload.stats.push({ label: '', value: '' });
                },

                removeStat(index) {
                    this.formData.payload.stats.splice(index, 1);
                },

                addValue() {
                    this.formData.payload.values.push({ title: '', desc: '', icon: 'zap' });
                },

                removeValue(index) {
                    this.formData.payload.values.splice(index, 1);
                }
            }));
        }
    };

    // ================================================================
    // CONTACT ADMIN (Static Pages)
    // ================================================================
    const registerContactAdmin = () => {
        if (window.Alpine?.data && !window.Alpine.data('contactAdmin')) {
            window.Alpine.data('contactAdmin', () => ({
                formData: {
                    id: 'contact',
                    title: 'Hubungi Kami',
                    slug: 'contact',
                    payload: {
                        address: '', phone: '', email: '', mapsUrl: '',
                        instagram: '', facebook: '', marketplace: ''
                    }
                },
                loading: false,
                submitting: false,
                dbId: null,

                async init() {
                    this.dbId = getDbId();
                    await this.fetchData();
                },

                async fetchData() {
                    this.loading = true;
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('getStaticPage', { dbId: this.dbId, slug: 'contact' }, (res) => {
                            if (res && res.status === 'success' && res.data) {
                                this.formData = { ...res.data };
                                if (!this.formData.payload) this.formData.payload = {
                                    address: '', phone: '', email: '', mapsUrl: '',
                                    instagram: '', facebook: '', marketplace: ''
                                };
                            }
                            this.loading = false;
                            resolve();
                        }, () => {
                            this.loading = false;
                            resolve();
                        });
                    });
                },

                async savePage() {
                    this.submitting = true;
                    window.sendDataToGoogle('saveStaticPage', {
                        dbId: this.dbId,
                        blogId: getBlogId(),
                        ...this.formData
                    }, (res) => {
                        this.submitting = false;
                        if (res.status === 'success') {
                            showToast('Laman Kontak berhasil disimpan');
                        } else {
                            showToast('Gagal menyimpan: ' + res.message, 'error');
                        }
                    }, () => {
                        this.submitting = false;
                        showToast('Error saat menyimpan laman', 'error');
                    });
                }
            }));
        }
    };

    // ================================================================
    // SETUP MANAGER (Store Setup)
    // ================================================================
    const registerSetupManager = () => {
        if (window.Alpine?.data && !window.Alpine.data('setupManager')) {
            window.Alpine.data('setupManager', () => ({
                isSyncing: false,
                dbId: null,
                blogId: null,

                init() {
                    this.dbId = getDbId();
                    this.blogId = getBlogId();
                },

                async deployPages() {
                    this.blogId = getBlogId();

                    this.isSyncing = true;
                    window.sendDataToGoogle('deployStandardPagesToBlogger', {
                        dbId: this.dbId,
                        blogId: this.blogId
                    }, (res) => {
                        this.isSyncing = false;
                        if (res.status === 'success') {
                            showToast('Setup Laman Standar Berhasil!');
                        } else {
                            showToast('Gagal: ' + res.message, 'error');
                        }
                    }, () => {
                        this.isSyncing = false;
                        showToast('Terjadi kesalahan saat memproses setup.', 'error');
                    });
                }
            }));
        }
    };

    // ================================================================
    // INITIALIZATION
    // ================================================================
    const registerAll = () => {
        registerHeroManager();
        registerCategoryManager();
        registerFeaturedProductManager();
        registerLandingConfigManager();
        registerLandingPageAdmin();
        registerPostEditor();
        registerAboutAdmin();
        registerContactAdmin();
        registerSetupManager();
    };

    if (window.Alpine) {
        registerAll();
    } else {
        document.addEventListener('alpine:init', registerAll);
    }
})();
