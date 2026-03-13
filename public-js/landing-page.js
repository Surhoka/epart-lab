/**
 * public-js/landing-page.js
 * Frontend logic for the Public Landing Page storefront.
 * Uses AdminAPI to fetch data from the landing-page plugin.
 */
(function() {
    const getLandingData = () => ({
        selectedProduct: null,
        loading: true,

        async init() {
            console.log("Public Sales Page Component Init");
            await this.fetchLandingData();
        },

        async fetchLandingData() {
            this.loading = true;
            try {
                const res = await window.AdminAPI.get('getPublicLandingData');
                
                if (res && res.status === 'success') {
                    const products = res.data || [];
                    this.selectedProduct = products.length > 0 ? products[0] : null;
                } else {
                    console.error('Failed to fetch sales data:', res?.message);
                }
            } catch (e) {
                console.error('Error fetching sales data:', e);
            } finally {
                this.loading = false;
            }
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
    });

    // Handle global call x-data="initLandingPage()"
    window.initLandingPage = getLandingData;

    const register = () => {
        if (window.Alpine && !window.Alpine.data('initLandingPage')) {
            window.Alpine.data('initLandingPage', getLandingData);
        }
    };

    if (window.Alpine) {
        register();
    } else {
        document.addEventListener('alpine:init', register);
    }
})();
