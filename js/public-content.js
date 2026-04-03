/**
 * js/public-content.js
 * Unified frontend logic for Public Content Manager & Landing Page Admin.
 * Combines Hero Slides, Categories, Featured Products, Landing Config, and Sales Page logic.
 */
(function() {
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
            return config.sheetId || null;
        } catch (e) {
            console.error('Failed to parse EzypartsConfig:', e);
            return null;
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
    // CATEGORIES MANAGER (from home-admin.js)
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
    // FEATURED PRODUCTS MANAGER (from home-admin.js)
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
                                    id: p.ID || p.id,
                                    title: p.Title || p.title,
                                    slug: p.Slug || p.slug,
                                    content: p.Content || p.content,
                                    status: p.Status || p.status,
                                    category: p.Category || p.category,
                                    tags: p.Tags || p.tags,
                                    image: p.Image || p.image,
                                    location: p.Location || p.location,
                                    publishDate: p.PublishDate || p.publishDate,
                                    commentOption: p.CommentOption || p.commentOption,
                                    permalinkMode: p.PermalinkMode || p.permalinkMode,
                                    date: this.formatDate(p.DateCreated || p.dateCreated),
                                    lastModified: p.LastModified || p.lastModified,
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
                            mimeType: file.type,
                            dbId: getDbId()
                        }, (res) => {
                            if (res.status === 'success') {
                                this.insertImageAtCursor(res.url);
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
                    const imgHtml = `<img src="${url}" class="max-w-full h-auto rounded-lg my-4" alt="Image" />`;
                    document.execCommand('insertHTML', false, imgHtml);
                },

                async saveDraft() {
                    this.post.status = 'Draft';
                    await this.savePost();
                },

                async publishPost() {
                    if (!this.post.title) { showToast("Please enter a title before publishing", "warning"); return; }
                    this.post.status = 'Published';
                    await this.savePost();
                },

                async savePost() {
                    const editorBody = document.getElementById('classic-editor-body');
                    if (editorBody) this.post.content = editorBody.innerHTML;
                    if (!this.post.id) this.post.dateCreated = new Date().toISOString();
                    showToast("Saving post...", "info");

                    const payload = { ...this.post, dbId: getDbId() };
                    // Get blogId from admin core if available for sync
                    const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                    if (config.blogId) payload.blogId = config.blogId;

                    if (Array.isArray(payload.category)) payload.category = payload.category.join(',');

                    window.sendDataToGoogle('save_post', payload, (res) => {
                        if (res.status === 'success') {
                            showToast("Post saved successfully!", "success");
                            if (res.id && !this.post.id) this.post.id = res.id;
                            this.fetchPosts();
                            this.activeTab = 'list';
                        } else {
                            showToast("Error saving: " + res.message, "error");
                        }
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
    // PUBLIC POST PAGE MANAGER (for storefront)
    // ================================================================
    const registerPublicPostPage = () => {
        if (window.Alpine?.data && !window.Alpine.data('initPostPage')) {
            window.Alpine.data('initPostPage', () => ({
                post: null,
                isLoading: true,
                slug: null,
                featuredImage: null,

                async init() {
                    this.isLoading = true;
                    // Extract slug from URL hash or path
                    this.slug = this.getSlugFromUrl();
                    if (this.slug) {
                        await this.fetchPost();
                    } else {
                        this.isLoading = false;
                        console.error('No slug found in URL');
                    }
                },

                getSlugFromUrl() {
                    // Try to get from window.app.params (if set by navigate)
                    if (window.app?.params?.slug) return window.app.params.slug;
                    
                    // Fallback to URL parsing (for direct hits on /p/ or #post)
                    const hash = window.location.hash || '';
                    if (hash.includes('slug=')) {
                        const match = hash.match(/slug=([^&]+)/);
                        return match ? match[1] : null;
                    }
                    
                    // For Blogger Native pages /p/slug.html
                    const path = window.location.pathname;
                    if (path.includes('/p/')) {
                        const parts = path.split('/');
                        const fileName = parts[parts.length - 1];
                        return fileName.replace('.html', '');
                    }

                    return null;
                },

                async fetchPost() {
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('get_post_by_slug', { slug: this.slug }, resolve, reject);
                        });

                        if (res.status === 'success' && res.data) {
                            this.post = res.data;
                            this.extractFeaturedImage();
                        } else {
                            console.error('Post not found:', res.message);
                        }
                    } catch (e) {
                        console.error('fetchPost error:', e);
                    } finally {
                        this.isLoading = false;
                    }
                },

                extractFeaturedImage() {
                    if (!this.post || !this.post.content) return;
                    // Simple regex to find first <img> tag src
                    const match = this.post.content.match(/<img[^>]+src="([^">]+)"/);
                    if (match) {
                        this.featuredImage = match[1];
                    }
                },

                formatDate(dateStr) {
                    if (!dateStr) return '';
                    try {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                    } catch (e) {
                        return dateStr;
                    }
                },

                share(platform) {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(this.post.title);
                    let shareUrl = '';

                    switch (platform) {
                        case 'facebook':
                            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                            break;
                        case 'twitter':
                            shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                            break;
                        case 'whatsapp':
                            shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
                            break;
                    }

                    if (shareUrl) {
                        window.open(shareUrl, '_blank', 'width=600,height=400');
                    }
                },

                copyLink() {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        if (typeof window.showToast === 'function') {
                            window.showToast('Link berhasil disalin ke clipboard');
                        }
                    });
                }
            }));
        }
    };

    // ================================================================
    // PUBLIC PRODUCT PAGE MANAGER (for storefront)
    // ================================================================
    const registerPublicProductPage = () => {
        if (window.Alpine?.data && !window.Alpine.data('initProductPage')) {
            window.Alpine.data('initProductPage', () => ({
                product: {},
                loading: true,
                error: false,
                slug: null,

                async init() {
                    this.loading = true;
                    this.slug = this.getSlugFromUrl();
                    if (this.slug) {
                        await this.fetchProductDetail();
                    } else {
                        this.loading = false;
                        this.error = true;
                    }
                },

                getSlugFromUrl() {
                    // Try to get from window.app.params (if set by navigate)
                    if (window.app?.params?.slug) return window.app.params.slug;
                    
                    // Fallback to URL parsing (for direct hits on /p/ or #product)
                    const hash = window.location.hash || '';
                    if (hash.includes('slug=')) {
                        const match = hash.match(/slug=([^&]+)/);
                        return match ? match[1] : null;
                    }
                    
                    // For Blogger Native pages /p/slug.html
                    const path = window.location.pathname;
                    if (path.includes('/p/')) {
                        const parts = path.split('/');
                        const fileName = parts[parts.length - 1];
                        return fileName.replace('.html', '');
                    }
                    return null;
                },

                async fetchProductDetail() {
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getProductDetail', { slug: this.slug }, resolve, reject);
                        });

                        if (res.status === 'success' && res.data) {
                            this.product = res.data;
                            this.loading = false;
                        } else {
                            this.error = true;
                            this.loading = false;
                        }
                    } catch (e) {
                        console.error('fetchProductDetail error:', e);
                        this.error = true;
                        this.loading = false;
                    }
                },

                formatCurrency(value) {
                    if (!value) return 'Rp 0';
                    return new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(value);
                },

                contactWhatsApp() {
                    const text = `Halo, saya tertarik dengan produk *${this.product.name}* (ID: ${this.product.id || this.slug}). Mohon info selengkapnya. \n\nLink: ${window.location.href}`;
                    const waUrl = `https://wa.me/${window.EZY_SITE_CONFIG?.whatsapp || ''}?text=${encodeURIComponent(text)}`;
                    window.open(waUrl, '_blank');
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
        registerPublicPostPage();
        registerPublicProductPage();
    };

    if (window.Alpine) {
        registerAll();
    } else {
        document.addEventListener('alpine:init', registerAll);
    }
})();
