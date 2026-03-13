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
                selectedProduct: null,

                async init() {
                    console.log("Public Landing Page Component Init");
                    await this.fetchLandingData();
                },

                async fetchLandingData() {
                    this.loading = true;
                    try {
                        const res = await window.AdminAPI.get('getPublicLandingData');
                        
                        if (res && res.status === 'success') {
                            this.products = res.data || [];
                            this.categories = ['All', ...(res.categories || [])];
                            
                            // Set initial focal product (first featured or first in list)
                            if (this.products.length > 0) {
                                this.selectedProduct = this.products.find(p => p.featured) || this.products[0];
                            }
                        } else {
                            console.error('Failed to fetch landing data:', res?.message);
                        }
                    } catch (e) {
                        console.error('Error fetching landing data:', e);
                    } finally {
                        this.loading = false;
                    }
                },

                setFocusProduct(product) {
                    this.selectedProduct = product;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
