/**
 * js/landing-page-admin.js
 * Frontend logic for managing Landing Page products in the Admin panel.
 */
(function() {
    const register = () => {
        if (window.Alpine && !window.Alpine.data('landingPageAdmin')) {
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
                    sortOrder: 0
                },
                loading: false,
                submitting: false,
                isUploading: false,
                dbId: null,

                async init() {
                    console.log("Sales Page Admin Component Init");
                    
                    // Get dbId from localStorage
                    try {
                        const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                        this.dbId = config.sheetId;
                        if (!this.dbId) {
                            console.error('Database ID (sheetId) not found in EzypartsConfig.');
                        }
                    } catch (e) {
                        console.error('Failed to parse EzypartsConfig:', e);
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
                        }, (err) => {
                            this.loading = false;
                            resolve();
                        });
                    });
                },

                async saveProduct() {
                    if (!this.formData.title) {
                        alert('Judul produk harus diisi');
                        return;
                    }

                    this.submitting = true;
                    return new Promise((resolve) => {
                        const payload = { ...this.formData, dbId: this.dbId };
                        window.sendDataToGoogle('saveLandingProduct', payload, (res) => {
                            if (res && res.status === 'success') {
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification('Konfigurasi Sales Page berhasil disimpan', 'success');
                                }
                            } else {
                                const msg = res ? res.message : 'Unknown error';
                                alert('Gagal menyimpan: ' + msg);
                            }
                            this.submitting = false;
                            resolve();
                        }, (err) => {
                            console.error('Save product error:', err);
                            alert('Terjadi kesalahan saat menyimpan.');
                            this.submitting = false;
                            resolve();
                        });
                    });
                },

                handleImageUpload(event) {
                    const file = event.target.files[0];
                    if (!file) return;

                    if (!file.type.startsWith('image/')) {
                        alert('File harus berupa gambar');
                        return;
                    }

                    const maxSize = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSize) {
                        alert('Ukuran file maksimal 5MB');
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
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification('Gambar berhasil diupload', 'success');
                                }
                            } else {
                                alert('Gagal upload gambar: ' + (res ? res.message : 'Unknown error'));
                            }
                        }, (err) => {
                            this.isUploading = false;
                            console.error('Upload error:', err);
                            alert('Terjadi kesalahan saat upload gambar');
                        });
                    };

                    reader.onerror = () => {
                        this.isUploading = false;
                        alert('Gagal membaca file');
                    };

                    reader.readAsDataURL(file);
                }
            }));
        }
    };

    if (window.Alpine) {
        register();
    } else {
        document.addEventListener('alpine:init', register);
    }
})();
