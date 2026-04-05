window.initPostListPage = function () {
    return {
        posts: [],
        categories: [],
        isLoading: true,
        searchQuery: '',
        selectedCategory: 'all',

        async init() {
            await this.fetchData();
            this.updateBreadcrumb();
        },

        async fetchData() {
            this.isLoading = true;
            try {
                // OPTIMASI EKSTREM: Mengambil data dari Edge CDN Blogger secara Native
                const res = await fetch('/feeds/pages/default?alt=json&max-results=500');
                if (!res.ok) throw new Error('Blogger Feed tidak dapat dijangkau');
                const data = await res.json();

                let extractedPosts = [];

                if (data.feed && data.feed.entry) {
                    const parser = new DOMParser();
                    data.feed.entry.forEach(entry => {
                        const htmlContent = entry.content ? entry.content.$t : '';
                        if (!htmlContent) return;

                        // Ekstraksi Metadata JSON yang disuntikkan oleh Backend
                        const doc = parser.parseFromString(htmlContent, 'text/html');
                        const metaNode = doc.querySelector('script.ezy-meta[type="application/json"]');
                        
                        if (metaNode) {
                            try {
                                const postData = JSON.parse(metaNode.textContent);
                                
                                // Simpan URL path slug yang absulut
                                const linkNode = entry.link.find(l => l.rel === 'alternate');
                                if (linkNode) {
                                    const pathMatch = new URL(linkNode.href).pathname.match(/\/p\/([^.]+)\.html/);
                                    if (pathMatch) postData.slug = pathMatch[1];
                                }

                                // Pisahkan antara struktur Products vs Posts 
                                // (Posts tidak memiliki properti price di meta-nya)
                                if (postData.price === undefined) {
                                    // Pastikan data yang kosong diformat dengan baik
                                    postData.title = postData.title || entry.title.$t;
                                    extractedPosts.push(postData);
                                }
                            } catch (parseError) {
                                console.warn('[PostList] Gagal menguraikan metadata untuk:', entry.title.$t);
                            }
                        }
                    });
                }

                // Normalisasi data: urutkan dari yang terbaru
                this.posts = extractedPosts.sort((a, b) => new Date(b.publishdate || 0) - new Date(a.publishdate || 0));

                // Ekstrak daftar kategori unik untuk dropdown filter
                const catSet = new Set();
                this.posts.forEach(p => {
                    if (Array.isArray(p.category)) {
                        p.category.forEach(c => { if(c) catSet.add(c) });
                    } else if (p.category && typeof p.category === 'string') {
                        p.category.split(',').forEach(c => { if(c.trim()) catSet.add(c.trim()) });
                    }
                });
                this.categories = Array.from(catSet).sort();

            } catch (e) {
                console.error('[PostList] Error CDN fetching data:', e);
            } finally {
                this.isLoading = false;
            }
        },

        get filteredPosts() {
            let list = [...this.posts];

            // Filter berdasarkan kategori
            if (this.selectedCategory !== 'all') {
                list = list.filter(p => {
                    const cats = Array.isArray(p.category) ? p.category : String(p.category || '').split(',').map(c => c.trim());
                    return cats.includes(this.selectedCategory);
                });
            }

            // Filter berdasarkan kata kunci pencarian
            if (this.searchQuery.trim()) {
                const q = this.searchQuery.toLowerCase();
                list = list.filter(p =>
                    p.title.toLowerCase().includes(q) ||
                    (p.content && p.content.toLowerCase().includes(q))
                );
            }

            return list;
        },

        updateBreadcrumb() {
            if (window.renderBreadcrumb) {
                window.renderBreadcrumb([
                    { label: 'Home', action: "window.navigate('home')" },
                    { label: 'News' }
                ]);
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
            } catch (e) { return dateStr; }
        },

        getSnippet(text) {
            if (!text) return '';
            return text.replace(/<[^>]*>/g, '').replace(/[*_~`]/g, '').trim().slice(0, 150) + (text.length > 150 ? '...' : '');
        }
    };
};