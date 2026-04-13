/**
 * EZYSTORE PUBLIC CLIENT BRIDGE - v3.0.0 (Direct Connection)
 * Melayani Publik dengan koneksi langsung ke Admin WebApp tanpa Gateway.
 */

// Helper untuk mendapatkan API URL secara langsung
if (typeof window.getApiUrl === 'undefined') {
    window.getApiUrl = () => {
        const getParam = (p) => {
            const sp = new URLSearchParams(window.location.search);
            if (sp.get(p)) return sp.get(p);
            if (window.location.hash.includes('?')) {
                const hp = new URLSearchParams(window.location.hash.split('?')[1]);
                return hp.get(p);
            }
            return null;
        };

        const urlFromParam = getParam('url') || getParam('adminUrl') || window.BLOGGER_WEBAPP_URL;
        if (urlFromParam) return urlFromParam.trim();

        // Priority: Injected Config from setup.gs
        if (window.EZY_SITE_CONFIG && window.EZY_SITE_CONFIG.adminUrl) {
            return window.EZY_SITE_CONFIG.adminUrl.trim();
        }

        if (typeof getWebAppUrl === 'function') {
            const url = getWebAppUrl();
            if (url) return url.trim();
        }
        return '';
    };
}

// Inisialisasi State Global
window.EzyApi = {
    url: '',
    role: window.EZY_ROLE || 'Public',
    isReady: false,
    config: { adminUrl: '', siteKey: '', isSetup: true }
};

/**
 * Mendapatkan URL API secara Global berdasarkan Role
 */
async function discoverEzyApi() {
    // [NEW] Check if SiteKey discovery is running in public.html
    if (window.EZY_DISCOVERY_PENDING) {
        console.log('Discovery: Paused (Waiting for SiteKey resolution)...');
        return;
    }

    const cacheKey = 'Ezyparts_Config_Cache';
    let CURRENT_URL = getApiUrl();

    // 1. Load Cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const config = JSON.parse(cached);
            window.EzyApi.config = config;
            applyRoleUrl(config);
        } catch (e) { }
    }

    // [NEW] Blogger Feed Discovery as secondary truth
    const discoverBloggerPages = async () => {
        try {
            const response = await fetch('/feeds/pages/default?alt=json&max-results=50');
            const json = await response.json();
            const pages = json.feed.entry || [];

            const validPages = [];
            const slugTypeMap = JSON.parse(localStorage.getItem('ezy_slug_type') || '{}');

            pages.forEach(entry => {
                const link = entry.link.find(l => l.rel === 'alternate');
                if (link) {
                    const slug = link.href.split('/').pop().replace('.html', '');
                    validPages.push(slug);
                    // Jika konten mengandung shell produk, tandai tipenya di cache router
                    if (entry.content.$t.includes('SSR_HYBRID_PRODUCT_SHELL')) {
                        slugTypeMap[slug] = 'product';
                    } else if (entry.content.$t.includes('SSR_HYBRID_HOME_DATA')) {
                        slugTypeMap[slug] = 'home'; // Redirect ke home jika diakses via /p/home.html
                    } else if (entry.content.$t.includes('SSR_HYBRID_SHELL')) {
                        slugTypeMap[slug] = 'post';
                    }
                }
            });

            localStorage.setItem('ezy_valid_pages', JSON.stringify(validPages));
            localStorage.setItem('ezy_slug_type', JSON.stringify(slugTypeMap));
        } catch (e) { console.warn('Blogger Feed discovery failed'); }
    };

    if (!CURRENT_URL) {
        console.warn('Ezyparts Discovery: No URL found. Forcing setup mode.');
        forceSetupMode();
        return;
    }

    // Fungsi Internal untuk melakukan Fetching via JSONP
    const fetchConfig = async (targetUrl, action = 'get_config') => {
        const cbName = 'ezy_discovery_' + Date.now() + Math.floor(Math.random() * 100);
        const script = document.createElement('script');
        const separator = targetUrl.includes('?') ? '&' : '?';
        const finalUrl = `${targetUrl}${separator}action=${action}&callback=${cbName}`;
        script.src = finalUrl;

        return new Promise((resolve, reject) => {
            window[cbName] = (res) => {
                delete window[cbName];
                script.remove();
                resolve(res);
            };
            script.onerror = () => {
                script.remove();
                reject(new Error('Script load failed'));
            };
            (document.head || document.documentElement).appendChild(script);
            setTimeout(() => { script.remove(); reject(new Error('Timeout after 30s')); }, 30000);
        });
    };

    // 2. PROSES DISCOVERY DENGAN SELF-HEALING
    try {
        let config;
        try {
            // Coba URL saat ini (bisa jadi dari cache yang rusak)
            config = await fetchConfig(CURRENT_URL);
        } catch (e) {
            console.warn('Primary Discovery URL failed. Trying Hardcoded Fallback...');
            // Jika gagal dan URL saat ini bukan Hardcoded, coba Hardcoded
            if (CURRENT_URL !== HARDCODED_URL && HARDCODED_URL) {
                config = await fetchConfig(HARDCODED_URL);
            } else {
                throw e; // Berhenti jika Hardcoded pun gagal
            }
        }

        if (config && (config.status === 'success' || config.isSetup === false || config.statusNote === 'no_config')) {
            window.EzyApi.config = config;

            // ONLY sync to LocalStorage if it's a confirmed healthy PROJECT (not a gateway stub)
            if (config.status === 'success' && config.isSetup === true && config.statusNote === 'active') {
                localStorage.setItem(cacheKey, JSON.stringify(config));
                applyRoleUrl(config);
                discoverBloggerPages(); // Jalankan validasi feed di background
            } else if (config.statusNote === 'setup_in_progress') {
                // Keep UI state if setup is in progress
                applyRoleUrl(config);
            }
        } else {
            throw new Error('Invalid config response');
        }
    } catch (e) {
        console.error('Discovery CRITICAL Error:', e.message);
        handleDiscoveryFailure();
        applyRoleUrl({});
    } finally {
        window.EzyApi.isReady = true;
        window.dispatchEvent(new CustomEvent('ezy-api-ready', { detail: window.EzyApi }));
    }
}

function forceSetupMode() {
    console.warn('No valid Admin URL found. Site might be unconfigured.');
}

function handleDiscoveryFailure() {
    // Discovery gagal (mungkin CMS mati/link salah).
    // Kita anggap tidak aman (Unhealthy)
    if (window.app) {
        window.app.dbHealthy = false;
        window.app.dbStatusChecked = true;
    }
}

/**
 * Memilih URL yang tepat sesuai Role saat ini
 */
function applyRoleUrl(config) {
    config = config || {};
    let API_URL = getApiUrl();

    // Direct URL has priority
    let targetUrl = config.adminUrl || config.publicUrl || API_URL;

    const finalUrl = (targetUrl && targetUrl.startsWith('http')) ? targetUrl.trim() : API_URL;

    window.EzyApi.url = finalUrl;
    window.appsScriptUrl = finalUrl;

    if (window.app) {
        window.app.dbHealthy = config.isSetup !== false && !!(config.siteKey || window.EZY_SITE_CONFIG?.siteKey);
        window.app.dbStatusChecked = true;
    }
}

// Jalankan Discovery
discoverEzyApi();

/**
 * Universal Data Sender (POST/GET)
 */
window.sendDataToGoogle = function (action, data, callback, errorHandler, customUrl = null) {
    if (!window.EzyApi.isReady) {
        setTimeout(() => window.sendDataToGoogle(action, data, callback, errorHandler, customUrl), 300);
        return;
    }

    const postActions = ['dbCreate', 'dbUpdate', 'dbDelete', 'uploadImageAndGetUrl', 'askAi'];

    if (postActions.includes(action)) {
        const payload = {
            action,
            dbId: data.dbId || (window.EzyApi.config ? window.EzyApi.config.dbId : ''),
            siteKey: data.siteKey || (window.EzyApi.config ? window.EzyApi.config.siteKey : ''),
            ...data,
            gatewayUrl: window.EzyApi.gatewayUrl
        };

        let targetUrl = customUrl || window.EzyApi.url;
        console.warn('EzyApi.url is empty, using CONFIG fallback for POST');

        fetch(targetUrl, {
            method: 'POST',
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(callback)
            .catch(err => {
                console.error('API POST Error:', err);
                if (errorHandler) errorHandler(err);
            });
    } else {
        const cbName = 'ezy_cb_' + Date.now() + Math.floor(Math.random() * 100);
        window[cbName] = function (res) {
            delete window[cbName];
            const s = document.getElementById(cbName);
            if (s) s.remove();
            if (callback) callback(res);
        };

        const query = new URLSearchParams({
            action,
            dbId: data.dbId || (window.EzyApi.config ? window.EzyApi.config.dbId : ''),
            siteKey: data.siteKey || (window.EzyApi.config ? window.EzyApi.config.siteKey : ''),
            callback: cbName,
            gatewayUrl: window.EzyApi.gatewayUrl || '',
            ...data
        }).toString();
        const script = document.createElement('script');
        script.id = cbName;
        const baseUrl = customUrl || window.EzyApi.url;
        const separator = baseUrl.includes('?') ? '&' : '?';
        script.src = `${baseUrl}${separator}${query}`;
        (document.head || document.documentElement).appendChild(script);
    }
};
