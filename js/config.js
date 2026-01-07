const CONFIG = {
    WEBAPP_URL_DEV: 'https://script.google.com/macros/s/AKfycbzIvXCXjhn7ESUsjVlnl8WTDHoIafqd5HHWC5zk_xS_CU-nrudLZtmyqJ9_RJf5_H4F/exec',//setup.gs URL
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
    if (typeof CONFIG !== 'undefined' && CONFIG.WEBAPP_URL_DEV) {
        return CONFIG.WEBAPP_URL_DEV;
    }
    return '';
}

function getDatabaseConfig() {
    const config = getConfig();
    return config ? {
        dbName: config.dbName || '',
        sheetId: config.sheetId || '',
        dbSetup: config.dbSetup || 'auto'
    } : null;
}
