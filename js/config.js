const CONFIG = {
    WEBAPP_URL_DEV: 'https://script.google.com/macros/s/AKfycbzMzHmga1ChGhHstTFSrUkFdJoMO5Y0lYxlNBFXwRWvXjJ1PeSUty4GD6lBLa5rA7jV/exec',//setup.gs URL
    // Add other environments like PROD if needed
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