/**
 * Alpine.js Data for Setup Page
 */
window.setupData = function () {
    return {
        role: 'Public',window.setupData = function () {
    return {
        // State lama
        role: 'Admin',
        dbSetup: 'auto',
        webappUrl: '',
        email: '',
        dbName: '',
        sheetId: '',
        hasExistingConfig: false,
        setupMode: 'new',
        originalConfig: {},
        isDetecting: false,
        statusNote: 'no_database',
        
        // State baru untuk status polling
        setupStatus: 'IDLE', // 'IDLE', 'IN_PROGRESS', 'COMPLETED', 'ERROR'
        statusMessage: '',
        errorMessage: '',
        statusInterval: null,
        setupTimeout: null, // Timer for the entire setup process

        init() {
            const saved = localStorage.getItem('EzypartsConfig');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    this.webappUrl = config.webappUrl || '';
                    this.email = config.email || '';
                    this.role = config.role || 'Admin';
                } catch (e) { }
            }
        },

        async detectConfig() {
            if (!this.webappUrl || !this.webappUrl.includes('script.google.com')) {
                return;
            }
            this.isDetecting = true;
            this.statusNote = null; // Reset during detection
            let data; // Declare data in the higher scope

            try {
                const baseUrl = this.webappUrl.split('?')[0];
                data = await window.app.fetchJsonp(baseUrl, { action: 'get_config' });

                if (data.status === 'success') {
                    if (data.isSetup || data.statusNote === 'active') {
                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl,
                            email: data.email || '',
                            role: this.role || 'Admin',
                            dbName: data.dbName || '',
                            sheetId: data.dbId || ''
                        }));
                        window.showToast('Existing setup found. Synchronizing...', 'success', 4000);
                        setTimeout(() => {
                            window.location.hash = '#signin';
                            window.location.reload();
                        }, 1500);
                        return;
                    }

                    if (data.email) this.email = data.email;
                    this.sheetId = data.dbId || '';
                    this.statusNote = data.statusNote || 'no_database';

                    if (this.statusNote === 'legacy') {
                        this.hasExistingConfig = true;
                        this.setupMode = 'reuse';
                        this.originalConfig = { dbName: data.dbName, sheetId: data.dbId };
                        this.dbName = data.dbName || '';
                    } else {
                        this.hasExistingConfig = false;
                        this.setupMode = 'new';
                        this.dbName = '';
                    }
                } else {
                    alert('Server error: ' + (data.message || 'Unknown response'));
                    this.statusNote = 'no_database';
                }
            } catch (e) {
                alert('Detection Error: ' + e.message);
                this.statusNote = 'no_database';
            } finally {
                if (!data || !(data.isSetup || data.statusNote === 'active')) {
                  this.isDetecting = false;
                }
            }
        },

        async submitForm() {
            if (!this.webappUrl) {
                alert('WebApp URL is required');
                return;
            }

            this.isDetecting = true;
            this.setupStatus = 'IN_PROGRESS';
            this.statusMessage = 'Sending setup request... Please wait.';
            this.errorMessage = '';

            // Clear previous timers
            if (this.statusInterval) clearInterval(this.statusInterval);
            if (this.setupTimeout) clearTimeout(this.setupTimeout);

            // Set a 2-minute timeout for the entire setup process
            this.setupTimeout = setTimeout(() => {
                clearInterval(this.statusInterval);
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Setup timed out after 2 minutes. Please check the Web App URL, ensure it\'s deployed for "Anyone", and review the Apps Script logs for any errors.';
            }, 120000); // 120 seconds = 2 minutes

            try {
                const baseUrl = this.webappUrl.split('?')[0];

                // Fire the setup request.
                window.app.fetchJsonp(baseUrl, {
                    action: 'setup',
                    role: this.role,
                    url: this.webappUrl,
                    email: this.email,
                    dbSetup: this.setupMode === 'new' ? 'force_new' : this.dbSetup,
                    dbName: this.dbName,
                    sheetId: this.sheetId
                });

                // Start polling
                setTimeout(() => {
                    this.checkStatus(); // First check
                    this.statusInterval = setInterval(() => this.checkStatus(), 3000);
                }, 500);

            } catch (e) {
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'A client-side error occurred while starting the setup: ' + e.message;
                if (this.statusInterval) clearInterval(this.statusInterval);
                if (this.setupTimeout) clearTimeout(this.setupTimeout);
            }
        },

        async checkStatus() {
            // If the process is already completed or failed, don't continue polling.
            if (this.setupStatus === 'COMPLETED' || this.setupStatus === 'ERROR') {
                if (this.statusInterval) clearInterval(this.statusInterval);
                if (this.setupTimeout) clearTimeout(this.setupTimeout);
                return;
            }

            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const data = await window.app.fetchJsonp(baseUrl, { action: 'get_setup_status' });

                this.setupStatus = data.setupStatus || 'UNKNOWN';

                switch(this.setupStatus) {
                    case 'IN_PROGRESS':
                        this.statusMessage = data.statusMessage || 'Setup in progress... Creating database and configuring...';
                        break;
                    case 'COMPLETED':
                        this.isDetecting = false;
                        clearInterval(this.statusInterval);
                        clearTimeout(this.setupTimeout);
                        this.statusMessage = 'Setup completed successfully! Redirecting...';
                        
                        if (this.setupMode === 'new') localStorage.clear();
                        else localStorage.removeItem('Ezyparts_Config_Cache');

                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl,
                            email: this.email,
                            role: this.role,
                            dbName: this.dbName,
                            sheetId: data.dbId || this.sheetId
                        }));
                        
                        window.showToast(this.statusMessage, 'success', 4000);

                        setTimeout(() => {
                            window.location.hash = '#signup';
                            window.location.reload();
                        }, 1000);
                        break;
                    case 'ERROR':
                        this.isDetecting = false;
                        clearInterval(this.statusInterval);
                        clearTimeout(this.setupTimeout);
                        this.errorMessage = data.errorMessage || 'An unknown error occurred on the server.';
                        this.statusMessage = 'Setup failed.';
                        // No alert here, let the UI show the error message.
                        break;
                    case 'IDLE':
                        this.statusMessage = 'Server is idle. Waiting for process to start...';
                        break;
                    default: // Handles 'UNKNOWN' or any other status
                            this.statusMessage = 'Receiving an unknown status from the server. Waiting...';
                            break;
                }

            } catch (e) {
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Failed to get status from server: ' + e.message;
                clearInterval(this.statusInterval);
                clearTimeout(this.setupTimeout);
            }
        }
    };
};

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
