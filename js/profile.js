// Profile page initialization
window.initProfilePage = function () {
    console.log("Profile Page Initialized");

    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Profile');
    }

    console.log('Profile page ready - using inline Alpine data');
};
