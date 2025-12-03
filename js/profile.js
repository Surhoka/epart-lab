// Register Alpine component globally when script loads
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
    // If Alpine isn't loaded yet, wait for it
    document.addEventListener('alpine:init', () => {
        Alpine.data('profileLogic', () => ({
            pageName: 'Profile',
            isProfileInfoModal: false,
            isProfileAddressModal: false,

            init() {
                console.log('Profile Logic Initialized');
            }
        }));
    });
}

window.initProfilePage = function () {
    console.log("Profile Page Initialized");

    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Profile');
    }

    // Manually initialize Alpine for the injected content
    const profileContainer = document.getElementById('profile-page-container');
    if (profileContainer && typeof Alpine !== 'undefined') {
        Alpine.initTree(profileContainer);
    } else if (!profileContainer) {
        console.warn("Profile page container not found for Alpine initialization.");
    }
};
