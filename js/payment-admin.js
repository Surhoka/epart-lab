/**
 * js/payment-gateway.js
 * Frontend logic for Payment Gateway Plugin.
 * Handles Manual Bank Transfer and Midtrans configuration.
 */
(function() {
    // Shared Toast Utility
    function showToast(msg, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(msg, type);
        } else {
            setTimeout(() => {
                if (typeof window.showToast === 'function') window.showToast(msg, type);
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

    const registerPaymentAdmin = () => {
        if (window.Alpine?.data && !window.Alpine.data('paymentAdmin')) {
            window.Alpine.data('paymentAdmin', () => ({
                dbId: null,
                isLoading: false,
                manualConfig: {
                    id: '',
                    type: 'manual',
                    label: 'Manual Bank Transfer',
                    bankName: '',
                    accountNumber: '',
                    accountHolder: '',
                    active: false
                },
                midtransConfig: {
                    id: '',
                    type: 'midtrans',
                    label: 'Midtrans Gateway',
                    clientKey: '',
                    serverKey: '',
                    isProduction: false,
                    active: false
                },

                async init() {
                    this.dbId = getDbId();
                    if (!this.dbId) showToast('Database ID (Sheet ID) tidak ditemukan.', 'error');
                    await this.fetchConfig();
                },

                async fetchConfig() {
                    this.isLoading = true;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('getPaymentConfig', { dbId: this.dbId }, resolve, reject);
                        });
                        
                        if (res.status === 'success' && res.data) {
                            const configs = res.data;
                            const manual = configs.find(c => c.type === 'manual');
                            const midtrans = configs.find(c => c.type === 'midtrans');

                            if (manual) {
                                this.manualConfig = {
                                    ...this.manualConfig,
                                    id: manual.id,
                                    bankName: manual.bankname || '',
                                    accountNumber: manual.accountnumber || '',
                                    accountHolder: manual.accountholder || '',
                                    active: manual.active === true || manual.active === 'true' || manual.active === 'TRUE'
                                };
                            }

                            if (midtrans) {
                                this.midtransConfig = {
                                    ...this.midtransConfig,
                                    id: midtrans.id,
                                    clientKey: midtrans.clientkey || '',
                                    serverKey: midtrans.serverkey || '',
                                    isProduction: midtrans.isproduction === true || midtrans.isproduction === 'true' || midtrans.isproduction === 'TRUE',
                                    active: midtrans.active === true || midtrans.active === 'true' || midtrans.active === 'TRUE'
                                };
                            }
                        } else if (res.status !== 'success') {
                            showToast(res.message || 'Gagal memuat konfigurasi', 'error');
                        }
                    } catch (e) {
                        console.error('fetchConfig:', e);
                        showToast('Terjadi kesalahan saat memuat data', 'error');
                    } finally {
                        this.isLoading = false;
                    }
                },

                async saveMethod(type) {
                    const data = type === 'manual' ? this.manualConfig : this.midtransConfig;
                    try {
                        const res = await new Promise((resolve, reject) => {
                            window.sendDataToGoogle('savePaymentConfig', { ...data, dbId: this.dbId }, resolve, reject);
                        });

                        if (res.status === 'success') {
                            showToast(`${data.label} berhasil disimpan`);
                            if (!data.id && res.data?.id) data.id = res.data.id;
                        } else {
                            showToast(res.message || 'Gagal menyimpan', 'error');
                        }
                    } catch (e) {
                        console.error('saveMethod:', e);
                        showToast('Gagal menyimpan konfigurasi', 'error');
                    }
                }
            }));
        }
    };

    if (window.Alpine) {
        registerPaymentAdmin();
    } else {
        document.addEventListener('alpine:init', registerPaymentAdmin);
    }
})();
