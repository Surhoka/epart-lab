/**
 * Global Button Loading State Utility
 * 
 * Usage:
 * 1. Set loading: window.setButtonLoading(button, true)
 * 2. Remove loading: window.setButtonLoading(button, false)
 * 
 * Features:
 * - Animated spinner
 * - Disabled state
 * - Pressed appearance maintained
 * - Auto-restore original content
 */

window.setButtonLoading = function (button, isLoading) {
    if (!button) {
        console.warn('setButtonLoading: button element is null or undefined');
        return;
    }

    if (isLoading) {
        // Store original text and state
        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;

        // Disable button and add loading class
        button.disabled = true;
        button.classList.add('btn-loading');

        // Add spinner and loading text
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
    } else {
        // Restore original state
        button.disabled = button.dataset.originalDisabled === 'true';
        button.classList.remove('btn-loading');

        // Restore original text
        if (button.dataset.originalText) {
            button.innerHTML = button.dataset.originalText;
            delete button.dataset.originalText;
            delete button.dataset.originalDisabled;
        }
    }
};

/**
 * Helper function to set loading by button ID
 * @param {String} buttonId - Button element ID
 * @param {Boolean} isLoading - Loading state
 */
window.setButtonLoadingById = function (buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        window.setButtonLoading(button, isLoading);
    } else {
        console.warn(`setButtonLoadingById: button with id "${buttonId}" not found`);
    }
};

/**
 * Helper function to set loading by selector
 * @param {String} selector - CSS selector
 * @param {Boolean} isLoading - Loading state
 */
window.setButtonLoadingBySelector = function (selector, isLoading) {
    const button = document.querySelector(selector);
    if (button) {
        window.setButtonLoading(button, isLoading);
    } else {
        console.warn(`setButtonLoadingBySelector: button with selector "${selector}" not found`);
    }
};

console.log('✅ Global button loading utility loaded');
