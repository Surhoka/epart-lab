/**
 * Public EzyParts Setup Page Logic
 * Connects to existing Admin database instead of creating new one
 */

window.initSetupPage = function() {
    return {
        setupForm: {
            bootstrapUrl: '', // User's WebApp URL
            connectionMode: 'readonly'
        },
        userId: null, // Generated user ID
        isRegistered: false, // User registration status
        discoveredUrls: {
            adminUrl: '',
            publicUrl: ''
        },
        isDiscovering: false,
        isConnecting: false,
        connectSuccess: false,
        discoveryStatus: null,
        connectionStatus: null,
        databaseInfo: null,
        registryInfo: null,
        useDefaults: false,

        init() {
            console.log('Public Setup Page initialized with Multi-User Registry Bootstrap');
            
            // Get setup endpoint URL (fixed/default)
            const setupEndpointUrl = window.EZYPARTS_CONFIG?.REGISTRY_BOOTSTRAP?.DEFAULT_WEBAPP_URL || '';
            
            // Load saved user data from localStorage
            const savedUserId = localStorage.getItem('userId');
            const savedUserUrl = localStorage.getItem('userWebAppUrl');
            const discoveredAdmin = localStorage.getItem('discoveredAdminUrl');
            const discoveredPublic = localStorage.getItem('discoveredPublicUrl');
            
            // Set user ID if available
            if (savedUserId) {
                this.userId = savedUserId;
                this.isRegistered = true;
            }
            
            // Load user's WebApp URL
            this.setupForm.bootstrapUrl = savedUserUrl || '';
            
            // Load discovered URLs if available
            if (discoveredAdmin || discoveredPublic) {
                this.discoveredUrls.adminUrl = discoveredAdmin || '';
                this.discoveredUrls.publicUrl = discoveredPublic || '';
                
                if (discoveredAdmin) {
                    this.discoveryStatus = {
                        success: true,
                        message: 'URLs already registered and discovered'
                    };
                }
            }
            
            // Check if we have setup endpoint configured
            this.useDefaults = !!setupEndpointUrl;
            
            // Auto-discover if user URL is available and not already discovered
            if (this.setupForm.bootstrapUrl && !this.discoveredUrls.adminUrl) {
                setTimeout(() => {
                    this.registerAndDiscover();
                }, 1000);
            } else if (this.discoveredUrls.adminUrl) {
                // Auto-test connection if admin URL is already discovered
                setTimeout(() => {
                    this.testDatabaseConnection();
                }, 1000);
            }
        },

        loadDefaultBootstrap() {
            const defaultBootstrapUrl = window.EZYPARTS_CONFIG?.REGISTRY_BOOTSTRAP?.DEFAULT_WEBAPP_URL || '';
            
            this.setupForm.bootstrapUrl = defaultBootstrapUrl;
            
            if (this.setupForm.bootstrapUrl) {
                this.discoverUrls();
            }
            
            this.showToast('Default Setup URL loaded', 'info');
        },

        clearAll() {
            this.setupForm.bootstrapUrl = '';
            this.discoveredUrls.adminUrl = '';
            this.discoveredUrls.publicUrl = '';
            this.discoveryStatus = null;
            this.connectionStatus = null;
            this.databaseInfo = null;
            this.registryInfo = null;
            
            // Clear localStorage
            localStorage.removeItem('bootstrapUrl');
            localStorage.removeItem('discoveredAdminUrl');
            localStorage.removeItem('discoveredPublicUrl');
            localStorage.removeItem('adminAppsScriptUrl');
            localStorage.removeItem('publicAppsScriptUrl');
            localStorage.removeItem('connectionMode');
            localStorage.removeItem('publicConnectionInfo');
            
            this.showToast('All data cleared', 'info');
        },

        async registerAndDiscover() {
            if (!this.setupForm.bootstrapUrl) {
                this.showToast('Please enter your WebApp URL first', 'error');
                return;
            }

            this.isDiscovering = true;
            this.discoveryStatus = null;
            this.discoveredUrls.adminUrl = '';
            this.discoveredUrls.publicUrl = '';

            try {
                console.log('Registering user with WebApp URL:', this.setupForm.bootstrapUrl);
                
                // Get setup endpoint URL
                const setupEndpointUrl = window.EZYPARTS_CONFIG?.REGISTRY_BOOTSTRAP?.DEFAULT_WEBAPP_URL;
                
                if (!setupEndpointUrl) {
                    throw new Error('Setup endpoint not configured');
                }
                
                // Register user with setup endpoint
                const registerResponse = await fetch(`${setupEndpointUrl}?action=registerUser&adminUrl=${encodeURIComponent(this.setupForm.bootstrapUrl)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!registerResponse.ok) {
                    throw new Error(`HTTP ${registerResponse.status}: ${registerResponse.statusText}`);
                }

                const registerResult = await registerResponse.json();
                console.log('User registration result:', registerResult);

                if (registerResult.status === 'success') {
                    // Save user ID and registration info
                    this.userId = registerResult.data.userId;
                    this.isRegistered = true;
                    
                    // Extract discovered URLs
                    this.discoveredUrls.adminUrl = registerResult.data.adminUrl || '';
                    this.discoveredUrls.publicUrl = registerResult.data.publicUrl || '';
                    
                    // Save to localStorage
                    localStorage.setItem('userId', this.userId);
                    localStorage.setItem('userWebAppUrl', this.setupForm.bootstrapUrl);
                    localStorage.setItem('discoveredAdminUrl', this.discoveredUrls.adminUrl);
                    localStorage.setItem('discoveredPublicUrl', this.discoveredUrls.publicUrl);
                    
                    this.discoveryStatus = {
                        success: true,
                        message: 'User registered and URLs discovered successfully!'
                    };
                    
                    this.showToast('Registration and discovery successful!', 'success');
                    
                    // Auto-test connection if admin URL was discovered
                    if (this.discoveredUrls.adminUrl) {
                        setTimeout(() => {
                            this.testDatabaseConnection();
                        }, 500);
                    }
                } else {
                    this.discoveryStatus = {
                        success: false,
                        message: registerResult.message || 'Failed to register user'
                    };
                    this.showToast('User registration failed', 'error');
                }

            } catch (error) {
                console.error('User registration error:', error);
                this.discoveryStatus = {
                    success: false,
                    message: `Registration failed: ${error.message}`
                };
                this.showToast('User registration failed', 'error');
            } finally {
                this.isDiscovering = false;
            }
        },

        // Keep the old discoverUrls method as alias for backward compatibility
        async discoverUrls() {
            return await this.registerAndDiscover();
        },

        async testDatabaseConnection() {
            if (!this.discoveredUrls.adminUrl) {
                this.showToast('Admin URL not discovered yet', 'error');
                return;
            }

            this.connectionStatus = null;

            try {
                // Test connection to admin database
                const response = await fetch(`${this.discoveredUrls.adminUrl}?action=getPublicDatabaseInfo`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                console.log('Database connection test result:', result);

                if (result.status === 'success' && result.data) {
                    this.connectionStatus = {
                        success: true,
                        message: 'Database found and accessible!'
                    };
                    this.databaseInfo = result.data;
                    
                    this.showToast('Database connection successful!', 'success');
                } else {
                    this.connectionStatus = {
                        success: false,
                        message: result.message || 'Database not found or not accessible'
                    };
                    this.showToast('Database connection failed', 'error');
                }

            } catch (error) {
                console.error('Database connection test error:', error);
                this.connectionStatus = {
                    success: false,
                    message: `Connection failed: ${error.message}`
                };
                this.showToast('Connection test failed', 'error');
            }
        },

        async connectToDatabase() {
            if (!this.validateForm()) {
                return;
            }

            this.isConnecting = true;

            try {
                // Save URLs to localStorage (using discovered URLs)
                if (this.discoveredUrls.adminUrl) {
                    localStorage.setItem('adminAppsScriptUrl', this.discoveredUrls.adminUrl);
                }
                if (this.discoveredUrls.publicUrl) {
                    localStorage.setItem('publicAppsScriptUrl', this.discoveredUrls.publicUrl);
                }
                localStorage.setItem('connectionMode', this.setupForm.connectionMode);

                // Test public app URL if discovered
                if (this.discoveredUrls.publicUrl) {
                    try {
                        const publicResponse = await fetch(`${this.discoveredUrls.publicUrl}?action=checkSetup`, {
                            method: 'GET'
                        });
                        
                        if (publicResponse.ok) {
                            const publicResult = await publicResponse.json();
                            console.log('Public app URL test result:', publicResult);
                            
                            // Save setup to public script if it supports it
                            if (publicResult.status === 'success') {
                                await this.saveSetupToPublicScript();
                            }
                        }
                    } catch (error) {
                        console.warn('Public app URL test failed, but continuing:', error);
                    }
                }

                // Final test of admin connection
                const finalTest = await fetch(`${this.discoveredUrls.adminUrl}?action=getPublicDatabaseInfo`, {
                    method: 'GET'
                });

                if (!finalTest.ok) {
                    throw new Error('Final connection test failed');
                }

                const finalResult = await finalTest.json();
                if (finalResult.status !== 'success') {
                    throw new Error(finalResult.message || 'Database connection failed');
                }

                // Save connection info
                const connectionInfo = {
                    userId: this.userId,
                    userWebAppUrl: this.setupForm.bootstrapUrl,
                    adminUrl: this.discoveredUrls.adminUrl,
                    publicUrl: this.discoveredUrls.publicUrl,
                    mode: this.setupForm.connectionMode,
                    databaseInfo: this.databaseInfo,
                    registryInfo: this.registryInfo,
                    connectedAt: new Date().toISOString(),
                    version: '2.1-multiuser'
                };
                localStorage.setItem('publicConnectionInfo', JSON.stringify(connectionInfo));

                // Mark as setup complete
                localStorage.setItem('isSetup', 'true');
                
                this.connectSuccess = true;
                this.showToast('Successfully connected to database!', 'success');

            } catch (error) {
                console.error('Connection error:', error);
                this.showToast(`Connection failed: ${error.message}`, 'error');
            } finally {
                this.isConnecting = false;
            }
        },

        async saveSetupToPublicScript() {
            if (!this.discoveredUrls.publicUrl) return;

            try {
                const setupData = {
                    action: 'saveSetup',
                    adminAppsScriptUrl: this.discoveredUrls.adminUrl,
                    publicAppsScriptUrl: this.discoveredUrls.publicUrl,
                    connectionMode: this.setupForm.connectionMode
                };

                const response = await fetch(this.discoveredUrls.publicUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(setupData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Setup saved to public script:', result);
                }
            } catch (error) {
                console.warn('Failed to save setup to public script:', error);
            }
        },

        validateForm() {
            if (!this.setupForm.bootstrapUrl) {
                this.showToast('Your WebApp URL is required', 'error');
                return false;
            }

            if (!this.isRegistered) {
                this.showToast('Please register with Setup endpoint first', 'error');
                return false;
            }

            if (!this.discoveryStatus?.success) {
                this.showToast('Please register and discover URLs first', 'error');
                return false;
            }

            if (!this.discoveredUrls.adminUrl) {
                this.showToast('Admin URL not discovered from registration', 'error');
                return false;
            }

            if (!this.connectionStatus?.success) {
                this.showToast('Please test database connection first', 'error');
                return false;
            }

            // Validate URL format
            try {
                new URL(this.setupForm.bootstrapUrl);
                if (this.discoveredUrls.adminUrl) {
                    new URL(this.discoveredUrls.adminUrl);
                }
                if (this.discoveredUrls.publicUrl) {
                    new URL(this.discoveredUrls.publicUrl);
                }
            } catch (error) {
                this.showToast('Invalid URL format detected', 'error');
                return false;
            }

            return true;
        },

        finishSetup() {
            // Use dynamic config completion handler
            if (typeof window.onSetupComplete === 'function') {
                window.onSetupComplete(
                    this.discoveredUrls.adminUrl,
                    this.discoveredUrls.publicUrl,
                    this.userId
                );
            } else {
                // Fallback to original method
                if (window.app) {
                    window.app.isSetup = true;
                    window.app.page = 'home';
                }
                
                window.navigate('home');
            }
            
            this.showToast('Welcome to Public EzyParts!', 'success');
        },

        showToast(message, type = 'info') {
            // Create toast notification
            const toast = document.createElement('div');
            toast.className = `fixed top-4 right-4 z-[999999] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transform transition-all duration-300 translate-x-full`;
            
            // Set color based on type
            switch (type) {
                case 'success':
                    toast.className += ' bg-green-600';
                    break;
                case 'error':
                    toast.className += ' bg-red-600';
                    break;
                case 'warning':
                    toast.className += ' bg-yellow-600';
                    break;
                default:
                    toast.className += ' bg-blue-600';
            }
            
            toast.textContent = message;
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full');
            }, 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                toast.classList.add('translate-x-full');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    };
};
