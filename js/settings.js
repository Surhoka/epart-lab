(function () {
    const registerSettings = () => {
        Alpine.data('settingsPage', () => ({
            isLoading: false,
            activeTab: 'general',
            settings: {
                theme: 'light',
                language: 'en',
                notifications: {
                    orders: true,
                    stock: true,
                    marketing: false
                }
            },

            init() {
                this.loadSettings();
            },

            loadSettings() {
                // Load from localStorage or use defaults
                const saved = localStorage.getItem('userSettings');
                if (saved) {
                    try {
                        this.settings = { ...this.settings, ...JSON.parse(saved) };
                    } catch (e) { console.error('Error parsing settings', e); }
                }

                // Sync theme state with global app state
                const isDark = document.documentElement.classList.contains('dark');
                if (!saved) {
                    this.settings.theme = isDark ? 'dark' : 'light';
                }
            },

            saveSettings() {
                this.isLoading = true;

                // Simulate API delay for better UX
                setTimeout(() => {
                    localStorage.setItem('userSettings', JSON.stringify(this.settings));

                    // Apply Theme Immediately
                    if (this.settings.theme === 'dark' || (this.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                        if (window.app) window.app.darkMode = true;
                        document.documentElement.classList.add('dark');
                    } else {
                        if (window.app) window.app.darkMode = false;
                        document.documentElement.classList.remove('dark');
                    }

                    window.showToast('Settings saved successfully!', 'success');
                    this.isLoading = false;
                }, 600);
            },

            downloadPublicTemplate(raw = false) {
                try {
                    // Get config from global EzyApi or localStorage
                    const configCache = localStorage.getItem('Ezyparts_Config_Cache');
                    const config = configCache ? JSON.parse(configCache) : (window.EzyApi?.config || {});

                    // Determine Gateway URL
                    // Prioritize CONFIG.WEBAPP_URL_DEV (Gateway) over EzyApi.gatewayUrl (which might be Project URL)
                    let gatewayUrl = (typeof CONFIG !== 'undefined' && CONFIG.WEBAPP_URL_DEV)
                        ? CONFIG.WEBAPP_URL_DEV
                        : window.EzyApi?.gatewayUrl;

                    if (!gatewayUrl) {
                        window.showToast('Gateway URL not found.', 'error');
                        return;
                    }

                    // Determine Admin URL (Self) & Site Key
                    const adminUrl = config.adminUrl || config.webappUrl || window.EzyApi?.url;
                    const siteKey = config.siteKey;

                    if (!adminUrl || !siteKey) {
                        window.showToast('Configuration incomplete (Missing Site Key or URL).', 'error');
                        return;
                    }

                    const params = new URLSearchParams({
                        action: 'download_public_template',
                        adminUrl: adminUrl,
                        siteKey: siteKey,
                        dbName: config.dbName || 'Database',
                        mode: raw ? 'raw' : 'injected'
                    });
                    window.open(`${gatewayUrl}${gatewayUrl.includes('?') ? '&' : '?'}${params.toString()}`, '_blank');
                } catch (e) {
                    console.error('Download error:', e);
                    window.showToast('Failed to prepare download.', 'error');
                }
            }
        }));
    };

    if (window.Alpine) {
        registerSettings();
    } else {
        document.addEventListener('alpine:init', registerSettings);
    }
})();
console.log("settings.js loaded");