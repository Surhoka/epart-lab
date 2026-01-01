// Setup Page JavaScript
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyNfOG5Cxxg4aLUe0q3-Kl6GSuJSEQ_lNtmiIOBV6qzj2BPA2RMP-Xg0_FZlMo2bSCM/exec';

window.initSetupPage = function () {
    return {
        setupForm: {
            appUrl: '',
            email: '',
            dbType: 'automatic',
            dbName: ''
        },
        isInstalling: false,

        async init() {
            if (window.isSetupInitialized) {
                console.log('Setup page already initialized, skipping.');
                return;
            }
            window.isSetupInitialized = true;

            console.log('Setup page initialized');

            // Check for Default WebApp URL (Bootstrapper)
            if (typeof WEBAPP_URL !== 'undefined' && WEBAPP_URL !== 'PLACEHOLDER_WEBAPP_URL') {
                this.setupForm.appUrl = WEBAPP_URL;
                await this.autoConfigure();
            }

            // Load saved form data if exists
            const savedData = localStorage.getItem('setupFormData');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    this.setupForm = { ...this.setupForm, ...parsed };
                } catch (e) {
                    console.error('Error loading saved setup data:', e);
                }
            }

            // Watch for form changes and save to localStorage
            this.$watch('setupForm', (value) => {
                localStorage.setItem('setupFormData', JSON.stringify(value));
            }, { deep: true });
        },

        async autoConfigure() {
            if (!this.setupForm.appUrl) return;

            // Set global URL temporarily
            window.publicAppsScriptUrl = this.setupForm.appUrl;

            // Call getConfig API
            if (typeof window.sendToPublicApi === 'function') {
                window.sendToPublicApi('getConfig', {}, (response) => {
                    if (response.status === 'success' && response.data) {
                        if (response.data.dbName) this.setupForm.dbName = response.data.dbName;
                        if (response.data.adminEmail) this.setupForm.email = response.data.adminEmail;
                        // Auto-fill other settings if available
                    }
                });
            }
        },

        async installApp() {
            if (this.isInstalling) return;

            // Validate form
            if (!this.setupForm.appUrl || !this.setupForm.email) {
                this.showToast('Please fill in all required fields', 'error');
                return;
            }

            // Validate URL format
            try {
                new URL(this.setupForm.appUrl);
            } catch (e) {
                this.showToast('Please enter a valid URL', 'error');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.setupForm.email)) {
                this.showToast('Please enter a valid email address', 'error');
                return;
            }

            // Validate database name for manual setup
            if (this.setupForm.dbType === 'manual' && !this.setupForm.dbName) {
                this.showToast('Please enter a database name', 'error');
                return;
            }

            this.isInstalling = true;

            try {
                // Save the public URL to localStorage for future use
                localStorage.setItem('publicAppsScriptUrl', this.setupForm.appUrl);
                window.publicAppsScriptUrl = this.setupForm.appUrl;

                // Prepare installation data
                const installData = {
                    appUrl: this.setupForm.appUrl,
                    email: this.setupForm.email,
                    dbType: this.setupForm.dbType,
                    dbName: this.setupForm.dbType === 'manual' ? this.setupForm.dbName : null,
                    blogTitle: window.app?.blogTitle || document.title || 'EzyParts Store',
                    blogUrl: window.location.origin,
                    timestamp: new Date().toISOString()
                };

                // Call installation API
                await this.callInstallationAPI(installData);

            } catch (error) {
                console.error('Installation error:', error);
                this.showToast('Installation failed. Please try again.', 'error');
                this.isInstalling = false;
            }
        },

        async callInstallationAPI(data) {
            return new Promise((resolve, reject) => {
                // Use the public API interface
                if (typeof window.sendToPublicApi === 'function') {
                    window.sendToPublicApi('saveConfig', data, (response) => {
                        this.isInstalling = false;

                        if (response.status === 'success') {
                            this.showToast('Installation completed successfully!', 'success');

                            // Mark as setup complete
                            localStorage.setItem('isSetup', 'true');

                            // Clear form data
                            localStorage.removeItem('setupFormData');

                            // Update app state
                            if (window.app) {
                                window.app.isSetup = true;
                            }

                            // Navigate to home page
                            setTimeout(() => {
                                window.navigate('home');
                            }, 1500);

                            resolve(response);
                        } else {
                            this.showToast(response.message || 'Installation failed', 'error');
                            reject(new Error(response.message || 'Installation failed'));
                        }
                    });
                } else {
                    // Fallback: simulate installation for testing
                    setTimeout(() => {
                        this.isInstalling = false;
                        this.showToast('Installation completed (demo mode)', 'success');
                        localStorage.setItem('isSetup', 'true');

                        if (window.app) {
                            window.app.isSetup = true;
                        }

                        setTimeout(() => {
                            window.navigate('home');
                        }, 1500);

                        resolve({ success: true });
                    }, 2000);
                }
            });
        },

        showToast(message, type = 'info') {
            // Create toast notification
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 z-[999999] px-6 py-3 rounded-lg shadow-lg text-white font-medium transform transition-all duration-300 translate-x-full opacity-0 ${type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
                }`;
            toast.textContent = message;

            document.body.appendChild(toast);

            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full', 'opacity-0');
            }, 100);

            // Auto remove
            setTimeout(() => {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 4000);
        }
    };
};

console.log('Setup.js loaded successfully');

