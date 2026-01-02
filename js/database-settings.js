/**
 * database-settings.js
 * Logic for managing Database Tables via DB Drive Client.
 */

window.initDatabaseSettingsPage = function () {
    return {
        // State
        isLoading: true,
        isSaving: false,
        error: null,
        isPublicDb: false, // false = AdminDB, true = PublicDB
        tables: [], // List of { name: 'Users', columns: [...] }

        // Editor State
        editorOpen: false,
        editMode: 'create', // 'create' or 'edit'
        editingTable: {
            name: '',
            columns: [] // { name: '', type: 'text', oldName: '' }
        },

        // Init
        init() {
            this.isLoading = true;
            this.checkPrerequisites();
        },

        checkPrerequisites() {
            if (!window.DBDrive) {
                // Try dynamic load if not present (safeguard)
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/js/db-drive-client.js'; // Adjust path if local
                script.onload = () => {
                    this.refreshStructure();
                };
                script.onerror = () => {
                    this.error = "Failed to load DB Drive Client library.";
                    this.isLoading = false;
                }
                // Check if internal file exists or load from relative path if possible
                // Assuming script tag is in main HTML, if not, loading text below
            }
            // Just proceed if global exists or wait for it
            if (window.DBDrive) {
                this.refreshStructure();
            } else {
                // Fallback retry
                setTimeout(() => {
                    if (window.DBDrive) this.refreshStructure();
                    else this.error = "DB Drive Client not initialized. Please refresh.";
                }, 1000);
            }
        },

        switchDb(isPublic) {
            this.isPublicDb = isPublic;
            this.refreshStructure();
        },

        refreshStructure() {
            this.isLoading = true;
            this.error = null;

            window.DBDrive.getStructure(this.isPublicDb, (response) => {
                this.isLoading = false;
                if (response.data) {
                    this.tables = response.data; // [{ name, columns }]
                } else {
                    this.tables = [];
                }
            }, (err) => {
                this.isLoading = false;
                this.error = err.message || "Failed to fetch database structure.";
                console.error(err);
            });
        },

        // Editor Logic
        openAddModal() {
            this.editMode = 'create';
            this.editingTable = {
                name: '',
                columns: [
                    { name: 'ID', type: 'text', id: Date.now() + 1 },
                    { name: 'Created_At', type: 'date', id: Date.now() + 2 }
                ]
            };
            this.editorOpen = true;
        },

        editTable(table) {
            this.editMode = 'edit';
            // Deep copy to avoid mutating list view immediately
            this.editingTable = {
                name: table.name,
                columns: table.columns.map(c => ({
                    name: c.name,
                    type: c.type || 'text',
                    oldName: c.name, // Important for tracking renames
                    id: c.id || Math.random()
                }))
            };
            this.editorOpen = true;
        },

        addColumn() {
            this.editingTable.columns.push({
                name: 'New_Column',
                type: 'text',
                id: Date.now()
            });
            // Scroll to bottom of list logic if needed
        },

        removeColumn(index) {
            this.editingTable.columns.splice(index, 1);
        },

        closeEditor() {
            if (this.isSaving) return;
            this.editorOpen = false;
        },

        saveTable() {
            // Validation
            if (!this.editingTable.name) {
                alert("Table name is required.");
                return;
            }
            if (this.editingTable.columns.length === 0) {
                alert("At least one column is required.");
                return;
            }
            // Check for duplicate column names
            const names = this.editingTable.columns.map(c => c.name.toLowerCase());
            if (new Set(names).size !== names.length) {
                alert("Column names must be unique.");
                return;
            }

            this.isSaving = true;

            const payloadColumns = this.editingTable.columns.map(c => ({
                name: c.name,
                type: c.type,
                oldName: c.oldName // Backend usage
            }));

            const successCallback = (res) => {
                this.isSaving = false;
                this.editorOpen = false;
                this.refreshStructure(); // Refresh list

                // Show toast (helper assumed globally available)
                if (window.showToast) window.showToast(res.message || 'Saved successfully', 'success');
                else alert('Saved successfully');
            };

            const errorCallback = (err) => {
                this.isSaving = false;
                alert("Error: " + err.message);
            };

            if (this.editMode === 'create') {
                window.DBDrive.createTable(this.editingTable.name, this.editingTable.columns.map(c => c.name), this.isPublicDb, successCallback, errorCallback);
                // Note: creates table but doesn't register full schema types in createTable simple call. 
                // Better to use updateTableStructure even for create if we want types saved immediately?
                // Actually `createTable` in GAS is simple. Let's redirect `create` logic to `updateTableStructure` for consistency if backend supports it creating new sheets.
                // Looking at backend code: updateTableStructure DOES create sheet if not exists.
                // So let's use that one.
                window.DBDrive.updateStructure(this.editingTable.name, payloadColumns, this.isPublicDb, successCallback, errorCallback);
            } else {
                window.DBDrive.updateStructure(this.editingTable.name, payloadColumns, this.isPublicDb, successCallback, errorCallback);
            }
        },

        confirmDelete(table) {
            if (confirm(`Are you sure you want to delete table "${table.name}"?\nThis action cannot be undone and will delete all data in the sheet.`)) {
                this.isLoading = true; // Block UI
                window.DBDrive.deleteTable(table.name, this.isPublicDb, (res) => {
                    if (window.showToast) window.showToast('Table deleted.', 'success');
                    this.refreshStructure();
                }, (err) => {
                    this.isLoading = false;
                    alert("Failed to delete table: " + err.message);
                });
            }
        }
    }
}
