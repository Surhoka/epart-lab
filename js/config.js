const CONFIG = {
    WEBAPP_URL_DEV: 'https://script.google.com/macros/s/AKfycbxiwRjJV1b3y6tNQ5t8qytIDsyTVBzS4GVocemtCVenVfftKyO4atT81PDQjncr5OWR/exec',
    // Add other environments like PROD if needed
    // WEBAPP_URL_PROD: 'https://script.google.com/macros/s/YOUR_PROD_SCRIPT_ID/exec'
};

function getWebAppUrl() {
    const config = JSON.parse(localStorage.getItem('EzypartsConfig'));
    if (config && config.url) {
        return config.url;
    }
    // Fallback to dev URL if nothing is stored
    return CONFIG.WEBAPP_URL_DEV;
}
