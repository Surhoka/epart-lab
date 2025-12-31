/**
 * Setup Wizard Logic for EzyParts
 * Handles the installation flow and communication with the backend
 */

window.initSetupPage = function () {
    return {
        isSetup: localStorage.getItem('isSetup') === 'true',
        isInstalling: false,
        setupForm: {
            appUrl: window.publicAppsScriptUrl || '',
            email: '',
            dbName: 'EzyParts Private Database',
            dbType: 'automatic'
        },

        async init() {
            console.log('Setup Wizard Initialized');
            // Check if already setup on backend
            this.checkBackendStatus();
        },

        async checkBackendStatus() {
            if (!this.setupForm.appUrl) return;

            window.sendToPublicApi('checkSetup', {}, (response) => {
                if (response.data && response.data.isInstalled) {
                    this.completeSetup();
                }
            });
        },

        async installApp() {
            if (!this.setupForm.appUrl || !this.setupForm.email) {
                alert('Please fill in all required fields');
                return;
            }

            this.isInstalling = true;

            // Temporarily update the global URL for the request
            const originalUrl = window.publicAppsScriptUrl;
            window.publicAppsScriptUrl = this.setupForm.appUrl;

            window.sendToPublicApi('saveConfig', {
                appUrl: this.setupForm.appUrl,
                email: this.setupForm.email,
                dbName: this.setupForm.dbName,
                dbType: this.setupForm.dbType
            }, (response) => {
                this.isInstalling = false;
                if (response.status === 'success') {
                    this.completeSetup();
                } else {
                    alert('Installation failed: ' + response.message);
                    window.publicAppsScriptUrl = originalUrl;
                }
            }, (error) => {
                this.isInstalling = false;
                alert('Connection failed. Please check the WebApp URL and ensure it is deployed as "Anyone".');
                window.publicAppsScriptUrl = originalUrl;
            });
        },

        completeSetup() {
            this.isSetup = true;
            localStorage.setItem('isSetup', 'true');
            localStorage.setItem('publicAppsScriptUrl', this.setupForm.appUrl);
            window.publicAppsScriptUrl = this.setupForm.appUrl;

            // If we are in the main app, notify it
            if (window.app) {
                window.app.isSetup = true;
                if (typeof window.app.loadPublicBranding === 'function') {
                    window.app.loadPublicBranding();
                }
            }

            // Optionally redirect to home or refresh
            console.log('Setup completed successfully');
        }
    }
}
