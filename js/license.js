/**
 * License Page Component
 */
const registerLicensePage = () => {
    if (window.Alpine && !window.Alpine.data('licensePage')) {
        window.Alpine.data('licensePage', () => ({
            isLoading: false,
            lastUpdated: '2026-03-12',

            init() {
                console.log('License Page Initialized');
            }
        }));
    }
};

if (window.Alpine) {
    registerLicensePage();
} else {
    document.addEventListener('alpine:init', registerLicensePage);
}
