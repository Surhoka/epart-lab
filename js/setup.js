/**
 * Setup Page Initialization
 */
window.initSetupPage = function () {
    console.log('Setup page initialized');
};

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
        detectError: '',

        init() {
            const saved = localStorage.getItem('EzypartsConfig');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    this.webappUrl = config.webappUrl || '';
                    this.publicWebappUrl = config.publicWebappUrl || '';
                    this.role = config.role || 'Public';
                    this.email = config.email || '';
                    this.dbSetup = config.dbSetup || 'auto';
                    this.dbName = config.dbName || '';
                    this.sheetId = config.sheetId || '';

                    if (this.sheetId) {
                        this.hasExistingConfig = true;
                        this.setupMode = 'existing';
                        this.originalConfig = { dbName: this.dbName, sheetId: this.sheetId, webappUrl: this.webappUrl };
                    }
                } catch (e) { console.error('Config load error', e); }
            }
        },

        async detectConfig() {
            if (!this.webappUrl || !this.webappUrl.startsWith('http')) {
                alert('Please enter a valid WebApp URL first.');
                return;
            }
            this.isDetecting = true;
            this.detectError = '';
            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const response = await fetch(`${baseUrl}?action=check`);
                const data = await response.json();

                if (data.status === 'success') {
                    if (data.email) this.email = data.email;
                    if (data.publicWebappUrl) this.publicWebappUrl = data.publicWebappUrl;

                    if (data.sheetId) {
                        this.sheetId = data.sheetId;
                        this.dbName = data.dbName;
                        this.hasExistingConfig = true;
                        this.setupMode = 'existing';
                        this.originalConfig = { dbName: data.dbName, sheetId: data.sheetId, webappUrl: this.webappUrl };
                        alert('Existing configuration detected and loaded!');
                    } else if (data.email || data.publicWebappUrl) {
                        alert('Script connected! Settings found, but no database linked.');
                    } else {
                        alert('Connected to script, but no previous configuration found.');
                    }
                } else {
                    alert('Could not retrieve configuration.');
                }
            } catch (e) {
                console.error('Detection error', e);
                alert('Connection failed. Check URL and access settings.');
            } finally {
                this.isDetecting = false;
            }
        },

        async submitForm() {
            if (!this.webappUrl) {
                alert('Please enter a WebApp URL.');
                return;
            }
            const tokenInput = document.getElementById('token');
            if (this.role === 'Admin' && (!tokenInput || !tokenInput.value)) {
                alert('Please enter a token for Admin role.');
                return;
            }

            this.isDetecting = true;
            const token = tokenInput ? tokenInput.value : '';
            const params = new URLSearchParams({
                role: this.role,
                url: this.webappUrl,
                token: token,
                email: this.email,
                publicWebappUrl: this.publicWebappUrl,
                dbSetup: this.dbSetup,
                dbName: this.dbName,
                sheetId: this.sheetId
            });

            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const response = await fetch(`${baseUrl}?${params.toString()}`);
                const data = await response.json();
                if (data.status === 'success') {
                    localStorage.setItem('EzypartsConfig', JSON.stringify(data));
                    alert('Configuration saved successfully!');
                    window.location.hash = '#dashboard';
                } else {
                    alert('Error: ' + (data.message || 'Saving failed.'));
                }
            } catch (e) {
                console.error('Submit error', e);
                alert('An error occurred during submission.');
            } finally {
                this.isDetecting = false;
            }
        }
    };
};
