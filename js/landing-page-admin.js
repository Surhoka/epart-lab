/**
 * js/landing-page-admin.js
 * Frontend logic for managing Landing Page products in the Admin panel.
 */
(function() {
    const register = () => {
        if (window.Alpine && !window.Alpine.data('landingPageAdmin')) {
            window.Alpine.data('landingPageAdmin', () => ({
                products: [],
                loading: false,
                modalOpen: false,
                editMode: false,
                submitting: false,
                formData: {
                    id: '',
                    title: '',
                    subtitle: '',
                    description: '',
                    imageUrl: '',
                    price: 0,
                    originalPrice: 0,
                    category: '',
                    featured: false,
                    active: true,
                    sortOrder: 0
                },

                async init() {
                    console.log("Landing Page Admin Component Init");
                    await this.fetchProducts();
                },

                async fetchProducts() {
                    this.loading = true;
                    return new Promise((resolve) => {
                        // sendDataToGoogle is defined globally in Admin-Ezyparts.xml
                        window.sendDataToGoogle('getLandingProducts', {}, (res) => {
                            if (res && res.status === 'success') {
                                this.products = res.data || [];
                                console.log(`Loaded ${this.products.length} landing products`);
                            } else {
                                const msg = res ? res.message : 'Unknown error';
                                console.error('Failed to load products:', msg);
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification('Gagal memuat produk: ' + msg, 'error');
                                }
                            }
                            this.loading = false;
                            resolve();
                        }, (err) => {
                            console.error('Fetch products error:', err);
                            if (window.app && window.app.showNotification) {
                                window.app.showNotification('Error koneksi saat memuat produk', 'error');
                            }
                            this.loading = false;
                            resolve();
                        });
                    });
                },

                openAddModal() {
                    this.editMode = false;
                    this.formData = {
                        id: '',
                        title: '',
                        subtitle: '',
                        description: '',
                        imageUrl: '',
                        price: 0,
                        originalPrice: 0,
                        category: '',
                        featured: false,
                        active: true,
                        sortOrder: this.products.length + 1
                    };
                    this.modalOpen = true;
                },

                editProduct(product) {
                    this.editMode = true;
                    // Clone to avoid direct mutation
                    this.formData = JSON.parse(JSON.stringify(product));
                    this.modalOpen = true;
                },

                async saveProduct() {
                    if (!this.formData.title) {
                        alert('Judul produk harus diisi');
                        return;
                    }

                    this.submitting = true;
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('saveLandingProduct', this.formData, (res) => {
                            if (res && res.status === 'success') {
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification(this.editMode ? 'Produk diperbarui' : 'Produk ditambahkan', 'success');
                                }
                                this.modalOpen = false;
                                this.fetchProducts();
                            } else {
                                const msg = res ? res.message : 'Unknown error';
                                alert('Gagal menyimpan: ' + msg);
                            }
                            this.submitting = false;
                            resolve();
                        }, (err) => {
                            console.error('Save product error:', err);
                            alert('Terjadi kesalahan saat menyimpan produk.');
                            this.submitting = false;
                            resolve();
                        });
                    });
                },

                async deleteProduct(id) {
                    if (!confirm('Anda yakin ingin menghapus produk ini?')) return;
                    
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('deleteLandingProduct', { id: id }, (res) => {
                            if (res && res.status === 'success') {
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification('Produk berhasil dihapus', 'success');
                                }
                                this.fetchProducts();
                            } else {
                                const msg = res ? res.message : 'Unknown error';
                                alert('Gagal menghapus: ' + msg);
                            }
                            resolve();
                        }, (err) => {
                            console.error('Delete product error:', err);
                            alert('Terjadi kesalahan saat menghapus produk.');
                            resolve();
                        });
                    });
                },

                async toggleActive(product) {
                    const newStatus = !product.active;
                    const originalStatus = product.active;
                    
                    // Optimistic update
                    product.active = newStatus;

                    return new Promise((resolve) => {
                        window.sendDataToGoogle('saveLandingProduct', { ...product, active: newStatus }, (res) => {
                            if (res && res.status === 'success') {
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification(`Produk ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
                                }
                            } else {
                                // Revert on failure
                                product.active = originalStatus;
                                const msg = res ? res.message : 'Unknown error';
                                if (window.app && window.app.showNotification) {
                                    window.app.showNotification('Gagal update status: ' + msg, 'error');
                                }
                            }
                            resolve();
                        }, (err) => {
                            product.active = originalStatus;
                            console.error('Toggle active error:', err);
                            resolve();
                        });
                    });
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
