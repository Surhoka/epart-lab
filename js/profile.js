window.initProfilePage = function () {
    console.log("Profile Page Initialized");

    if (typeof Alpine !== 'undefined') {
        Alpine.data('profileLogic', () => ({
            pageName: 'Profile',
            isProfileInfoModal: false,
            isProfileAddressModal: false,

            init() {
                console.log('Profile Logic Initialized');
            }
        }));
    } else {
        console.error("Alpine.js is not loaded.");
    }

    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Profile');
    }

    // Manually initialize Alpine for the injected content
    const profileContainer = document.getElementById('profile-page-container');
    if (profileContainer) {
        Alpine.initTree(profileContainer);
    } else {
        console.warn("Profile page container not found for Alpine initialization.");
    }
};
