const CONFIG = {
    WEBAPP_URL_DEV: 'https://script.google.com/macros/s/AKfycbxiwRjJV1b3y6tNQ5t8qytIDsyTVBzS4GVocemtCVenVfftKyO4atT81PDQjncr5OWR/exec',//setup.gs URL
    // Add other environments like PROD if needed
    // WEBAPP_URL_PROD: 'https://script.google.com/macros/s/YOUR_PROD_SCRIPT_ID/exec'
};

function getConfig() {
    try {
        const saved = localStorage.getItem('EzypartsConfig');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Config parse error', e);
        return null;
    }
}

function getWebAppUrl() {
    const config = getConfig();
    // Prioritize the URL saved during setup
    if (config && config.webappUrl) {
        return config.webappUrl;
    }
    // Fallback to the hardcoded dev URL only if setup hasn't been completed
    return CONFIG.WEBAPP_URL_DEV;
}

function getDatabaseConfig() {
    const config = getConfig();
    return config ? {
        dbName: config.dbName || '',
        sheetId: config.sheetId || '',
        dbSetup: config.dbSetup || 'auto'
    } : null;
}
