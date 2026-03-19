/**
 * Shop Page Logic for Public EzyParts
 * Handles product listing, filtering by category, and sorting
 */
window.initShopPage = function () {
    return {
        // State
        isLoading: true,
        products: [],
        categories: [],
        selectedCategory: 'all',
        searchQuery: '',
        sortOrder: 'newest', // newest, price-low, price-high, name-asc
        
        async init() {
            // Get initial category from params if navigated from elsewhere
            const params = window.currentParams || {};
            if (params.category) {
                this.selectedCategory = params.category;
            }
            
            await this.fetchData();
            
            // Re-render breadcrumb
            this.updateBreadcrumb();
        },
        
        async fetchData() {
            this.isLoading = true;
            try {
                // We use the same home data endpoint as it contains all we need
                const response = await window.AdminAPI.get('getPublicHomeData');
                if (response.status === 'success' && response.data) {
                    this.products = response.data.products || [];
                    this.categories = response.data.categories || [];
                }
            } catch (e) {
                console.error('Error fetching shop data:', e);
            } finally {
                this.isLoading = false;
            }
        },
        
        updateBreadcrumb() {
            if (window.renderBreadcrumb) {
                const crumbs = [
                    { label: 'Beranda', action: "window.navigate('home')" },
                    { label: 'Shop' }
                ];
                
                if (this.selectedCategory !== 'all') {
                    const cat = this.categories.find(c => c.slug === this.selectedCategory || c.id === this.selectedCategory);
                    if (cat) {
                        crumbs.push({ label: cat.name });
                    }
                }
                
                window.renderBreadcrumb(crumbs);
            }
        },
        
        // Computed: Filtered and Sorted Products
        get filteredProducts() {
            let list = [...this.products];
            
            // 1. Category Filter
            if (this.selectedCategory !== 'all') {
                list = list.filter(p => p.category === this.selectedCategory || p.categoryId === this.selectedCategory);
            }
            
            // 2. Search Filter
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                list = list.filter(p => 
                    p.name.toLowerCase().includes(q) || 
                    (p.description && p.description.toLowerCase().includes(q))
                );
            }
            
            // 3. Sorting
            switch (this.sortOrder) {
                case 'price-low':
                    list.sort((a, b) => Number(a.price) - Number(b.price));
                    break;
                case 'price-high':
                    list.sort((a, b) => Number(b.price) - Number(a.price));
                    break;
                case 'name-asc':
                    list.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'newest':
                default:
                    // Assuming higher ID or reverse order is "newer" if no date
                    // Or use created_at if available
                    list.sort((a, b) => (b.id > a.id ? 1 : -1));
                    break;
            }
            
            return list;
        },
        
        setCategory(slug) {
            this.selectedCategory = slug;
            this.updateBreadcrumb();
            // Scroll to top of grid on mobile
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        
        viewProduct(product) {
            window.navigate('product', { slug: product.slug || product.id });
        },
        
        formatPrice(val) {
            if (!val) return 'Rp 0';
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(val);
        }
    };
};
