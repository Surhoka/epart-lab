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

            console.log('🏁 [Product] Initializing for slug:', this.slug);

            if (this.slug) {
                // Beri jeda sedikit agar window.AdminAPI benar-benar siap (terutama saat Pjax)
                setTimeout(async () => {
                    await this.fetchProductDetail();
                }, 150);
            } else {
                this.loading = false;
                this.showError('Oops!', 'ID produk tidak ditemukan di URL.');
            }
        },

        getSlugFromUrl() {
            console.log('🔗 [Debug] Extracting slug from URL...', window.location.pathname);

            // Priority 1: Global currentParams (set by SPA router)
            if (window.currentParams?.slug) return window.currentParams.slug;
            if (window.app?.params?.slug) return window.app.params.slug;

            // Priority 2: Extract from direct URL (Blogger Native /p/slug.html)
            const path = window.location.pathname;
            if (path.includes('/p/')) {
                const parts = path.split('/');
                const fileName = parts[parts.length - 1];
                const slug = fileName.replace('.html', '');
                console.log('✅ [Debug] Slug extracted from Path:', slug);
                return slug;
            }

            // Priority 3: Extract from Hash (for SPA direct navigation)
            const hash = window.location.hash || '';
            if (hash.includes('slug=')) {
                const match = hash.match(/slug=([^&]+)/);
                const slug = match ? match[1] : null;
                console.log('✅ [Debug] Slug extracted from Hash:', slug);
                return slug;
            }

            console.warn('❌ [Debug] No slug found in URL');
            return null;
        },

        async fetchProductDetail() {
            this.loading = true;
            console.log('📦 [Debug] Fetching Product Detail via AdminAPI...', this.slug);
            try {
                // Menyamakan metode pemanggilan dengan Home Page (lebih stabil)
                if (!window.AdminAPI) {
                    throw new Error('AdminAPI is not defined');
                }

                // Refresh AdminAPI config to be extra sure
                if (!window.AdminAPI.baseUrl) {
                    window.AdminAPI.init();
                }

                const response = await window.AdminAPI.get('getProductDetail', { slug: this.slug });

                console.log('📥 [Debug] API Response Received:', response);

                if (response.status === 'success' && response.data) {
                    this.product = response.data;
                    this.loading = false;
                    this.error = false;

                    // Update Page Title
                    if (this.product.name) {
                        document.title = `${this.product.name} | EzyParts`;
                    }

                    // Trigger Re-render breadcrumb
                    if (window.renderBreadcrumb) {
                        window.renderBreadcrumb([
                            { label: 'Home', action: "window.navigate('home')" },
                            { label: 'Product', action: "window.navigate('shop')" },
                            { label: this.product.name || 'Detail Produk' }
                        ]);
                    }
                } else if (response.status === 'error' && (response.message?.toLowerCase().includes('not found') || response.message?.toLowerCase().includes('tidak ditemukan'))) {
                    // Jika produk tidak ada di database, pastikan rute berubah ke 404
                    this.error = true;
                    window.navigate('404');
                } else {
                    this.showError('Produk Tidak Tersedia', response.message || 'Gagal memuat detail produk saat ini.');
                }
            } catch (e) {
                console.error('❌ [Debug] Critical Error fetching product:', e);
                this.showError('Koneksi Terganggu', 'Gagal memuat data. Mohon periksa Site Key atau koneksi internet Anda.');
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
                    if (sourceEl && window.flyToCart) {
                        window.flyToCart(sourceEl, this.product.imageurl);
                    }
                }
            }
        }
    };
};
