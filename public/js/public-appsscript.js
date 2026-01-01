/**
 * Public Apps Script Interface
 * Handles communication with the Public API endpoint
 */

// API Configuration (Set in Blogger Template)
// window.publicAppsScriptUrl = "...";

/**
 * Send data to the public Google Apps Script endpoint
 * @param {string} action - The action to perform
 * @param {object} data - The data payload
 * @param {function} callback - Success callback
 * @param {function} errorHandler - Error callback
 */
window.sendToPublicApi = function (action, data, callback, errorHandler) {
    if (!window.publicAppsScriptUrl && action !== 'checkSetup' && action !== 'saveConfig') {
        console.warn('publicAppsScriptUrl is not set. API calls will fail.');
        return;
    }

    // Public side mostly uses GET (JSONP) for simplicity and speed
    const callbackName = 'public_jsonp_' + Math.round(100000 * Math.random());

    window[callbackName] = function (response) {
        delete window[callbackName];
        const scriptElement = document.getElementById(callbackName);
        if (scriptElement) scriptElement.remove();

        if (response && response.status === 'success') {
            if (callback) callback(response);
        } else {
            console.error('API Error:', response?.message || 'Unknown error');

            // DETEKSI KRITIS: Jika database hilang/dihapus
            if (response?.message && response.message.includes('Public database not found')) {
                console.warn('CRITICAL: Database missing. Forcing setup mode (Seamless).');

                // 1. Hapus status setup di storage
                localStorage.removeItem('isSetup');

                // 2. Transisi Mulus via Alpine.js
                if (window.app) {
                    // Alpine akan otomatis merespon perubahan ini (DOM Update)
                    window.app.isSetup = false;

                    // Pindah ke halaman setup secara internal
                    if (window.app.page !== 'setup') {
                        window.navigate('setup');
                    }
                }
            }

            if (errorHandler) errorHandler(response);
        }
    };

    let baseUrl = data.appUrl || window.publicAppsScriptUrl;
    if (!baseUrl && (action === 'checkSetup' || action === 'saveConfig')) {
        // Silently fail if no URL and doing setup
        return;
    }

    let url = baseUrl + `?action=${action}&callback=${callbackName}`;
    for (const key in data) {
        url += `&${key}=${encodeURIComponent(data[key])}`;
    }

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = url;
    script.onerror = function () {
        console.error('Public API Connection Failed');
        delete window[callbackName];
        script.remove();
        if (errorHandler) errorHandler({ status: 'error', message: 'Connection failed' });
    };
    document.body.appendChild(script);
};

/**
 * Specific function to fetch branding data
 */
window.fetchBranding = function () {
    window.sendToPublicApi('getProfile', {}, (response) => {
        if (response.data && response.data.publicDisplay) {
            const branding = {
                phone: response.data.publicDisplay.supportPhone,
                email: response.data.publicDisplay.supportEmail,
                address: response.data.publicDisplay.storeAddress,
                operatingHours: {
                    weekdays: response.data.publicDisplay.operatingHours,
                    days: response.data.publicDisplay.operatingDays
                },
                socials: {
                    facebook: response.data.publicDisplay.facebook,
                    twitter: response.data.publicDisplay.twitter,
                    instagram: response.data.publicDisplay.instagram,
                    linkedin: response.data.publicDisplay.linkedin
                }
            };

            // Save to local storage for persistence
            localStorage.setItem('publicBrandingData', JSON.stringify(branding));

            // Notify app to update branding if it's already running
            if (window.app && typeof window.app.applyBranding === 'function') {
                window.app.applyBranding(branding);
            }
        }
    });
};
