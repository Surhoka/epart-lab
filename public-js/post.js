/**
 * public-js/post.js
 * Storefront logic for displaying a single post by slug.
 */
window.initPostPage = function() {
    return {
        post: null,
        isLoading: true,
        slug: null,
        featuredImage: null,

        async init() {
            this.isLoading = true;
            // Extract slug from URL hash, params or Blogger path
            this.slug = this.getSlugFromUrl();
            
            console.log('🏁 [Post] Initializing for slug:', this.slug);

            if (this.slug) {
                // Beri jeda sedikit agar window.AdminAPI benar-benar siap (terutama saat Pjax)
                setTimeout(async () => {
                   await this.fetchPost();
                }, 150);
            } else {
                this.isLoading = false;
                console.error('No slug found in URL');
            }
        },

        getSlugFromUrl() {
            console.log('🔗 [Debug] Extracting slug from URL...', window.location.pathname);
            // Priority 1: Global currentParams (set by SPA router)
            if (window.currentParams?.slug) return window.currentParams.slug;
            if (window.app?.params?.slug) return window.app.params.slug;
            
            // Priority 2: Extract from direct URL (Blogger Native /p/slug.html)
            const path = window.location.pathname;
            if (path.includes('/p/')) {
                const parts = path.split('/');
                const fileName = parts[parts.length - 1];
                const slug = fileName.replace('.html', '');
                console.log('✅ [Debug] Slug extracted from Path:', slug);
                return slug;
            }
            
            // Priority 3: Extract from Hash (for SPA direct navigation)
            const hash = window.location.hash || '';
            if (hash.includes('slug=')) {
                const match = hash.match(/slug=([^&]+)/);
                const slug = match ? match[1] : null;
                console.log('✅ [Debug] Slug extracted from Hash:', slug);
                return slug;
            }

            console.warn('❌ [Debug] No slug found in URL');
            return null;
        },

        async fetchPost() {
            console.log('📦 [Debug] Fetching Post via AdminAPI...', this.slug);
            try {
                if (!window.AdminAPI) {
                    throw new Error('AdminAPI is not defined');
                }
                
                // Ensure AdminAPI is initialized
                if (!window.AdminAPI.baseUrl) {
                    window.AdminAPI.init();
                }

                const res = await window.AdminAPI.get('get_post_by_slug', { slug: this.slug });
                
                console.log('📥 [Debug] Post API Response:', res);

                if (res.status === 'success' && res.data) {
                    this.post = res.data;
                    this.extractFeaturedImage();
                    
                    // Update Page Title
                    if (this.post.title) {
                        document.title = `${this.post.title} | EzyParts`;
                    }
                } else {
                    console.error('Post not found:', res.message);
                }
            } catch (e) {
                console.error('fetchPost error:', e);
            } finally {
                this.isLoading = false;
            }
        },

        extractFeaturedImage() {
            if (!this.post || !this.post.content) return;
            // Simple regex to find first <img> tag src
            const match = this.post.content.match(/<img[^>]+src="([^">]+)"/);
            if (match) {
                this.featuredImage = match[1];
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return '';
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        },

        share(platform) {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(this.post.title);
            let shareUrl = '';

            switch (platform) {
                case 'facebook':
                    shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                    break;
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                    break;
                case 'whatsapp':
                    shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
                    break;
            }

            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        },

        copyLink() {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Link berhasil disalin ke clipboard');
                    }
                });
            }
        }
    };
};
