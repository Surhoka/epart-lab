const CONFIG = {
    WEBAPP_URL_DEV: 'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6TXpIbWdhMUNoR2hIc3RURlNyVWtGZEpvTU81WTBsWXhsTkJGWHdSV3ZYakoxUGVTVXR5NEdENmxCTGE1ckE3alYvZXhlYw==',
};

function decodeBase64(base64String) {
    try {
        return atob(base64String);
    } catch (e) {
        console.error('Gagal mendekode Base64:', e);
        return '';
    }
}

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

    return decodeBase64(CONFIG.WEBAPP_URL_DEV);
}

function getDatabaseConfig() {
    const config = getConfig();
    return config ? {

        dbName: config.dbName || '',
        sheetId: config.sheetId || '',
        dbSetup: config.dbSetup || 'auto'
    } : null;
}