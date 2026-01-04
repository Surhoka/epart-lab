/**
 * EZYPARTS CLIENT BRIDGE - v2.3.0 (Config-Linked Discovery)
 * Melayani Admin dan Publik dengan satu script yang terhubung ke config.js
 */

// Helper untuk mendapatkan Gateway URL dari config.js
const getGatewayUrl = () => {
    if (typeof getWebAppUrl === 'function') return getWebAppUrl();
    return ''; // Fallback
};

// Inisialisasi State Global
window.EzyApi = {
    url: '',
    role: window.EZY_ROLE || 'Public', // Default: Public (Bisa di-override di template)
    isReady: false,
    config: { adminUrl: '', publicUrl: '' }
};

/**
 * Mendapatkan URL API secara Global berdasarkan Role
 */
async function discoverEzyApi() {
    // 1. Cek cache di localStorage untuk kecepatan
    const cacheKey = 'Ezyparts_Config_Cache';
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        try {
            const config = JSON.parse(cached);
            window.EzyApi.config = config;
            applyRoleUrl(config);
        } catch (e) { }
    }

    const DISCOVERY_URL = getGatewayUrl();
    if (!DISCOVERY_URL) {
        console.warn('Ezyparts Discovery: Gateway URL not found yet.');
        return;
    }

    // 2. Selalu validasi/update dari Server (Background Discovery)
    try {
        const response = await fetch(DISCOVERY_URL + '?action=get_config');
        const config = await response.json();

        if (config.status === 'success') {
            window.EzyApi.config = config;
            localStorage.setItem(cacheKey, JSON.stringify(config));
            applyRoleUrl(config);
        }
    } catch (e) {
        console.warn('Discovery fetch failed, using fallback.');
        if (!window.EzyApi.url) window.EzyApi.url = DISCOVERY_URL;
    } finally {
        window.EzyApi.isReady = true;
        // Beritahu aplikasi bahwa API siap
        window.dispatchEvent(new CustomEvent('ezy-api-ready', { detail: window.EzyApi }));
    }
}

/**
 * Memilih URL yang tepat sesuai Role saat ini
 */
function applyRoleUrl(config) {
    const role = window.EzyApi.role;
    const DISCOVERY_URL = getGatewayUrl();

    // Jika role Admin, prioritaskan adminUrl. Jika Public, prioritaskan publicUrl.
    const targetUrl = (role === 'Admin') ?
        (config.adminUrl || config.publicUrl) :
        (config.publicUrl || config.adminUrl);

    window.EzyApi.url = targetUrl || DISCOVERY_URL;
    window.appsScriptUrl = window.EzyApi.url; // Kompatibilitas ke kode lama
    console.log(`[EzyApi] ${role} Mode Active:`, window.EzyApi.url);
}

// Jalankan Discovery
discoverEzyApi();

/**
 * Universal Data Sender (POST/GET)
 */
window.sendDataToGoogle = function (action, data, callback, errorHandler) {
    // Jika API belum siap, tunggu sebentar
    if (!window.EzyApi.isReady) {
        setTimeout(() => window.sendDataToGoogle(action, data, callback, errorHandler), 300);
        return;
    }

    const postActions = [
        'SignInUser', 'registerUser', 'SignOut',
        'saveEvent', 'updateProfile', 'setupUserDatabase'
    ];

    if (postActions.includes(action)) {
        // --- POST METHOD ---
        fetch(window.EzyApi.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'payload=' + encodeURIComponent(JSON.stringify({ action, ...data }))
        })
            .then(res => res.json())
            .then(callback)
            .catch(err => {
                console.error('API POST Error:', err);
                if (errorHandler) errorHandler(err);
            });
    } else {
        // --- GET METHOD (JSONP) ---
        const cbName = 'ezy_cb_' + Date.now() + Math.floor(Math.random() * 100);
        window[cbName] = function (res) {
            delete window[cbName];
            const s = document.getElementById(cbName);
            if (s) s.remove();
            if (callback) callback(res);
        };

        const query = new URLSearchParams({ action, callback: cbName, ...data }).toString();
        const script = document.createElement('script');
        script.id = cbName;
        script.src = `${window.EzyApi.url}?${query}`;
        document.body.appendChild(script);
    }
};
