/**
 * Admin API Interface for Public EzyParts
 * Handles communication with Admin database
 */

window.AdminAPI = {
    baseUrl: '',
    
    init() {
        // Priority: 1. LocalStorage, 2. Discovered from registry, 3. Config constants, 4. Empty
        const savedAdminUrl = localStorage.getItem('adminAppsScriptUrl');
        const discoveredAdminUrl = localStorage.getItem('discoveredAdminUrl');
        const defaultAdminUrl = window.EZYPARTS_CONFIG?.DEFAULT_WEBAPP_URLS?.ADMIN_WEBAPP_URL || '';
        
        this.baseUrl = savedAdminUrl || discoveredAdminUrl || defaultAdminUrl;
        console.log('AdminAPI initialized with URL:', this.baseUrl);
    },

    /**
     * Make GET request to admin API
     */
    async get(action, params = {}) {
        if (!this.baseUrl) {
            throw new Error('Admin API URL not configured');
        }

        const url = new URL(this.baseUrl);
        url.searchParams.set('action', action);
        
        // Add parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.set(key, params[key]);
            }
        });

        console.log('AdminAPI GET:', url.toString());

        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('AdminAPI response:', result);

        return result;
    },

    /**
     * Make POST request to admin API
     */
    async post(action, data = {}) {
        if (!this.baseUrl) {
            throw new Error('Admin API URL not configured');
        }

        const payload = {
            action: action,
            ...data
        };

        console.log('AdminAPI POST:', payload);

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('AdminAPI response:', result);

        return result;
    },

    // Convenience methods for common operations

    /**
     * Get public database info
     */
    async getDatabaseInfo() {
        return await this.get('getPublicDatabaseInfo');
    },

    /**
     * Read data from public tables
     */
    async readPublicData(tableName, params = {}) {
        return await this.get('dbRead', {
            tableName: tableName,
            isPublic: true,
            ...params
        });
    },

    /**
     * Get public posts
     */
    async getPosts(params = {}) {
        return await this.get('getPosts', {
            isPublic: true,
            ...params
        });
    },

    /**
     * Get public products
     */
    async getProducts(params = {}) {
        return await this.readPublicData('products', params);
    },

    /**
     * Get branding information
     */
    async getBranding() {
        return await this.readPublicData('branding');
    },

    /**
     * List public images
     */
    async listImages(subfolderName = 'public') {
        return await this.get('listImagesInSubfolder', {
            subfolderName: subfolderName,
            isPublic: true
        });
    },

    /**
     * List image subfolders
     */
    async listImageSubfolders() {
        return await this.get('listImagesSubfolders', {
            isPublic: true
        });
    },

    /**
     * Get image download URL
     */
    async getImageUrl(fileId) {
        return await this.get('getImageDownloadUrl', {
            fileId: fileId
        });
    },

    /**
     * Submit contact form (if write access allowed)
     */
    async submitContact(contactData) {
        return await this.post('dbCreate', {
            tableName: 'contact_submissions',
            data: {
                ...contactData,
                submittedAt: new Date().toISOString(),
                status: 'new'
            },
            isPublic: true
        });
    },

    /**
     * Check connection status
     */
    async checkConnection() {
        try {
            const result = await this.getDatabaseInfo();
            return {
                connected: result.status === 'success',
                data: result.data,
                error: null
            };
        } catch (error) {
            return {
                connected: false,
                data: null,
                error: error.message
            };
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.AdminAPI.init();
});

// Also initialize immediately if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.AdminAPI.init();
    });
} else {
    window.AdminAPI.init();
}