/**
 * public-js/product.js
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
        slug: null,
        
        async init() {
            this.loading = true;
            this.error = false;
            
            // Extract slug from URL hash, params or Blogger path
            this.slug = this.getSlugFromUrl();
            
            if (this.slug) {
                await this.fetchProductDetail();
            } else {
                this.loading = false;
                this.showError('Oops!', 'ID produk tidak ditemukan di URL.');
            }
        },

        getSlugFromUrl() {
            // Priority 1: Global currentParams (set by SPA router)
            if (window.currentParams?.slug) return window.currentParams.slug;
            if (window.app?.params?.slug) return window.app.params.slug;
            
            // Priority 2: Extract from direct URL (Blogger Native /p/slug.html)
            const path = window.location.pathname;
            if (path.includes('/p/')) {
                const parts = path.split('/');
                const fileName = parts[parts.length - 1];
                return fileName.replace('.html', '');
            }
            
            // Priority 3: Extract from Hash (for SPA direct navigation)
            const hash = window.location.hash || '';
            if (hash.includes('slug=')) {
                const match = hash.match(/slug=([^&]+)/);
                return match ? match[1] : null;
            }
            
            return null;
        },
        
        async fetchProductDetail() {
            this.loading = true;
            try {
                // Call the specialized getProductDetail endpoint
                const params = { slug: this.slug };
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getProductDetail', params, resolve, reject);
                });
                
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
                this.showError('Kesalahan Sistem', 'Gagal memuat data produk.');
            } finally {
                this.loading = false;
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
            const storePhone = window.EZY_SITE_CONFIG?.whatsapp || window.app?.publicPhone || '628123456789';
            const cleanPhone = storePhone.replace(/\D/g, '');
            const message = `Halo Admin, saya tertarik dengan produk: ${this.product.name}\n\nLink: ${window.location.href}`;
            window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        },
        
        addToCart(sourceEl) {
            if (this.product && this.product.id) {
                if (window.Alpine && Alpine.store('cart')) {
                    Alpine.store('cart').add(this.product);
                    
                    // Trigger Fly Animation if source element is provided
                    if (sourceEl && window.flyToCart) {
                        window.flyToCart(sourceEl, this.product.imageurl);
                    }
                } else {
                    if (typeof window.showToast === 'function') window.showToast('Gagal menambahkan ke keranjang', 'error');
                }
            }
        }
    };
};
