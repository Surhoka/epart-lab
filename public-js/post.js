/**
 * public-js/post.js
 * Storefront logic for displaying a single post by slug.
 */
window.initPostPage = function () {
    return {
        post: null,
        isLoading: true,
        slug: null,
        featuredImage: null,

        async init() {
            this.isLoading = true;
            this.slug = this.getSlugFromUrl();
            console.log('🏁 [Post] Initializing for slug:', this.slug);

            if (this.slug) {
                await this.fetchPost();
            } else {
                this.isLoading = false;
                console.error('[Post] No slug found in URL');
            }
        },

        getSlugFromUrl() {
            // Priority 1: SPA router params (set by handleHashChange before fetchPage)
            const slug = window.currentParams?.slug || window.app?.params?.slug;
            if (slug) return slug;

            // Priority 2: Blogger native path /p/slug.html
            const path = window.location.pathname;
            if (path.includes('/p/')) {
                const fileName = path.split('/').pop();
                const s = fileName.replace('.html', '');
                if (s && s !== 'p') return s;
            }

            // Priority 3: Hash param ?slug=xxx
            const hash = window.location.hash || '';
            const match = hash.match(/slug=([^&]+)/);
            if (match) return match[1];

            return null;
        },

        async fetchPost() {
            try {
                if (typeof window.sendDataToGoogle !== 'function') {
                    throw new Error('sendDataToGoogle not available');
                }

                const res = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'get_post_by_slug',
                        { slug: this.slug },
                        resolve,
                        reject
                    );
                });

                console.log('📥 [Post] API Response:', res);

                if (res.status === 'success' && res.data) {
                    // Normalize field names — sheetToObjects_ returns lowercase keys
                    const d = res.data;
                    this.post = {
                        id:            d.id || d.ID || '',
                        title:         d.title || d.Title || '',
                        slug:          d.slug || d.Slug || this.slug,
                        content:       d.content || d.Content || '',
                        status:        d.status || d.Status || '',
                        category:      this._normalizeCategory(d.category || d.Category),
                        image:         d.image || d.Image || '',
                        publishdate:   d.publishdate || d.PublishDate || d.datecreated || d.DateCreated || '',
                        location:      d.location || d.Location || '',
                        commentoption: d.commentoption || d.CommentOption || 'allow',
                    };
                    this.extractFeaturedImage();
                    if (this.post.title) document.title = `${this.post.title} | EzyParts`;
                } else {
                    console.error('[Post] Not found:', res.message);
                    this.post = null;
                }
            } catch (e) {
                console.error('[Post] fetchPost error:', e);
                this.post = null;
            } finally {
                this.isLoading = false;
            }
        },

        _normalizeCategory(cat) {
            if (!cat) return [];
            if (Array.isArray(cat)) return cat;
            return String(cat).split(',').map(s => s.trim()).filter(Boolean);
        },

        extractFeaturedImage() {
            // Use explicit image field first, then extract from content
            if (this.post.image) {
                this.featuredImage = this.post.image;
                return;
            }
            if (this.post.content) {
                const match = this.post.content.match(/<img[^>]+src="([^">]+)"/);
                if (match) this.featuredImage = match[1];
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

        share(platform) {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(this.post?.title || '');
            const map = {
                facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
                twitter:   `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
                whatsapp:  `https://api.whatsapp.com/send?text=${text}%20${url}`,
            };
            if (map[platform]) window.open(map[platform], '_blank', 'width=600,height=400');
        },

        copyLink() {
            navigator.clipboard?.writeText(window.location.href).then(() => {
                window.showToast?.('Link berhasil disalin ke clipboard');
            });
        }
    };
};
