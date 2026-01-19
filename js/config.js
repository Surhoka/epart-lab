const CONFIG = {
    WEBAPP_URL_DEV: 'https://script.google.com/macros/s/AKfycbxjGefXAeRo2pr-pgLCMohxV4l9GOKrUwfjFmTJdJBaBQijvHdJxgroPIl7dubFLt1T/exec',//setup.gs URL
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
    if (config && config.webappUrl && config.webappUrl.startsWith('http')) {
        return config.webappUrl;
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
