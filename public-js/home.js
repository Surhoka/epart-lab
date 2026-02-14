/**
 * Home Page Logic for Public EzyParts
 * Displays data from Admin database
 */
window.initHomePage = function () {
    return {
        // Data
        products: [],
        posts: [],
        connectionStatus: {
            connected: false,
            error: null
        },

        // Loading states
        isLoadingProducts: false,
        isLoadingPosts: false,

        // Slider State
        activeSlide: 0,
        totalSlides: 3,
        sliderInterval: null,

        async init() {
            console.log('Home page initialized');

            // Start Slider
            this.startSlider();

            // Check connection status
            await this.checkConnection();

            // Load data if connected
            if (this.connectionStatus.connected) {
                await Promise.all([
                    this.loadProducts(),
                    this.loadPosts()
                ]);
            }
        },

        startSlider() {
            this.stopSlider();
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
            this.activeSlide = (this.activeSlide + 1) % this.totalSlides;
        },

        prevSlide() {
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
                    console.log('✅ Connected to admin database');
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
            this.isLoadingProducts = true;

            try {
                const response = await window.AdminAPI.getProducts({
                    limit: 6,
                    featured: true
                });

                if (response.status === 'success') {
                    this.products = response.data || [];
                    console.log('✅ Loaded products:', this.products.length);
                } else {
                    console.warn('Failed to load products:', response.message);
                    this.products = [];
                }
            } catch (error) {
                console.error('Error loading products:', error);
                this.products = [];
            } finally {
                this.isLoadingProducts = false;
            }
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
                    console.log('✅ Loaded posts:', this.posts.length);
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
            window.navigate('post', { id: post.id });
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