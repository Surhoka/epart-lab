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

        async detectConfig() {
            if (!this.webappUrl || !this.webappUrl.includes('script.google.com')) {
                alert('Please enter a valid WebApp URL.');
                return;
            }
            this.isDetecting = true;
            try {
                const baseUrl = this.webappUrl.split('?')[0];
                const response = await fetch(baseUrl + '?action=check');
                const data = await response.json();

                if (data.status === 'success') {
                    if (data.email) this.email = data.email;
                    if (data.sheetId) {
                        this.sheetId = data.sheetId;
                        this.dbName = data.dbName;
                        this.hasExistingConfig = true;
                        this.setupMode = 'existing';
                        this.originalConfig = { dbName: data.dbName, sheetId: data.sheetId };
                        alert('Configuration detected and loaded successfully!');
                    } else {
                        alert('Connected! No previous database found on this script.');
                    }
                } else {
                    alert('Server error: ' + (data.message || 'Unknown response'));
                }
            } catch (e) {
                alert('Connection failed. Please ensure your script is deployed as "Anyone".');
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
                const params = new URLSearchParams({
                    action: 'setup', // Explicit action for setup.gs
                    role: this.role,
                    url: this.webappUrl,
                    token: token,
                    email: this.email,
                    dbSetup: this.dbSetup,
                    dbName: this.dbName,
                    sheetId: this.sheetId
                });

                const response = await fetch(baseUrl + '?' + params.toString());
                const data = await response.json();

                if (data.status === 'success') {
                    localStorage.setItem('EzypartsConfig', JSON.stringify({
                        webappUrl: this.webappUrl,
                        email: this.email,
                        role: this.role,
                        dbName: this.dbName,
                        sheetId: this.sheetId
                    }));
                    alert('Setup Success! You are now connected.');
                    window.location.hash = '#dashboard';
                } else {
                    alert('Setup Error: ' + data.message);
                }
            } catch (e) {
                alert('An error occurred during verification.');
            } finally {
                this.isDetecting = false;
            }
        }
    };
};
