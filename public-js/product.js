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
                const parser = new DOMParser();

                // 1. Cek apakah metadata sudah ada di DOM (Jika akses langsung/Blogger Native)
                const localMetaNode = document.querySelector('script.ezy-meta');
                if (localMetaNode) {
                    try {
                        const localMeta = JSON.parse(localMetaNode.textContent);
                        // Pastikan slug cocok agar tidak salah data saat navigasi SPA
                        if (localMeta.slug === this.slug || window.location.pathname.includes(this.slug)) {
                            console.log('🚀 [Product] Found metadata in local DOM');
                            this.renderProduct(localMeta);
                            return;
                        }
                    } catch (e) { console.warn('Failed to parse local meta'); }
                }

                // 2. Cari di Blogger Feed (Edge CDN Native)
                const feedRes = await fetch('/feeds/pages/default?alt=json&max-results=100');
                const feedJson = await feedRes.json();

                if (feedJson.feed && feedJson.feed.entry) {
                    const entry = feedJson.feed.entry.find(e => {
                        const link = e.link.find(l => l.rel === 'alternate');
                        return link && link.href.includes(this.slug);
                    });

                    if (entry) {
                        const doc = parser.parseFromString(entry.content.$t, 'text/html');
                        const metaNode = doc.querySelector('script.ezy-meta');
                        if (metaNode) {
                            const meta = JSON.parse(metaNode.textContent);
                            console.log('🚀 [Product] Found metadata in Blogger Feed');
                            this.renderProduct(meta);
                            return;
                        }
                    }
                }

                // 3. Fallback terakhir: AdminAPI (Server-side)
                if (window.AdminAPI) {
                    const response = await window.AdminAPI.get('getProductDetail', { slug: this.slug });
                    if (response.status === 'success' && response.data) {
                        this.renderProduct(response.data);
                        return;
                    }
                }

                this.showError('Produk Tidak Ditemukan', 'Detail produk tidak tersedia di sistem.');
            } catch (e) {
                console.error('❌ [Debug] Critical Error fetching product:', e);
                this.showError('Koneksi Terganggu', 'Gagal memuat data. Mohon periksa Site Key atau koneksi internet Anda.');
            } finally {
                this.loading = false;
            }
        },

        renderProduct(data) {
            this.product = data;
            this.loading = false;
            this.error = false;

            if (this.product.name || this.product.title) {
                document.title = `${this.product.name || this.product.title} | EzyParts`;
            }

            if (window.renderBreadcrumb) {
                window.renderBreadcrumb([
                    { label: 'Home', action: "window.navigate('home')" },
                    { label: 'Product', action: "window.navigate('shop')" },
                    { label: this.product.name || this.product.title || 'Detail Produk' }
                ]);
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
