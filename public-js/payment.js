/**
 * payment.js
 * Logic for checkout and payment process
 */

window.initPaymentPage = function() {
    return {
        isSubmitting: false,
        paymentMethods: [],
        form: {
            name: '',
            phone: '',
            address: '',
            paymentMethod: ''
        },
        
        async init() {
            console.log('📦 Initializing Payment Page...');
            await this.loadPaymentMethods();
            
            // Auto-select first method
            if (this.paymentMethods.length > 0) {
                this.form.paymentMethod = this.paymentMethods[0].id;
            }
        },
        
        async loadPaymentMethods() {
            try {
                // We use getFeaturedProducts as it now includes active payment methods
                const response = await window.AdminAPI.get('getPaymentMethods');
                if (response.status === 'success' && response.data) {
                    this.paymentMethods = response.data;
                }
            } catch (e) {
                console.error('Failed to load payment methods:', e);
            }
        },
        
        validateForm() {
            if (!this.form.name.trim()) return 'Nama lengkap wajib diisi.';
            if (!this.form.phone.trim()) return 'WhatsApp/No. Telp wajib diisi.';
            if (!this.form.address.trim()) return 'Alamat pengiriman wajib diisi.';
            if (!this.form.paymentMethod) return 'Pilih metode pembayaran.';
            if (Alpine.store('cart').items.length === 0) return 'Keranjang Anda kosong.';
            return null;
        },
        
        async submitOrder() {
            const error = this.validateForm();
            if (error) {
                if (window.showToast) window.showToast(error, 'error');
                else alert(error);
                return;
            }
            
            this.isSubmitting = true;
            
            try {
                const orderData = {
                    customer: this.form,
                    items: Alpine.store('cart').items,
                    total: Alpine.store('cart').total
                };
                
                const res = await window.AdminAPI.post('placeOrder', orderData);
                
                if (res.status === 'success') {
                    // Clear cart
                    Alpine.store('cart').clear();
                    
                    if (res.paymentType === 'midtrans' && res.token) {
                        // Handle Midtrans Snap
                        if (window.snap) {
                            window.snap.pay(res.token, {
                                onSuccess: (result) => { window.navigate('home'); },
                                onPending: (result) => { window.navigate('home'); },
                                onError: (result) => { alert('Pembayaran gagal'); },
                                onClose: () => { window.navigate('home'); }
                            });
                        } else {
                            window.location.href = res.redirectUrl || '#home';
                        }
                    } else {
                        // Manual Transfer or other
                        // For manual, typically show instructions or redirect to WhatsApp
                        if (res.whatsappUrl) {
                            window.open(res.whatsappUrl, '_blank');
                        }
                        
                        if (window.showToast) window.showToast('Pesanan berhasil dibuat!', 'success');
                        setTimeout(() => window.navigate('home'), 2000);
                    }
                } else {
                    throw new Error(res.message || 'Gagal membuat pesanan');
                }
            } catch (e) {
                console.error('Checkout error:', e);
                if (window.showToast) window.showToast(e.message, 'error');
                else alert('Gagal memproses pesanan: ' + e.message);
            } finally {
                this.isSubmitting = false;
            }
        },
        
        formatCurrency(num) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(num);
        }
    };
};
