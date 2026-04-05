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
                // Mengambil seluruh berita yang ada di database public
                const res = await window.AdminAPI.get('get_posts', { isPublic: true });

                if (res.status === 'success' && res.data) {
                    // Normalisasi data: hanya yang Published dan urutkan dari yang terbaru
                    this.posts = res.data
                        .filter(p => p.status === 'Published')
                        .sort((a, b) => new Date(b.publishdate || b.datecreated) - new Date(a.publishdate || a.datecreated));

                    // Ekstrak daftar kategori unik untuk dropdown filter
                    const catSet = new Set();
                    this.posts.forEach(p => {
                        if (Array.isArray(p.category)) {
                            p.category.forEach(c => catSet.add(c));
                        } else if (p.category) {
                            p.category.split(',').forEach(c => catSet.add(c.trim()));
                        }
                    });
                    this.categories = Array.from(catSet).sort();
                }
            } catch (e) {
                console.error('[PostList] Error fetching data:', e);
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
                    { label: 'Beranda', action: "window.navigate('home')" },
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