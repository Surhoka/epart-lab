window.setupData = function () {
    return {
        // State Properties
        role: window.EZY_ROLE || 'Admin', // Read from template or default to Admin
        dbSetup: 'auto',
        webappUrl: '',            // User's own WebApp URL
        adminWebAppUrl: '',       // For Public: Admin URL to connect to
        email: '',
        dbName: '',
        siteKey: '',
        sheetId: '',
        hasExistingConfig: false,
        setupMode: 'new',
        originalConfig: {},
        isDetecting: false,
        statusNote: 'no_database',
        allowReset: false,
        isCancelling: false,


        // Compatibility Getters (Prevents ReferenceError if HTML is cached)
        isAdmin: (window.EZY_ROLE || 'Admin') === 'Admin',
        isPublic: window.EZY_ROLE === 'Public',

        // Polling Status Properties
        setupStatus: 'IDLE', // Enum: 'IDLE', 'IN_PROGRESS', 'COMPLETED', 'ERROR'
        statusMessage: '',
        errorMessage: '',
        statusInterval: null,
        setupTimeout: null,

        get downloadUrl() {
            // Gunakan gatewayUrl dari CONFIG jika tersedia (Unified Gateway)
            const gatewayUrl = (typeof CONFIG !== 'undefined' && CONFIG.WEBAPP_URL_DEV)
                ? CONFIG.WEBAPP_URL_DEV
                : 'https://script.google.com/macros/s/AKfycbxjGefXAeRo2pr-pgLCMohxV4l9GOKrUwfjFmTJdJBaBQijvHdJxgroPIl7dubFLt1T/exec';
            return `${gatewayUrl}?action=download_public_template&adminUrl=${encodeURIComponent(this.webappUrl)}&siteKey=${this.siteKey}&dbName=${encodeURIComponent(this.dbName)}`;
        },

        init() {
            console.log('Setup initialized with role:', this.role);
            try {
                // 1. Try URL parameters first (high priority for cross-browser sync)
                const getParam = (p) => {
                    const sp = new URLSearchParams(window.location.search);
                    if (sp.get(p)) return sp.get(p);
                    if (window.location.hash.includes('?')) {
                        const hp = new URLSearchParams(window.location.hash.split('?')[1]);
                        return hp.get(p);
                    }
                    return null;
                };

                const urlFromParam = getParam('url') || getParam('userWebAppUrl');
                if (urlFromParam) {
                    this.webappUrl = urlFromParam.trim();
                }

                const saved = localStorage.getItem('EzypartsConfig');
                if (saved) {
                    const config = JSON.parse(saved);
                    if (!this.webappUrl) this.webappUrl = config.webappUrl || '';
                    this.email = config.email || '';
                    this.siteKey = config.siteKey || '';
                    // Don't override role from localStorage - use template setting
                    if (this.role === 'Public' && config.adminWebAppUrl) {
                        this.adminWebAppUrl = config.adminWebAppUrl;
                    }
                }

                // If we have a URL (from params or cache), trigger detection
                if (this.webappUrl) {
                    this.detectConfig();
                    this.updateBrowserUrl();
                }


            } catch (e) {
                console.error('Error parsing config:', e);
            }
        },

        updateBrowserUrl() {
            if (!this.webappUrl || !this.webappUrl.includes('script.google.com')) return;
            const currentHash = window.location.hash.split('?')[0] || '#setup';
            const newHash = `${currentHash}?url=${encodeURIComponent(this.webappUrl)}`;
            if (window.location.hash !== newHash) {
                // Use replaceState to avoid triggering hashchange/navigation loops
                const newUrl = window.location.pathname + window.location.search + newHash;
                window.history.replaceState(null, '', newUrl);
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

                if (data && (data.status === 'success' || data.isSetup === false || data.statusNote === 'no_config')) {
                    console.log('DETECTION RESULT:', data); // DEBUG

                    // Check if DB is healthy/active
                    if (data.isSetup === true || data.statusNote === 'active') {
                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl,
                            email: data.email || '',
                            role: this.role || 'Admin',
                            dbName: data.dbName || '',
                            sheetId: data.dbId || '',
                            siteKey: data.siteKey || ''
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

                    // Normalize 'no_config' to 'no_database' for UI consistency
                    this.statusNote = (data.statusNote === 'no_config') ? 'no_database' : (data.statusNote || 'no_database');
                    this.siteKey = data.siteKey || '';

                    if (this.statusNote === 'legacy' || this.statusNote === 'setup_in_progress') {
                        this.originalConfig = { dbName: data.dbName, sheetId: data.dbId };
                        this.hasExistingConfig = true;
                        this.setupMode = 'reuse';
                        this.dbName = data.dbName || '';

                        // Autostart polling if server reports progress
                        if (this.statusNote === 'setup_in_progress') {
                            this.setupStatus = 'IN_PROGRESS';
                            this.isDetecting = true;
                            this.statusMessage = 'Setup sedang dikerjakan server...';

                            if (this.statusInterval) clearInterval(this.statusInterval);
                            setTimeout(() => {
                                this.checkStatus();
                                this.statusInterval = setInterval(() => this.checkStatus(), 3000);
                            }, 500);
                        }
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
                // Stop detecting ONLY if we are NOT in active setup or success
                const isBusy = (this.setupStatus === 'IN_PROGRESS') || (this.statusNote === 'setup_in_progress');
                const isDone = (this.setupStatus === 'COMPLETED') || (this.statusNote === 'active');

                if (!isBusy && !isDone) {
                    this.isDetecting = false;
                    this.setupStatus = 'IDLE';
                }
            }
        },

        async submitForm() {
            // Validate based on role
            if (this.role === 'Admin') {
                if (!this.webappUrl) {
                    alert('WebApp URL is required');
                    return;
                }
                if (!this.dbName) {
                    alert('Nama Database wajib diisi untuk instalasi baru');
                    return;
                }
            } else if (this.role === 'Public') {
                if (!this.adminWebAppUrl) {
                    alert('Admin WebApp URL is required for connection');
                    return;
                }
            }

            this.isDetecting = true;
            this.setupStatus = 'IN_PROGRESS';
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
                if (this.role === 'Admin') {
                    // ADMIN: Create new database via user's WebApp
                    this.statusMessage = 'Creating database... Please wait.';
                    const baseUrl = this.webappUrl.split('?')[0];

                    if (window.app && window.app.fetchJsonp) {
                        window.app.fetchJsonp(baseUrl, {
                            action: 'setup',
                            role: 'Admin',
                            url: this.webappUrl,
                            email: this.email,
                            dbSetup: this.setupMode === 'new' ? 'force_new' : this.dbSetup,
                            dbName: this.dbName,
                            sheetId: this.sheetId
                        });

                        // Start polling for Admin setup
                        setTimeout(() => {
                            this.checkStatus();
                            this.statusInterval = setInterval(() => this.checkStatus(), 3000);
                        }, 500);
                    } else {
                        throw new Error('App core not ready');
                    }

                } else if (this.role === 'Public') {
                    // PUBLIC: Connect to existing Admin database
                    this.statusMessage = 'Connecting to Admin database...';
                    const adminUrl = this.adminWebAppUrl.split('?')[0];

                    // Verify Admin has valid DB
                    const data = await window.app.fetchJsonp(adminUrl, { action: 'get_config' });

                    if (data && data.status === 'success' && data.isSetup) {
                        // Admin exists and has DB - save connection info
                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl || adminUrl, // Own URL or use Admin's
                            adminWebAppUrl: adminUrl,
                            email: data.email || '',
                            role: 'Public',
                            dbName: data.dbName || '',
                            sheetId: data.dbId || '',
                            siteKey: data.siteKey || ''
                        }));

                        this.setupStatus = 'COMPLETED';
                        this.statusMessage = 'Connected to Admin database successfully!';
                        this.isDetecting = false;
                        clearTimeout(this.setupTimeout);

                        window.showToast(this.statusMessage, 'success', 3000);
                        setTimeout(() => {
                            window.location.hash = '#home';
                            window.location.reload();
                        }, 1500);
                    } else {
                        throw new Error(data?.statusNote === 'no_database'
                            ? 'Admin has not setup their database yet'
                            : 'Could not connect to Admin: ' + (data?.message || 'Unknown error'));
                    }
                }

            } catch (e) {
                this.isDetecting = false;
                this.setupStatus = 'ERROR';
                this.errorMessage = 'Error: ' + e.message;
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

                        // Custom message as requested - Do not auto-redirect
                        this.statusMessage = 'Setup sukses dan Database berhasil dibuat!';
                        this.siteKey = data.siteKey || '';

                        // Sync to LocalStorage immediately
                        if (this.setupMode === 'new') localStorage.clear();
                        else localStorage.removeItem('Ezyparts_Config_Cache');

                        localStorage.setItem('EzypartsConfig', JSON.stringify({
                            webappUrl: this.webappUrl,
                            email: this.email,
                            role: this.role,
                            dbName: this.dbName,
                            sheetId: data.dbId || this.sheetId,
                            siteKey: this.siteKey
                        }));

                        window.showToast(this.statusMessage, 'success', 5000);
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
        },
async cancelSetup() {
  if (!confirm('Apakah Anda yakin ingin mereset setup?')) return;
  this.isCancelling = true;
  this.statusMessage = 'Membatalkan setup...';

  try {
    const baseUrl = this.webappUrl.split('?')[0];
    const res = await window.app.fetchJsonp(baseUrl, { action: 'reset_setup_status' });

    if (res && res.status === 'success') {
      window.showToast('Setup berhasil dibatalkan.', 'info');
    } else {
      window.showToast('Reset lokal dipaksa.', 'warning');
    }

    // Hentikan polling
    if (this.statusInterval) clearInterval(this.statusInterval);
    if (this.setupTimeout) clearTimeout(this.setupTimeout);

    // 👉 Reset state lokal agar input terbuka
    this.setupStatus = 'IDLE';
    this.isDetecting = false;
    this.statusNote = null;
    this.statusMessage = 'Setup dibatalkan.';
    this.allowReset = true;
  } catch (e) {
    console.error('Cancel failed:', e);
    this.setupStatus = 'IDLE';
    this.isDetecting = false;
    this.allowReset = true;
    window.showToast('Reset lokal dipaksa.', 'warning');
  } finally {
    this.isCancelling = false;
  }
},
        finishSetup() {
            window.location.hash = '#signup';
            window.location.reload();
        }
    };
};
console.log("setup.js loaded successfully");
