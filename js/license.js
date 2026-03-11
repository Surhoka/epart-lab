/**
 * License Page Component
 */
document.addEventListener('alpine:init', () => {
    Alpine.data('licensePage', () => ({
        isLoading: false,
        lastUpdated: '2026-03-12',

        init() {
            console.log('License Page Initialized');
        }
    }));
});
