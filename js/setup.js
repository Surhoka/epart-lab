window.setupData = function () {
    return {
        // State Properties
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

        // Polling Status Properties
        setupStatus: 'IDLE', // Enum: 'IDLE', 'IN_PROGRESS', 'COMPLETED', 'ERROR'
        statusMessage: '',
        errorMessage: '',
        statusInterval: null,
        setupTimeout: null,

        init() {
            try {
                const saved = localStorage.getItem('EzypartsConfig');
                if (saved) {
                    const config = JSON.parse(saved);
                    this.webappUrl = config.webappUrl || '';
                    this.email = config.email || '';
                    this.role = config.role || 'Admin';
                }
            } catch (e) {
                console.error('Error parsing config:', e);
            }
        },

        async detectConfig() {
            if (!this.webappUrl || !this.webappUrl.includes('script.google.com')) {
                return;
            }
            this.isDetecting = true;
            this.statusNote = null;
            let data = null;

            try {
                const baseUrl = this.webappUrl.split('?')[0];
                if (window.app && window.app.fetchJsonp) {
                    data = await window.app.fetchJsonp(baseUrl, { action: 'get_config' });
                } else {
                    throw new Error('App core not initialized');
                }

                if (data && data.status === 'success') {
                    // Check if DB is healthy/active
                    if (data.isSetup === true || data.statusNote === 'active') {
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
                    const msg = data ? (data.message || 'Unknown response') : 'No data received';
                    alert('Server error: ' + msg);
                    this.statusNote = 'no_database';
                }
            } catch (e) {
                alert('Detection Error: ' + e.message);
                this.statusNote = 'no_database';
            } finally {
                // Only stop detecting if we didn't succeed and redirect
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

            if (this.statusInterval) clearInterval(this.statusInterval);
            if (this.setupTimeout) clearTimeout(this.setupTimeout);

            // Timeout after 2 minutes
            this.setupTimeout = setTimeout(() => {
                clearInterval(this.statusInterval);
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Setup timed out. Check Web App URL and deployment settings.';
            }, 120000);

            try {
                const baseUrl = this.webappUrl.split('?')[0];

                if (window.app && window.app.fetchJsonp) {
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
                        this.checkStatus();
                        this.statusInterval = setInterval(() => this.checkStatus(), 3000);
                    }, 500);
                } else {
                    throw new Error('App core not ready');
                }

            } catch (e) {
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Client error: ' + e.message;
                if (this.statusInterval) clearInterval(this.statusInterval);
                if (this.setupTimeout) clearTimeout(this.setupTimeout);
            }
        },

        async checkStatus() {
            if (this.setupStatus === 'COMPLETED' || this.setupStatus === 'ERROR') {
                if (this.statusInterval) clearInterval(this.statusInterval);
                if (this.setupTimeout) clearTimeout(this.setupTimeout);
                return;
            }

            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const data = await window.app.fetchJsonp(baseUrl, { action: 'get_setup_status' });
                console.log('POLLING RESPONSE:', data); // DEBUG LOG

                this.setupStatus = data.setupStatus || 'UNKNOWN';

                switch (this.setupStatus) {
                    case 'IN_PROGRESS':
                        this.statusMessage = data.statusMessage || 'Setup in progress...';
                        break;
                    case 'COMPLETED':
                        this.isDetecting = false;
                        clearInterval(this.statusInterval);
                        clearTimeout(this.setupTimeout);
                    case 'COMPLETED':
                        this.isDetecting = false;
                        clearInterval(this.statusInterval);
                        clearTimeout(this.setupTimeout);

                        // Custom message as requested
                        this.statusMessage = 'Setup sukses dan Database berhasil dibuat!';

                        if (this.setupMode === 'new') localStorage.clear();
                        else localStorage.removeItem('Ezyparts_Config_Cache');

                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl,
                            email: this.email,
                            role: this.role,
                            dbName: this.dbName,
                            sheetId: data.dbId || this.sheetId
                        }));

                        window.showToast(this.statusMessage, 'success', 5000);

                        // Increase delay slightly to let user read the toast
                        setTimeout(() => {
                            window.location.hash = '#signup';
                            window.location.reload();
                        }, 2000);
                        break;
                    case 'ERROR':
                        this.isDetecting = false;
                        clearInterval(this.statusInterval);
                        clearTimeout(this.setupTimeout);
                        this.errorMessage = data.errorMessage || 'Unknown server error';
                        this.statusMessage = 'Setup failed.';
                        break;
                    case 'IDLE':
                        this.statusMessage = 'Waiting for server...';
                        break;
                    default: // Handles 'UNKNOWN' or any other status
                        this.statusMessage = data.message || 'Status Unknown: ' + this.setupStatus;
                        if (data.errorMessage) this.errorMessage = data.errorMessage;
                        break;
                }
            } catch (e) {
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Status check failed: ' + e.message;
                clearInterval(this.statusInterval);
                clearTimeout(this.setupTimeout);
            }
        }
    };
};
console.log("setup.js loaded successfully");
