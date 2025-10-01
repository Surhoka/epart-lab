
/**
 * @file api.js
 * @description Handles all communication with the Google Apps Script backend.
 */

const apiUrl = 'https://cms-spabloggerproxy.danialsurhoka.workers.dev'; // Ganti dengan URL Worker Anda!
const SECRET_WORKER_KEY = 'U8HA-k3N9DLXVN89HEvBQYe2PciFsicVsHVRf83c';

/**
 * Calls the Apps Script backend with a specific action and payload.
 * @param {string} action - The action to perform (e.g., 'getPostingan', 'deletePost').
 * @param {object} payload - The data to send with the action.
 * @returns {Promise<object>} - The JSON response from the backend.
 */
async function callAppsScript(action, payload = {}) {
    const dataToSend = {
        action: action,
        ...payload
    };

    const formBody = new URLSearchParams(dataToSend).toString();

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Auth-Token': SECRET_WORKER_KEY
            },
            body: formBody
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'error' && result.message === 'Unauthorized: Invalid Worker Token') {
            throw new Error('Unauthorized');
        }

        return result;

    } catch (error) {
        console.error("Error calling Apps Script:", error);
        throw new Error(`Error: ${error.message}`);
    }
}
