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
                // OPTIMASI EKSTREM: Mengambil data Produk dari Edge CDN Blogger secara Native
                const res = await fetch('/feeds/pages/default?alt=json&max-results=500');
                if (!res.ok) throw new Error('Blogger Feed tidak dapat dijangkau');
                const data = await res.json();

                let extractedProducts = [];

                if (data.feed && data.feed.entry) {
                    const parser = new DOMParser();
                    data.feed.entry.forEach(entry => {
                        const htmlContent = entry.content ? entry.content.$t : '';
                        if (!htmlContent) return;

                        const doc = parser.parseFromString(htmlContent, 'text/html');
                        const metaNode = doc.querySelector('script.ezy-meta[type="application/json"]');
                        
                        if (metaNode) {
                            try {
                                const prodData = JSON.parse(metaNode.textContent);
                                
                                const linkNode = entry.link.find(l => l.rel === 'alternate');
                                if (linkNode) {
                                    const pathMatch = new URL(linkNode.href).pathname.match(/\/p\/([^.]+)\.html/);
                                    if (pathMatch) prodData.slug = pathMatch[1];
                                }

                                // Deteksi Produk: v1 schema → _type, fallback → price check
                                const isProduct = prodData._type === 'product' || (prodData._type === undefined && prodData.price !== undefined);
                                if (isProduct) {
                                    prodData.name = prodData.title || entry.title.$t;
                                    prodData.imageurl = prodData.image || '';
                                    extractedProducts.push(prodData);
                                }
                            } catch (parseError) {
                                console.warn('[Shop] Gagal menguraikan metadata untuk:', entry.title.$t);
                            }
                        }
                    });
                }

                this.products = extractedProducts;

                // Bangun Ulang Kategori secara Dinamis berformat array {id, name, slug}
                const catSet = new Set();
                this.products.forEach(p => {
                    if (Array.isArray(p.category)) {
                        p.category.forEach(c => { if(c) catSet.add(c) });
                    } else if (p.category && typeof p.category === 'string') {
                        p.category.split(',').forEach(c => { if(c.trim()) catSet.add(c.trim()) });
                    }
                });
                
                this.categories = Array.from(catSet).sort().map(c => ({
                    id: c,
                    name: c,
                    slug: c
                }));

            } catch (e) {
                console.error('[Shop] Error CDN fetching data:', e);
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
