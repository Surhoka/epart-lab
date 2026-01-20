/**
 * Library Manager Page Logic
 * Manages external plugins via the Gateway Registry.
 */

window.initLibraryManagerPage = function () {
    console.log("Library Manager Page Initialized");

    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb(['Tools', 'Library Manager']);
    }

    // Initialize Alpine component if not already done by fetchPage
    // (In our SPA, fetchPage usually calls this after setting pageContent)
    setupLibraryManagerComponent();
};

function setupLibraryManagerComponent() {
    // We add the component data to the specific element if needed, 
    // but usually in this SPA, it's already bound via x-data in the HTML
    // and we just need to provide the global function.
}

// Define the registration function
const registerLibraryManager = () => {
    if (window.Alpine) {
        window.Alpine.data('libraryManager', () => ({
            plugins: [],
            modalOpen: false,
            editMode: false,
            submitting: false,
            availablePlugins: [],
            formData: {
                id: '', name: '', url: '', actions: '', description: '', active: true,
                showInMenu: false, menuLabel: '', menuIcon: 'zap', menuGroup: 'TOOLS', template: ''
            },

            async init() {
                console.log("Library Manager Component Init");
                await this.fetchAvailablePlugins();
                await this.fetchPlugins();
            },

            async fetchAvailablePlugins() {
                if (!this.gatewayUrl) return;
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, { action: 'get_available_plugins' });
                    if (res.status === 'success') {
                        this.availablePlugins = res.plugins;
                    }
                } catch (e) {
                    console.error("Fetch templates error:", e);
                }
            },

            onPluginSelect() {
                const template = this.availablePlugins.find(p => p.name === this.formData.name);
                if (template) {
                    this.formData.description = template.description;
                    this.formData.url = template.url || '';
                    this.formData.actions = template.actions || '';
                    this.formData.template = template.template || '';
                    this.formData.menuLabel = template.menuLabel || template.name;
                    this.formData.menuIcon = template.menuIcon || 'zap';
                    this.formData.menuGroup = template.menuGroup || 'TOOLS';
                    this.formData.showInMenu = template.showInMenu !== false;
                }
            },

            get gatewayUrl() {
                return (typeof CONFIG !== 'undefined') ? CONFIG.WEBAPP_URL_DEV : '';
            },

            async fetchPlugins() {
                if (!this.gatewayUrl) {
                    console.error("Gateway URL not found in CONFIG");
                    return;
                }
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, { action: 'get_all_plugins' });
                    if (res.status === 'success') {
                        this.plugins = res.plugins.map(p => ({ ...p, pinging: false, pingResult: null }));
                    } else {
                        window.showToast(res.message || "Failed to load plugins", "error");
                    }
                } catch (e) {
                    console.error("Fetch plugins error:", e);
                    window.showToast("Connection error to Gateway", "error");
                }
            },

            openAddModal() {
                this.editMode = false;
                this.formData = {
                    id: '', name: '', url: '', actions: '', description: '', active: true,
                    showInMenu: false, menuLabel: '', menuIcon: 'zap', menuGroup: 'TOOLS', template: ''
                };
                this.modalOpen = true;
            },

            editPlugin(plugin) {
                this.editMode = true;
                this.formData = { ...plugin };
                this.modalOpen = true;
            },

            closeModal() {
                this.modalOpen = false;
            },

            async savePlugin() {
                this.submitting = true;
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, {
                        action: 'save_plugin',
                        data: JSON.stringify(this.formData)
                    });
                    this.submitting = false;
                    if (res.status === 'success') {
                        window.showToast(res.message, "success");
                        this.closeModal();
                        await this.fetchPlugins();
                    } else {
                        window.showToast(res.message, "error");
                    }
                } catch (e) {
                    this.submitting = false;
                    window.showToast("Error saving plugin", "error");
                }
            },

            async togglePlugin(plugin) {
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, {
                        action: 'save_plugin',
                        data: JSON.stringify(plugin)
                    });
                    if (res.status === 'success') {
                        window.showToast(`Plugin ${plugin.active ? 'enabled' : 'disabled'}`);
                    }
                } catch (e) {
                    window.showToast("Failed to toggle plugin", "error");
                }
            },

            async deletePlugin(id) {
                if (!confirm('Are you sure you want to remove this plugin?')) return;
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, {
                        action: 'remove_plugin',
                        id: id
                    });
                    if (res.status === 'success') {
                        window.showToast('Plugin removed', "success");
                        await this.fetchPlugins();
                    }
                } catch (e) {
                    window.showToast("Failed to remove plugin", "error");
                }
            },

            async pingPlugin(plugin) {
                plugin.pinging = true;
                try {
                    const res = await window.app.fetchJsonp(this.gatewayUrl, {
                        action: 'ping_plugin',
                        url: plugin.url
                    });
                    plugin.pinging = false;
                    plugin.pingResult = res;
                    if (res.status === 'success') {
                        window.showToast(`Ping successful: ${res.latency}`, "success");
                    } else {
                        window.showToast('Ping failed: ' + res.message, 'error');
                    }
                } catch (e) {
                    plugin.pinging = false;
                    window.showToast("Ping connection error", "error");
                }
            }
        }));
    }
};

// Immediate registration or wait for Alpine
if (window.Alpine) {
    registerLibraryManager();
} else {
    document.addEventListener('alpine:init', registerLibraryManager);
}
