/**
 * Home Page Logic for Public EzyParts
 * Displays data from Admin database
 */
window.initHomePage = function () {
    return {
        // Data
        products: [],
        posts: [],
        slides: [],
        connectionStatus: {
            connected: false,
            error: null
        },

        // Loading states
        isLoadingProducts: true,
        isLoadingPosts: false,
        isLoadingSlides: false,

        // Slider State
        activeSlide: 0,
        totalSlides: 0,
        sliderInterval: null,

        async init() {

            // Check connection status
            await this.checkConnection();

            // Load data if connected
            if (this.connectionStatus.connected) {
                await this.loadAllHomeData();
            }

            // Start Slider
            this.startSlider();
        },

        async loadAllHomeData() {
            this.isLoadingSlides = true;
            this.isLoadingProducts = true;
            this.isLoadingPosts = true;
            try {
                // 1. Ambil SEMUA data (Home Config & Products) dalam satu tarikan Feed
                const pageRes = await fetch('/feeds/pages/default?alt=json&max-results=50');
                const pageJson = await pageRes.json();
                if (pageJson.feed && pageJson.feed.entry) {
                    // Unified parser: extract ezy-meta from all entries
                    const allMeta = pageJson.feed.entry.map(entry => {
                        const metaMatch = entry.content.$t.match(/class="ezy-meta">([\s\S]*?)<\/script>/);
                        if (!metaMatch) return null;
                        try {
                            const meta = JSON.parse(metaMatch[1]);
                            meta._entry = entry; // Attach original entry for slug extraction
                            return meta;
                        } catch (e) { return null; }
                    }).filter(Boolean);

                    // Cari data Home (slider + kategori)
                    const homeMeta = allMeta.find(m => m._type === 'home') ||
                                     allMeta.find(m => m.heroes !== undefined);
                    if (homeMeta) {
                        this.slides = homeMeta.heroes || [];
                        this.totalSlides = this.slides.length;
                        if (window.app) {
                            window.app.categories = homeMeta.categories || [];
                            window.app.subcategories = homeMeta.subcategories || {};
                        }
                    }

                    // Filter Products: use _type first, fallback to price check
                    this.products = allMeta
                        .filter(m => m._type === 'product' || (m._type === undefined && m.price !== undefined))
                        .map(meta => {
                            const entry = meta._entry;
                            return {
                                id: meta.id,
                                name: meta.title,
                                slug: meta.slug || entry.link.find(l => l.rel === 'alternate').href.split('/').pop().replace('.html', ''),
                                imageurl: meta.image,
                                price: meta.price,
                                originalprice: meta.originalprice,
                                category: meta.category,
                                badge: meta.badge,
                                publishdate: meta.publishdate
                            };
                        });
                }

                // 3. Fetch Posts via Blogger Feed (Postingan Berita)
                const postRes = await fetch('/feeds/posts/default?alt=json&max-results=6');
                const postJson = await postRes.json();
                if (postJson.feed && postJson.feed.entry) {
                    this.posts = postJson.feed.entry.map(entry => {
                        const content = entry.content.$t;
                        const metaMatch = content.match(/class="ezy-meta">([\s\S]*?)<\/script>/);
                        const meta = metaMatch ? JSON.parse(metaMatch[1]) : {};

                        return {
                            id: entry.id.$t,
                            title: entry.title.$t,
                            slug: entry.link.find(l => l.rel === 'alternate').href.split('/').pop().replace('.html', ''),
                            content: meta.snippet || entry.summary?.$t || entry.content.$t.replace(/<[^>]*>?/gm, '').substring(0, 120),
                            imageurl: entry.media$thumbnail?.url.replace('s72-c', 's1600') || meta.image || '',
                            publishdate: entry.published.$t,
                            category: entry.category ? entry.category[0].term : (meta.category || 'News')
                        };
                    });
                }
            } catch (error) {
                console.error('Error loading home data:', error);
            } finally {
                this.isLoadingSlides = false;
                this.isLoadingProducts = false;
                this.isLoadingPosts = false;
            }
        },

        // Legacy individual loaders kept for fallback/specific needs
        async loadSlides() {
            // ... already covered by loadAllHomeData
        },

        startSlider() {
            this.stopSlider();
            if (this.totalSlides <= 1) return;
            this.sliderInterval = setInterval(() => {
                this.nextSlide();
            }, 5000);
        },

        stopSlider() {
            if (this.sliderInterval) {
                clearInterval(this.sliderInterval);
                this.sliderInterval = null;
            }
        },

        nextSlide() {
            if (this.totalSlides === 0) return;
            this.activeSlide = (this.activeSlide + 1) % this.totalSlides;
        },

        prevSlide() {
            if (this.totalSlides === 0) return;
            this.activeSlide = (this.activeSlide - 1 + this.totalSlides) % this.totalSlides;
        },

        setSlide(index) {
            this.activeSlide = index;
            this.startSlider();
        },

        async checkConnection() {
            try {
                const result = await window.AdminAPI.checkConnection();
                this.connectionStatus = result;

                if (result.connected) {
                } else {
                    console.warn('❌ Failed to connect to admin database:', result.error);
                }
            } catch (error) {
                console.error('Connection check failed:', error);
                this.connectionStatus = {
                    connected: false,
                    error: error.message
                };
            }
        },

        async loadProducts() {
            // Produk sekarang dimuat via Feed di loadAllHomeData
            return Promise.resolve();
        },

        async loadPosts() {
            // Postingan sekarang dimuat via Feed di loadAllHomeData
            return Promise.resolve();
        },

        // Utility functions
        formatPrice(price) {
            if (!price) return 'Contact for price';

            // Format as Indonesian Rupiah
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(price);
        },

        formatDate(dateString) {
            if (!dateString) return '';

            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        viewPost(post) {
            // Navigate to post detail page
            window.navigate('post', { slug: post.slug || post.id });
        },

        viewProduct(product) {
            // Navigate to product detail page
            window.navigate('product', { slug: product.slug || product.id });
        },

        getSnippet(text) {
            if (!text) return '';
            return text.replace(/<[^>]*>/g, '').replace(/[*_~`]/g, '').trim().slice(0, 120) + (text.length > 120 ? '...' : '');
        },

        // Refresh data
        async refresh() {
            await this.checkConnection();

            if (this.connectionStatus.connected) {
                await Promise.all([
                    this.loadProducts(),
                    this.loadPosts()
                ]);
            }
        }
    };
};