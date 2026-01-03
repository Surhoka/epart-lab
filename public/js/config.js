/**
 * Public EzyParts Configuration
 * Registry Bootstrap System - Only need 1 WebApp URL for setup
 */

window.EZYPARTS_CONFIG = {
    // Registry Bootstrap - Setup endpoint untuk lintas project
    REGISTRY_BOOTSTRAP: {
        // Setup endpoint URL - SATU untuk SEMUA user (lintas project)
        DEFAULT_WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbxiwRjJV1b3y6tNQ5t8qytIDsyTVBzS4GVocemtCVenVfftKyO4atT81PDQjncr5OWR/exec',
        
        // Alternative: Multiple setup endpoints for redundancy
        BOOTSTRAP_URLS: [
            // Backup setup endpoints jika primary tidak tersedia
        ]
    },
    
    // Legacy support - will be auto-populated from registry
    DEFAULT_WEBAPP_URLS: {
        ADMIN_WEBAPP_URL: '', // Auto-discovered from registry
        PUBLIC_WEBAPP_URL: '' // Auto-discovered from registry
    },
    
    // API Configuration
    API_CONFIG: {
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3,
        CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CACHING: true,
        ENABLE_OFFLINE_MODE: true,
        ENABLE_DEBUG_LOGGING: false,
        ENABLE_ANALYTICS: false
    },
    
    // UI Configuration
    UI_CONFIG: {
        ITEMS_PER_PAGE: 12,
        SEARCH_DEBOUNCE: 300,
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300
    },
    
    // Public Data Tables (allowed for public access)
    ALLOWED_PUBLIC_TABLES: [
        'products',
        'categories',
        'posts',
        'branding',
        'contact_submissions'
    ],
    
    // Connection Modes
    CONNECTION_MODES: {
        READONLY: 'readonly',
        READWRITE: 'readwrite'
    },
    
    // Version Info
    VERSION: '2.0.0',
    BUILD_DATE: '2025-01-03'
};

// Backward compatibility - expose DEFAULT_WEBAPP_URLS globally
window.DEFAULT_WEBAPP_URLS = window.EZYPARTS_CONFIG.DEFAULT_WEBAPP_URLS;

console.log('EzyParts Config loaded:', window.EZYPARTS_CONFIG.VERSION);

// Registry Bootstrap System
window.EZYPARTS_REGISTRY = {
    /**
     * Auto-discover Admin and Public URLs from a single bootstrap URL
     * Uses JSONP fallback for CORS issues
     */
    async bootstrap(bootstrapUrl) {
        try {
            console.log('Registry Bootstrap: Discovering URLs from', bootstrapUrl);
            
            // First try regular fetch
            try {
                const response = await fetch(`${bootstrapUrl}?action=getRegistryInfo`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    return this.processBootstrapResult(result);
                }
            } catch (fetchError) {
                console.log('Fetch failed, trying JSONP fallback:', fetchError.message);
            }
            
            // Fallback to JSONP for CORS issues
            const result = await this.bootstrapWithJsonp(bootstrapUrl);
            return this.processBootstrapResult(result);

        } catch (error) {
            console.error('Registry Bootstrap error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Process bootstrap result and update config
     */
    processBootstrapResult(result) {
        console.log('Registry Bootstrap result:', result);

        if (result.status === 'success' && result.data) {
            const registry = result.data;
            
            // Update config with discovered URLs
            window.EZYPARTS_CONFIG.DEFAULT_WEBAPP_URLS.ADMIN_WEBAPP_URL = registry.adminUrl || '';
            window.EZYPARTS_CONFIG.DEFAULT_WEBAPP_URLS.PUBLIC_WEBAPP_URL = registry.publicUrl || '';
            
            // Store in localStorage for persistence
            if (registry.adminUrl) {
                localStorage.setItem('discoveredAdminUrl', registry.adminUrl);
            }
            if (registry.publicUrl) {
                localStorage.setItem('discoveredPublicUrl', registry.publicUrl);
            }
            
            console.log('Registry Bootstrap: URLs discovered', {
                admin: registry.adminUrl,
                public: registry.publicUrl
            });
            
            return {
                success: true,
                adminUrl: registry.adminUrl,
                publicUrl: registry.publicUrl,
                registry: registry
            };
        } else {
            throw new Error(result.message || 'Registry info not available');
        }
    },

    /**
     * JSONP fallback for CORS issues
     */
    async bootstrapWithJsonp(bootstrapUrl) {
        return new Promise((resolve, reject) => {
            const callbackName = 'ezypartsBootstrap_' + Date.now();
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP request timeout'));
            }, 10000);

            const cleanup = () => {
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                clearTimeout(timeoutId);
            };

            // Create global callback
            window[callbackName] = (data) => {
                cleanup();
                resolve(data);
            };

            // Create script tag for JSONP
            const script = document.createElement('script');
            script.src = `${bootstrapUrl}?action=getRegistryInfo&callback=${callbackName}`;
            script.onerror = () => {
                cleanup();
                reject(new Error('JSONP script load failed'));
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Try multiple bootstrap URLs until one works
     */
    async bootstrapWithFallback(urls) {
        for (const url of urls) {
            if (!url) continue;
            
            const result = await this.bootstrap(url);
            if (result.success) {
                return result;
            }
        }
        
        return {
            success: false,
            error: 'No working bootstrap URL found'
        };
    },

    /**
     * Get bootstrap URLs from config
     */
    getBootstrapUrls() {
        const urls = [];
        
        // Add default bootstrap URL
        if (window.EZYPARTS_CONFIG.REGISTRY_BOOTSTRAP.DEFAULT_WEBAPP_URL) {
            urls.push(window.EZYPARTS_CONFIG.REGISTRY_BOOTSTRAP.DEFAULT_WEBAPP_URL);
        }
        
        // Add fallback URLs
        if (window.EZYPARTS_CONFIG.REGISTRY_BOOTSTRAP.BOOTSTRAP_URLS) {
            urls.push(...window.EZYPARTS_CONFIG.REGISTRY_BOOTSTRAP.BOOTSTRAP_URLS);
        }
        
        // Add any previously discovered URLs as fallback
        const discoveredAdmin = localStorage.getItem('discoveredAdminUrl');
        const discoveredPublic = localStorage.getItem('discoveredPublicUrl');
        
        if (discoveredAdmin) urls.push(discoveredAdmin);
        if (discoveredPublic) urls.push(discoveredPublic);
        
        return [...new Set(urls)]; // Remove duplicates
    },

    /**
     * Auto-bootstrap on page load
     */
    async autoBootstrap() {
        const urls = this.getBootstrapUrls();
        
        if (urls.length === 0) {
            console.log('Registry Bootstrap: No bootstrap URLs configured');
            return { success: false, error: 'No bootstrap URLs configured' };
        }
        
        console.log('Registry Bootstrap: Auto-bootstrapping with URLs:', urls);
        return await this.bootstrapWithFallback(urls);
    }
};

// Auto-bootstrap when config loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.EZYPARTS_REGISTRY.autoBootstrap();
});
