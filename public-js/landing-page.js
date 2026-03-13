/**
 * public-js/landing-page.js
 * Frontend logic for the Public Landing Page storefront.
 * Uses AdminAPI to fetch data from the landing-page plugin.
 */
(function() {
    const register = () => {
        if (window.Alpine && !window.Alpine.data('initLandingPage')) {
            window.Alpine.data('initLandingPage', () => ({
                products: [],
                categories: [],
                loading: true,
                selectedCategory: 'All',
                searchQuery: '',

                async init() {
                    console.log("Public Landing Page Component Init");
                    await this.fetchLandingData();
                },

                async fetchLandingData() {
                    this.loading = true;
                    try {
                        // AdminAPI is defined in public-1.html
                        // dataSource: 'getPublicLandingData' is from plugin config
                        const res = await window.AdminAPI.get('getPublicLandingData');
                        
                        if (res && res.status === 'success') {
                            this.products = res.data || [];
                            this.categories = ['All', ...(res.categories || [])];
                            console.log(`Loaded ${this.products.length} products for public display`);
                        } else {
                            console.error('Failed to fetch landing data:', res?.message);
                        }
                    } catch (e) {
                        console.error('Error fetching landing data:', e);
                    } finally {
                        this.loading = false;
                    }
                },

                get filteredProducts() {
                    return this.products.filter(p => {
                        const matchesCategory = this.selectedCategory === 'All' || p.category === this.selectedCategory;
                        const matchesSearch = p.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                                            p.description.toLowerCase().includes(this.searchQuery.toLowerCase());
                        return matchesCategory && matchesSearch;
                    });
                },

                formatPrice(price) {
                    if (window.app && window.app.formatPrice) {
                        return window.app.formatPrice(price);
                    }
                    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
                },

                getDiscountPercentage(price, originalPrice) {
                    if (!originalPrice || originalPrice <= price) return 0;
                    return Math.round(((originalPrice - price) / originalPrice) * 100);
                }
            }));
        }
    };

    if (window.Alpine) {
        register();
    } else {
        document.addEventListener('alpine:init', register);
    }
})();
