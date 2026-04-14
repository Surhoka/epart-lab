/**
 * CDN Fetcher Module - Global Data Fetching Utility
 * Extracts and unifies data fetching logic for products and posts
 * Used across EzyParts templates for consistent CDN/AdminAPI fallback
 */

window.CDNFetcher = {
  /**
   * Parse meta data from HTML content using DOMParser with regex fallbacks
   * @param {string} html - The HTML content to parse
   * @param {string|null} slug - The slug to match (optional, if null returns any meta)
   * @returns {object|null} Parsed meta object or null if not found
   */
  parseMetaNode(html, slug = null) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const metaNode = doc.querySelector('.ezy-meta');

      let meta = null;

      if (metaNode) {
        try {
          const rawData = metaNode.getAttribute('data-meta') || metaNode.textContent;
          meta = JSON.parse(rawData);
        } catch (e) {
          console.warn('Failed to parse meta from DOM node:', e);
        }
      } else {
        // Regex fallbacks
        const divMatch = html.match(/<div[^>]*class=["']ezy-meta["'][^>]*data-meta=(['"])([\s\S]*?)\1/);
        const scriptMatch = html.match(/<script[^>]*class=["']ezy-meta["'][^>]*>([\s\S]*?)<\/script>/);

        try {
          if (divMatch && divMatch[2]) {
            const decoded = divMatch[2].replace(/&apos;/g, "'").replace(/&quot;/g, '"');
            meta = JSON.parse(decoded);
          } else if (scriptMatch && scriptMatch[1]) {
            meta = JSON.parse(scriptMatch[1]);
          }
        } catch (e) {
          console.warn('Failed to parse meta from regex:', e);
        }
      }

      // Verify slug match if provided
      if (meta && (slug === null || meta.slug === slug || meta.id === slug)) {
        return meta;
      }
    } catch (e) {
      console.error('DOMParser error:', e);
    }
    return null;
  },

  /**
   * Fetch data from Blogger CDN feed
   * @param {string} endpoint - The feed endpoint URL
   * @param {string} slug - The item slug to search for
   * @returns {object|null} Found item data or null
   */
  async fetchBloggerFeed(endpoint, slug) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.feed || !data.feed.entry) return null;

      for (const entry of data.feed.entry) {
        const html = entry.content ? entry.content.$t : '';
        const meta = this.parseMetaNode(html, slug);
        if (meta) {
          return meta;
        }
      }
    } catch (e) {
      console.warn('Blogger CDN fetch failed:', e);
    }
    return null;
  },

  /**
   * Unified 3-layer data fetching with fallbacks
   * @param {string} slug - The item slug
   * @param {string} type - 'product' or 'post'
   * @returns {object} { data, source } where source is 'handoff', 'cdn', or 'api'
   */
  async fetchItemWithFallback(slug, type) {
    if (!slug) {
      throw new Error('Slug is required');
    }

    // Layer 1: Check hand-off memory (instant)
    const handoffMeta = this.getHandoffMeta(slug);
    if (handoffMeta) {
      this.clearHandoffMeta();
      return { data: handoffMeta, source: 'handoff' };
    }

    // Layer 2: Fetch via Blogger CDN
    const endpoint = type === 'product'
      ? `/feeds/posts/default?q=${encodeURIComponent(slug)}&alt=json`
      : `/feeds/posts/default/-/Article?q=${encodeURIComponent(slug)}&alt=json`;

    const cdnData = await this.fetchBloggerFeed(endpoint, slug);
    if (cdnData) {
      return { data: cdnData, source: 'cdn' };
    }

    // Layer 3: AdminAPI fallback
    try {
      const action = type === 'product' ? 'getProductDetail' : 'get_post_by_slug';
      const res = await window.AdminAPI.get(action, { slug });
      if (res && res.status === 'success') {
        return { data: res.data, source: 'api' };
      }
    } catch (e) {
      console.error('AdminAPI fallback failed:', e);
    }

    throw new Error(`${type} not found: ${slug}`);
  },

  /**
   * Set hand-off meta data for instant loading
   * @param {object} meta - The meta object to store
   */
  setHandoffMeta(meta) {
    window._lastResolvedMeta = meta;
  },

  /**
   * Get hand-off meta if it matches the slug
   * @param {string} slug - The slug to check
   * @returns {object|null} Meta object or null
   */
  getHandoffMeta(slug) {
    if (window._lastResolvedMeta && (window._lastResolvedMeta.slug === slug || window._lastResolvedMeta.id === slug)) {
      return window._lastResolvedMeta;
    }
    return null;
  },

  /**
   * Clear hand-off meta data
   */
  clearHandoffMeta() {
    window._lastResolvedMeta = null;
  }
};