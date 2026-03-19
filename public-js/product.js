/**
 * Product Detail Page Logic for Public EzyParts
 * Fetches and displays a single product by slug or ID
 */
window.initProductPage = function () {
    return {
        // State
        loading: true,
        error: false,
        errorTitle: '',
        errorMessage: '',
        product: {},
        
        init() {
            // Get slug from global router params (set by decodeState in public-1.html)
            // We use a small delay to ensure currentParams is fully populated if needed
            const params = window.currentParams || {};
            const slug = params.slug || params.id;
            
            if (!slug) {
                this.showError('Oops!', 'ID produk tidak valid.');
                return;
            }
            
            this.fetchProduct(slug);
        },
        
        async fetchProduct(slug) {
            this.loading = true;
            this.error = false;
            
            try {
                // Call the specialized getProductDetail endpoint
                console.log('[ProductDebug] Fetching product with slug:', slug);
                const params = { slug: slug };
                console.log('[ProductDebug] Request Params:', params);
                
                const response = await window.AdminAPI.get('getProductDetail', params);
                console.log('[ProductDebug] API Response:', response);
                
                if (response.status === 'success' && response.data) {
                    this.product = response.data;
                    this.loading = false;
                    
                    // Update Page Title and Breadcrumb
                    if (this.product.name) {
                        document.title = `${this.product.name} | ${window.app?.blogTitle || 'EzyStore'}`;
                    }
                    
                    if (window.renderBreadcrumb) {
                        window.renderBreadcrumb([
                            { label: 'Beranda', action: "window.navigate('home')" },
                            { label: 'Produk', action: "window.navigate('shop')" },
                            { label: this.product.name }
                        ]);
                    }
                } else {
                    this.showError('Produk Tidak Ada', response.message || 'Data produk tidak ditemukan di database.');
                }
            } catch (e) {
                console.error('Error fetching product:', e);
                this.showError('Kesalahan Sistem', 'Gagal memuat data produk. Periksa koneksi Anda.');
            }
        },
        
        showError(title, msg) {
            this.error = true;
            this.loading = false;
            this.errorTitle = title;
            this.errorMessage = msg;
        },
        
        formatCurrency(val) {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(val);
        },
        
        contactWhatsApp() {
            // Priority: 1. Store phone from branding, 2. Global constant, 3. Placeholder
            const storePhone = window.app?.publicPhone || '628123456789';
            
            // Clean phone number (remove +, spaces, etc)
            const cleanPhone = storePhone.replace(/\D/g, '');
            
            const message = `Halo Admin, saya tertarik dengan produk: ${this.product.name}\n\nLink: ${window.location.href}`;
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        },
        
        addToCart() {
            // Logic for future expansion
            if (window.app && typeof window.app.showNotification === 'function') {
                window.app.showNotification('Fitur keranjang segera hadir!', 'info');
            } else {
                alert('Fitur keranjang segera hadir!');
            }
        }
    };
};
