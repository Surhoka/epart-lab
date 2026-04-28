
/**
 * database.js
 */

window.database = function () {
    return {
        // State
        isLoading: true,
        error: null,
        hierarchy: [], // List of { name, type, url, children: [] }
        expandedNodes: {}, // ID atau tipe yang otomatis terbuka (menggunakan objek untuk reaktivitas)

        // Init
        init() {
            this.isLoading = true;
            this.refreshStructure();
        },

        refreshStructure() {
            this.isLoading = true;
            this.error = null;

            window.sendDataToGoogle('get_db_hierarchy', {}, (response) => {
                this.isLoading = false;
                console.log("DEBUG: Server Response:", response);
                if (response.data) {
                    this.hierarchy = response.data;
                    console.log("DEBUG: Hierarchy Set:", JSON.stringify(this.hierarchy));
                    // Auto expand root
                    if (this.hierarchy.length > 0) {
                        this.expandedNodes[this.hierarchy[0].id] = true;
                    }
                } else {
                    console.warn("DEBUG: No data in response.");
                    this.hierarchy = [];
                }
            }, (err) => {
                this.isLoading = false;
                console.error("DEBUG: Fetch Error:", err);
                this.error = err.message || "Failed to fetch database structure.";
            });
        },

        toggleNode(id) {
            this.expandedNodes[id] = !this.expandedNodes[id];
        },

        openInDrive(url) {
            console.log("DEBUG: openInDrive called with:", url);
            if (url) {
                window.open(url, '_blank');
            } else {
                if (window.showAlert) window.showAlert('error', 'URL tidak tersedia untuk item ini.');
                else alert('URL tidak tersedia untuk item ini.');
            }
        },

        openRootInDrive() {
            console.log("DEBUG: openRootInDrive triggered. Current state:", this.hierarchy);
            const root = (this.hierarchy && this.hierarchy.length > 0) ? this.hierarchy[0] : null;
            if (root) {
                const targetUrl = root.url || ("https://drive.google.com/drive/folders/" + root.id);
                console.log("DEBUG: Target URL determined:", targetUrl);
                alert("DEBUG Navigasi:\nID: " + root.id + "\nURL: " + targetUrl);
                window.open(targetUrl, '_blank');
            } else {
                console.error("DEBUG: Hierarchy is empty or root missing.");
                alert("DEBUG: Hierarchy masih kosong atau root tidak ditemukan.");
                window.open('https://drive.google.com/drive/my-drive', '_blank');
            }
        }
    }
}
