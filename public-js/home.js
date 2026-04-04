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
                const response = await window.AdminAPI.get('getPublicHomeData');
                if (response.status === 'success') {
                    const d = response.data;
                    this.slides = d.heroes || [];
                    this.totalSlides = this.slides.length;
                    this.activeSlide = 0;
                    this.products = d.products || [];
                    this.posts = d.posts || [];
                    
                    // Trigger categories update if needed
                    if (window.app && d.categories) {
                        window.app.categories = d.categories;
                    }
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
            // Already handled by loadAllHomeData for efficiency
        },

        async loadPosts() {
            this.isLoadingPosts = true;

            try {
                const response = await window.AdminAPI.getPosts({
                    limit: 4,
                    status: 'published'
                });

                if (response.status === 'success') {
                    this.posts = response.data || [];
                } else {
                    console.warn('Failed to load posts:', response.message);
                    this.posts = [];
                }
            } catch (error) {
                console.error('Error loading posts:', error);
                this.posts = [];
            } finally {
                this.isLoadingPosts = false;
            }
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