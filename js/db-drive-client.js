/**
 * DB Drive Client Library - Extended
 * ... (Previous code)
 */

(function (window) {
    // ... Existing Code ... (We are re-defining the whole object here for clarity/updates)

    const DBDrive = {
        checkStatus: function (onSuccess, onError) {
            this._send('checkDatabaseStatus', {}, onSuccess, onError);
        },
        setup: function (onSuccess, onError) {
            this._send('setupUserDatabase', { action: 'setupUserDatabase' }, onSuccess, onError);
        },
        getPublicInfo: function (onSuccess, onError) {
            this._send('getPublicDatabaseInfo', {}, onSuccess, onError);
        },

        // --- Schema/Structure Management ---

        /**
         * Get full database structure (list of tables and columns).
         */
        getStructure: function (isPublic, onSuccess, onError) {
            this._send('getDatabaseStructure', { isPublic: isPublic ? 'true' : 'false' }, onSuccess, onError);
        },

        /**
         * Update table structure (Rename, Add/Remove Columns).
         * @param {string} tableName
         * @param {Array} columns - [{ name: 'ID', type: 'text', oldName: 'old_id' }]
         * @param {boolean} isPublic
         */
        updateStructure: function (tableName, columns, isPublic, onSuccess, onError) {
            this._send('updateTableStructure', { tableName, columns, isPublic }, onSuccess, onError);
        },

        /**
         * Delete a table completely.
         */
        deleteTable: function (tableName, isPublic, onSuccess, onError) {
            this._send('deleteTable', { tableName, isPublic }, onSuccess, onError);
        },

        /* --- Admin Functions --- */
        createTable: function (tableName, columns, isPublic, onSuccess, onError) {
            this._send('createTable', { tableName, columns, isPublic }, onSuccess, onError);
        },
        create: function (tableName, data, isPublic, onSuccess, onError) {
            this._send('dbCreate', { tableName, data, isPublic }, onSuccess, onError);
        },
        read: function (tableName, isPublic, onSuccess, onError) {
            this._send('dbRead', { tableName, isPublic: isPublic ? 'true' : 'false' }, onSuccess, onError);
        },
        update: function (tableName, id, data, isPublic, onSuccess, onError) {
            this._send('dbUpdate', { tableName, id, data, isPublic }, onSuccess, onError);
        },
        delete: function (tableName, id, isPublic, onSuccess, onError) {
            this._send('dbDelete', { tableName, id, isPublic }, onSuccess, onError);
        },

        /* --- Internal Helper --- */
        _send: function (action, params, onSuccess, onError) {
            if (typeof window.sendDataToGoogle !== 'function') {
                console.error('DBDrive: sendDataToGoogle function is missing.');
                if (onError) onError(new Error('Dependencies missing'));
                return;
            }
            const errorHandler = onError || ((err) => console.error('DBDrive Error:', err));
            window.sendDataToGoogle(action, params, (response) => {
                if (response && response.status === 'success') {
                    if (onSuccess) onSuccess(response);
                } else {
                    const msg = response ? response.message : 'Unknown error';
                    errorHandler(new Error(msg));
                }
            }, errorHandler);
        }
    };

    window.DBDrive = DBDrive;

})(window);
