/**
 * EZYPARTS CLIENT BRIDGE - v2.3.4 (Self-Healing Discovery)
 * Melayani Admin dan Publik dengan satu script yang terhubung ke config.js
 * Perbaikan: Mendukung Self-Healing jika URL di cache rusak/lama.
 */

// Helper untuk mendapatkan Gateway URL (Gunakan window check untuk mencegah redeklarasi error)
if (typeof window.getGatewayUrl === 'undefined') {
    window.getGatewayUrl = () => {
        const getParam = (p) => {
            const sp = new URLSearchParams(window.location.search);
            if (sp.get(p)) return sp.get(p);
            if (window.location.hash.includes('?')) {
                const hp = new URLSearchParams(window.location.hash.split('?')[1]);
                return hp.get(p);
            }
            return null;
        };

        const urlFromParam = getParam('url') || getParam('userWebAppUrl');
        if (urlFromParam) return urlFromParam.trim();

        if (typeof getWebAppUrl === 'function') {
            const url = getWebAppUrl();
            if (url) return url.trim();
        }

        // FALLBACK: Use CONFIG from setup/config.js if defined
        if (typeof CONFIG !== 'undefined' && CONFIG.WEBAPP_URL_DEV) {
            return CONFIG.WEBAPP_URL_DEV.trim();
        }
        return '';
    };
}

// Inisialisasi State Global
window.EzyApi = {
    url: '',
    role: window.EZY_ROLE || 'Public',
    isReady: false,
    config: { adminUrl: '', publicUrl: '', isSetup: true }
};

/**
 * Mendapatkan URL API secara Global berdasarkan Role
 */
async function discoverEzyApi() {
    const cacheKey = 'Ezyparts_Config_Cache';
    const HARDCODED_URL = (typeof CONFIG !== 'undefined' && CONFIG.WEBAPP_URL_DEV) ? CONFIG.WEBAPP_URL_DEV.trim() : '';
    let CURRENT_URL = getGatewayUrl();

    // 1. Load Cache Awal untuk UI cepat
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const config = JSON.parse(cached);
            window.EzyApi.config = config;
            applyRoleUrl(config);
        } catch (e) { }
    }

    if (!CURRENT_URL) {
        console.warn('Ezyparts Discovery: No URL found. Forcing setup mode.');
        forceSetupMode();
        return;
    }

    // Fungsi Internal untuk melakukan Fetching via JSONP
    const fetchConfig = async (targetUrl) => {
        const cbName = 'ezy_discovery_' + Date.now() + Math.floor(Math.random() * 100);
        const script = document.createElement('script');
        const separator = targetUrl.includes('?') ? '&' : '?';
        const finalUrl = `${targetUrl}${separator}action=get_config&callback=${cbName}`;
        console.log(`Discovery: Pinging ${finalUrl}`);
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
            console.log('CLIENT RECEIVED CONFIG:', config); // DEBUG LOG

            // ONLY sync to LocalStorage if it's a confirmed healthy PROJECT (not a gateway stub)
            if (config.status === 'success' && config.isSetup === true && config.statusNote === 'active') {
                localStorage.setItem(cacheKey, JSON.stringify(config));
                applyRoleUrl(config);
            } else if (config.statusNote === 'setup_in_progress') {
                // Keep UI state if setup is in progress
                applyRoleUrl(config);
            }
        } else {
            console.warn('Discovery: Invalid or incomplete response received:', config);
            throw new Error('Invalid config response');
        }
    } catch (e) {
        console.error('Discovery CRITICAL Error:', e.message);
        // Jika Discovery Gagal total, kita jangan percaya Cache.
        // Namun kita beri kesempatan jika ini masalah koneksi sementara.
        // Jika user di Admin, kita tetap tampilkan UI tapi tandai tidak sehat.
        if (window.EzyApi.role === 'Admin') {
            handleDiscoveryFailure();
        }
        // Ensure URLs are set even if config fails so sendDataToGoogle has a base
        applyRoleUrl({});
    } finally {
        window.EzyApi.isReady = true;
        window.dispatchEvent(new CustomEvent('ezy-api-ready', { detail: window.EzyApi }));
    }
}

function forceSetupMode() {
    // PROTEKSI: Jangan mengganggu jika user sudah berada di halaman setup
    if (window.location.hash === '#setup' || window.location.hash === '#!setup') return;

    console.warn('Force Setup Mode triggered...');
    localStorage.removeItem('EzypartsConfig');
    localStorage.removeItem('Ezyparts_Config_Cache');
    if (window.app) {
        window.app.dbHealthy = false;
        window.app.dbStatusChecked = true;
    }
    window.location.hash = '#setup';
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
    const role = window.EzyApi.role;
    const DISCOVERY_URL = getGatewayUrl();

    // CRITICAL FIX: Always use adminUrl if available, even if isSetup is false
    // This ensures POST requests (SignIn, etc.) go to the correct Apps Script URL
    let targetUrl;
    if (role === 'Admin') {
        targetUrl = config.adminUrl || config.publicUrl || DISCOVERY_URL;
    } else {
        targetUrl = config.publicUrl || config.adminUrl || DISCOVERY_URL;
    }

    // FINAL GUARD: Never let it be empty/relative
    const finalUrl = (targetUrl && targetUrl.startsWith('http')) ? targetUrl.trim() : DISCOVERY_URL;

    window.EzyApi.url = finalUrl;
    window.EzyApi.gatewayUrl = DISCOVERY_URL; // NEW: Explicitly expose Gateway
    window.appsScriptUrl = finalUrl;

    if (window.app) {
        // Validation: For Public, we also need siteKey to be healthy
        const isDbValid = config.isSetup !== false;
        const hasSiteKey = role === 'Public' ? !!config.siteKey : true;

        window.app.dbHealthy = isDbValid && hasSiteKey;
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

    const postActions = [
        'SignInUser', 'registerUser', 'SignOut',
        'saveEvent', 'updateProfile', 'createProfile',
        'updateCoreProfile', 'updatePublicProfile', 'updateProfilePhoto',
        'uploadImageAndGetUrl', 'setupUserDatabase',
        'save_plugin', 'remove_plugin', 'ping_plugin',
        'dbCreate', 'dbUpdate', 'dbDelete', // Add generic DB actions for POST
        'createEvent', 'updateEvent', 'deleteEvent', // Add Calendar specific actions
        'saveAiConfig', 'askAi', 'createAiRule', 'updateAiRule', 'deleteAiRule' // AI Assistant Actions
    ];

    if (postActions.includes(action)) {
        // Use JSON body for POST to ensure reliability with large payloads
        // INJECT gatewayUrl to POSTs automatically to help Admin project self-correct its proxy
        const payload = {
            action,
            ...data,
            gatewayUrl: window.EzyApi.gatewayUrl
        };

        fetch(customUrl || window.EzyApi.url, {
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
