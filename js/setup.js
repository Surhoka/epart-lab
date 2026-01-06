/**
 * Alpine.js Data for Setup Page
 */
window.setupData = function () {
    return {
        role: 'Public',
        dbSetup: 'auto',
        webappUrl: '',
        email: '',
        publicWebappUrl: '',
        dbName: '',
        sheetId: '',
        hasExistingConfig: false,
        setupMode: 'new',
        originalConfig: {},
        isDetecting: false,

        init() {
            const saved = localStorage.getItem('EzypartsConfig');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    this.webappUrl = config.webappUrl || '';
                    this.email = config.email || '';
                    this.role = config.role || 'Public';
                } catch (e) { }
            }
        },

        // Helper Internal untuk JSONP
        async fetchJsonp(url, params = {}) {
            const cbName = 'setup_cb_' + Date.now();
            const query = new URLSearchParams(params);
            query.set('callback', cbName);
            const script = document.createElement('script');
            script.src = `${url}${url.includes('?') ? '&' : '?'}${query.toString()}`;

            return new Promise((resolve, reject) => {
                window[cbName] = (res) => {
                    delete window[cbName];
                    script.remove();
                    resolve(res);
                };
                script.onerror = () => {
                    script.remove();
                    reject(new Error('Network Error: Verify WebApp URL is correct and script is deployed as "Anyone".'));
                };
                (document.head || document.documentElement).appendChild(script);
                // Increase timeout to 90s for DB creation
                setTimeout(() => {
                    if (window[cbName]) {
                        delete window[cbName];
                        script.remove();
                        reject(new Error('Connection Timeout: The server took too long to respond.'));
                    }
                }, 90000);
            });
        },

        async detectConfig() {
            if (!this.webappUrl || !this.webappUrl.includes('script.google.com')) {
                alert('Please enter a valid WebApp URL.');
                return;
            }
            this.isDetecting = true;
            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const data = await this.fetchJsonp(baseUrl, { action: 'get_config' });

                if (data.status === 'success') {
                    if (data.email) this.email = data.email;
                    if (data.dbId) {
                        this.sheetId = data.dbId;
                        this.dbName = data.dbName || 'Ezyparts Database';
                        this.hasExistingConfig = true;
                        this.setupMode = 'existing';
                        this.originalConfig = { dbName: this.dbName, sheetId: data.dbId };
                        alert('Configuration detected successfully!');
                    } else {
                        alert('Connected! No previous database found on this script.');
                    }
                } else {
                    alert('Server error: ' + (data.message || 'Unknown response'));
                }
            } catch (e) {
                alert('Detection Error: ' + e.message);
                console.error(e);
            } finally {
                this.isDetecting = false;
            }
        },

        async submitForm() {
            if (!this.webappUrl) { alert('WebApp URL is required'); return; }
            this.isDetecting = true;
            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const token = document.getElementById('token')?.value || '';

                const data = await this.fetchJsonp(baseUrl, {
                    action: 'setup',
                    role: this.role,
                    url: this.webappUrl,
                    token: token,
                    email: this.email,
                    dbSetup: this.dbSetup,
                    dbName: this.dbName,
                    sheetId: this.sheetId
                });

                if (data.status === 'success') {
                    // If this is a new setup/reset, clear all old data first.
                    if (this.setupMode === 'new') {
                        localStorage.clear();
                    } else {
                        // For existing setups, just clear the cache to force a refresh.
                        localStorage.removeItem('Ezyparts_Config_Cache');
                    }

                    localStorage.setItem('EzypartsConfig', JSON.stringify({
                        webappUrl: this.webappUrl,
                        email: this.email,
                        role: this.role,
                        dbName: this.dbName,
                        sheetId: data.dbId || this.sheetId
                    }));

                    alert('Setup Success! Please create your first Admin account.');
                    window.location.hash = '#signup';
                    setTimeout(() => window.location.reload(), 500);
                } else {
                    alert('Setup Error: ' + data.message);
                }
            } catch (e) {
                alert('Setup Failed: ' + e.message);
                console.error(e);
            } finally {
                this.isDetecting = false;
            }
        }
    };
};
