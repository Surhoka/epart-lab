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

// Track buttons that are currently in a loading state
window.activeLoadingButtons = new Set();

window.setButtonLoading = function (button, isLoading) {
    if (!button) {
        console.warn('setButtonLoading: button element is null or undefined');
        return;
    }

    if (isLoading) {
        // Track this button
        window.activeLoadingButtons.add(button);

        // Store original text and state
        button.dataset.originalText = button.innerHTML;
        button.dataset.originalDisabled = button.disabled;

        // Disable button and add loading class
        button.disabled = true;
        button.classList.add('btn-loading');

        // Reset success/hide styles if any (to ensure button reappears correctly)
        button.classList.remove('btn-success');
        button.style.display = '';
        button.style.opacity = '';
        button.style.transform = '';
        if (button.dataset.oldBg) {
            button.style.backgroundColor = button.dataset.oldBg;
            delete button.dataset.oldBg;
        }

        // Add spinner and loading text
        button.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ${typeof isLoading === 'string' ? isLoading : 'Processing...'}
        `;
    } else {
        // Stop tracking
        window.activeLoadingButtons.delete(button);

        // Restore original state if it wasn't hidden or successed
        if (!button.classList.contains('btn-success')) {
            button.disabled = button.dataset.originalDisabled === 'true';
            button.classList.remove('btn-loading');

            // Restore original text
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
                delete button.dataset.originalText;
                delete button.dataset.originalDisabled;
            }
        }
    }
};

/**
 * Global Success Handler
 * Automatically finds buttons that were loading and marks them as success/hides them
 */
window.markActiveButtonsAsSuccess = function (options = {}) {
    window.activeLoadingButtons.forEach(button => {
        // By default, hide buttons that were processed, 
        // unless they have data-no-auto-hide="true"
        if (button.dataset.noAutoHide !== 'true') {
            window.setButtonSuccess(button, options);
        } else {
            window.setButtonLoading(button, false);
        }
    });
    window.activeLoadingButtons.clear();
};

/**
 * Alias for setButtonLoading(button, false) for backward compatibility
 */
window.resetButtonState = function (button, originalHTML) {
    if (button) {
        if (originalHTML) button.innerHTML = originalHTML;
        window.setButtonLoading(button, false);
    }
};

/**
 * Global Button Success Utility
 * Sets button to success state and automatically hides it
 * 
 * @param {HTMLElement} button - The button element
 * @param {Object} options - { hide: true, delay: 1000, message: 'Berhasil' }
 */
window.setButtonSuccess = function (button, options = {}) {
    if (!button) return;

    const settings = {
        hide: true,
        delay: 1000,
        message: 'Berhasil',
        ...options
    };

    // Remove loading state if present
    button.classList.remove('btn-loading');
    window.activeLoadingButtons.delete(button);
    button.disabled = true;
    button.classList.add('btn-success');

    // Display success message
    button.innerHTML = `
        <svg class="h-4 w-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        ${settings.message}
    `;

    // Apply success styles directly
    button.dataset.oldBg = button.style.backgroundColor;
    button.style.backgroundColor = '#10B981'; // green-500
    button.style.borderColor = '#10B981';
    button.style.color = '#FFFFFF';

    if (settings.hide) {
        button.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(-10px) scale(0.95)';
            setTimeout(() => {
                button.style.display = 'none';
            }, 500);
        }, settings.delay);
    }
};

/**
 * Helper functions for success state
 */
window.setButtonSuccessById = function (buttonId, options) {
    const button = document.getElementById(buttonId);
    if (button) window.setButtonSuccess(button, options);
};

window.setButtonSuccessBySelector = function (selector, options) {
    const button = document.querySelector(selector);
    if (button) window.setButtonSuccess(button, options);
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

console.log('✅ Global button loading & success utility loaded');
