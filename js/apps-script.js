/**
 * EZYPARTS CLIENT BRIDGE - v2.3.3 (Blogger-Optimized & Robust Discovery)
 * Melayani Admin dan Publik dengan satu script yang terhubung ke config.js
 * Perbaikan: Menambahkan .trim() pada URL dan penanganan parameter URL yang lebih baik.
 */

// Helper untuk mendapatkan Gateway URL dari config.js
const getGatewayUrl = () => {
    if (typeof getWebAppUrl === 'function') {
        const url = getWebAppUrl();
        return url ? url.trim() : '';
    }
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
    const cacheKey = 'Ezyparts_Config_Cache';
    let DISCOVERY_URL = getGatewayUrl();

    // 1. Cek cache di localStorage untuk kecepatan awal
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const config = JSON.parse(cached);
            window.EzyApi.config = config;
            applyRoleUrl(config);
        } catch (e) { }
    }

    if (!DISCOVERY_URL) {
        console.warn('Ezyparts Discovery: Gateway URL not found yet.');
        return;
    }

    // 2. Selalu validasi/update dari Server (Background Discovery via JSONP untuk bypass CORS)
    try {
        const cbName = 'ezy_discovery_' + Date.now();
        const script = document.createElement('script');

        // Memastikan penambahan parameter action tidak merusak struktur URL (mendukung URL dengan atau tanpa ?)
        const separator = DISCOVERY_URL.includes('?') ? '&' : '?';
        script.src = `${DISCOVERY_URL}${separator}action=get_config&callback=${cbName}`;

        // Buat Promise untuk menunggu hasil JSONP
        const config = await new Promise((resolve, reject) => {
            window[cbName] = (res) => {
                delete window[cbName];
                script.remove();
                resolve(res);
            };
            script.onerror = () => reject(new Error('Discovery script load failed from: ' + script.src));

            // GUNAKAN HEAD: Karena body mungkin belum ada saat script ini jalan di <head>
            (document.head || document.documentElement).appendChild(script);

            // Timeout 10 detik
            setTimeout(() => reject(new Error('Discovery timeout')), 10000);
        });

        if (config && config.status === 'success') {
            window.EzyApi.config = config;

            // SECURITY: Jika database tidak valid, hapus cache agar frontend terpaksa re-setup
            if (config.isSetup === false) {
                console.warn('Backend reporting Invalid Database. Clearing Cache.');
                localStorage.removeItem(cacheKey);
                localStorage.removeItem('EzypartsConfig');
            } else {
                localStorage.setItem(cacheKey, JSON.stringify(config));
            }

            applyRoleUrl(config);
        }
    } catch (e) {
        console.warn('Discovery fetch failed, using fallback:', e);
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

    window.EzyApi.url = (targetUrl ? targetUrl.trim() : '') || DISCOVERY_URL;
    window.appsScriptUrl = window.EzyApi.url; // Kompatibilitas ke kode lama

    // Sinkronisasi status kesehatan ke aplikasi utama jika sudah login
    if (window.app) {
        window.app.dbHealthy = config.isSetup !== false;
    }

    console.log(`[EzyApi] ${role} Mode Active:`, window.EzyApi.url);
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
        'saveEvent', 'updateProfile', 'setupUserDatabase'
    ];

    if (postActions.includes(action)) {
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
        // Penanganan URL agar tidak duplikasi tanda tanya
        const baseUrl = window.EzyApi.url;
        const separator = baseUrl.includes('?') ? '&' : '?';
        script.src = `${baseUrl}${separator}${query}`;
        (document.head || document.documentElement).appendChild(script);
    }
};
