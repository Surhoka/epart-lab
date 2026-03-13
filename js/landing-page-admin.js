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

                async init() {
                    console.log("Sales Page Admin Component Init");
                    await this.fetchData();
                },

                async fetchData() {
                    this.loading = true;
                    return new Promise((resolve) => {
                        window.sendDataToGoogle('getLandingProducts', {}, (res) => {
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
                        window.sendDataToGoogle('saveLandingProduct', this.formData, (res) => {
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
