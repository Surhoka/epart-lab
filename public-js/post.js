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
            
            if (this.slug) {
                await this.fetchPost();
            } else {
                this.isLoading = false;
                console.error('No slug found in URL');
            }
        },

        getSlugFromUrl() {
            // Priority 1: Global currentParams (set by SPA router)
            if (window.currentParams?.slug) return window.currentParams.slug;
            if (window.app?.params?.slug) return window.app.params.slug;
            
            // Priority 2: Extract from direct URL (Blogger Native /p/slug.html)
            const path = window.location.pathname;
            if (path.includes('/p/')) {
                const parts = path.split('/');
                const fileName = parts[parts.length - 1];
                return fileName.replace('.html', '');
            }
            
            // Priority 3: Extract from Hash (for SPA direct navigation)
            const hash = window.location.hash || '';
            if (hash.includes('slug=')) {
                const match = hash.match(/slug=([^&]+)/);
                return match ? match[1] : null;
            }

            return null;
        },

        async fetchPost() {
            try {
                const res = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('get_post_by_slug', { slug: this.slug }, resolve, reject);
                });

                if (res.status === 'success' && res.data) {
                    this.post = res.data;
                    this.extractFeaturedImage();
                    
                    // Update Page Title
                    if (this.post.title) {
                        document.title = `${this.post.title} | ${window.app?.blogTitle || 'EzyStore'}`;
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
