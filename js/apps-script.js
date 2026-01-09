/**
 * EZYPARTS CLIENT BRIDGE - v2.3.4 (Self-Healing Discovery)
 * Melayani Admin dan Publik dengan satu script yang terhubung ke config.js
 * Perbaikan: Mendukung Self-Healing jika URL di cache rusak/lama.
 */

// Helper untuk mendapatkan Gateway URL (Gunakan window check untuk mencegah redeklarasi error)
if (typeof window.getGatewayUrl === 'undefined') {
    window.getGatewayUrl = () => {
        if (typeof getWebAppUrl === 'function') {
            const url = getWebAppUrl(); // Mencoba LocalStorage lalu Hardcoded
            return url ? url.trim() : '';
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
        script.src = `${targetUrl}${separator}action=get_config&callback=${cbName}`;

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
            setTimeout(() => { script.remove(); reject(new Error('Timeout')); }, 8000);
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

        if (config && config.status === 'success') {
            window.EzyApi.config = config;

            // SECURITY CHECK: Jika DB tidak valid, paksa re-setup
            // EXCEPTION: Jangan reset jika statusNote='setup_in_progress' atau 'legacy'
            if (config.isSetup === false && config.statusNote !== 'setup_in_progress' && config.statusNote !== 'legacy') {
                console.error('SERVER REPORT: Database missing. Clearing config.');
                forceSetupMode();
            } else {
                localStorage.setItem(cacheKey, JSON.stringify(config));
                applyRoleUrl(config);
            }
        } else {
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
    const role = window.EzyApi.role;
    const DISCOVERY_URL = getGatewayUrl();

    const targetUrl = (role === 'Admin') ?
        (config.adminUrl || config.publicUrl) :
        (config.publicUrl || config.adminUrl);

    window.EzyApi.url = (targetUrl ? targetUrl.trim() : '') || DISCOVERY_URL;
    window.appsScriptUrl = window.EzyApi.url;

    if (window.app) {
        window.app.dbHealthy = config.isSetup !== false;
        window.app.dbStatusChecked = true;
    }
}

// Jalankan Discovery
discoverEzyApi();

/**
 * Universal Data Sender (POST/GET)
 */
window.sendDataToGoogle = function (action, data, callback, errorHandler) {
    if (!window.EzyApi.isReady) {
        setTimeout(() => window.sendDataToGoogle(action, data, callback, errorHandler), 300);
        return;
    }

    const postActions = [
        'SignInUser', 'registerUser', 'SignOut',
        'saveEvent', 'updateProfile', 'createProfile',
        'updateProfilePhoto', 'uploadImageAndGetUrl', 'setupUserDatabase'
    ];

    if (postActions.includes(action)) {
        // Use JSON body for POST to ensure reliability with large payloads
        fetch(window.EzyApi.url, {
            method: 'POST',
            body: JSON.stringify({ action, ...data })
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

        const query = new URLSearchParams({ action, callback: cbName, ...data }).toString();
        const script = document.createElement('script');
        script.id = cbName;
        const baseUrl = window.EzyApi.url;
        const separator = baseUrl.includes('?') ? '&' : '?';
        script.src = `${baseUrl}${separator}${query}`;
        (document.head || document.documentElement).appendChild(script);
    }
};
