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
        categories: [],
        subcategories: {},
        connectionStatus: {
            connected: false,
            error: null
        },

        // Loading states
        isLoadingProducts: true,
        isLoadingPosts: true,
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
                // 1. Ambil SEMUA data (Home Config, Products, dan News) dalam satu tarikan Feed
                // Menggunakan Edge CDN Blogger secara Native agar loading super cepat
                const pageRes = await fetch('/feeds/pages/default?alt=json&max-results=100');
                const pageJson = await pageRes.json();

                if (pageJson.feed && pageJson.feed.entry) {
                    const parser = new DOMParser();

                    // Unified parser: Ekstraksi metadata JSON secara native menggunakan DOM
                    const allMeta = pageJson.feed.entry.map(entry => {
                        const htmlContent = entry.content ? entry.content.$t : '';
                        if (!htmlContent) return null;

                        const doc = parser.parseFromString(htmlContent, 'text/html');
                        const metaNode = doc.querySelector('script.ezy-meta[type="application/json"]') ||
                            doc.querySelector('script.ezy-meta');

                        if (!metaNode) return null;

                        try {
                            const meta = JSON.parse(metaNode.textContent);
                            meta._entry = entry; // Attach original entry for slug extraction

                            const linkNode = entry.link.find(l => l.rel === 'alternate');
                            if (linkNode) meta._href = linkNode.href;

                            return meta;
                        } catch (e) { return null; }
                    }).filter(Boolean);

                    // Cari data Home (slider + kategori)
                    const homeMeta = allMeta.find(m => m._type === 'home') ||
                        allMeta.find(m => m.heroes !== undefined);
                    if (homeMeta) {
                        this.slides = homeMeta.heroes || [];
                        this.totalSlides = this.slides.length;

                        // Proses Kategori: Pisahkan Parent dan Children
                        const allCats = homeMeta.categories || [];
                        this.categories = allCats.filter(c => !c.parentid || c.parentid === '');
                        this.subcategories = {};
                        allCats.forEach(c => {
                            if (c.parentid) {
                                if (!this.subcategories[c.parentid]) this.subcategories[c.parentid] = [];
                                this.subcategories[c.parentid].push(c);
                            }
                        });
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
                                publishdate: meta.publishdate || meta._entry.published.$t
                            };
                        });

                    // 3. Filter Posts (News): Diambil dari metadata yang tidak memiliki harga dan hero slider
                    this.posts = allMeta
                        .filter(m => m._type === 'post' || (m._type === undefined && m.price === undefined && m.heroes === undefined))
                        .map(meta => ({
                            id: meta.id || meta._entry.id.$t,
                            title: meta.title || meta._entry.title.$t,
                            slug: meta.slug || meta._href.split('/').pop().replace('.html', ''),
                            content: meta.snippet || meta._entry.summary?.$t || '',
                            imageurl: meta.image || '',
                            publishdate: meta.publishdate || meta._entry.published.$t,
                            category: Array.isArray(meta.category) ? meta.category[0] : (meta.category || 'News')
                        }))
                        .sort((a, b) => new Date(b.publishdate) - new Date(a.publishdate))
                        .slice(0, 6);
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