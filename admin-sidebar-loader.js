// Define a global function to load the admin sidebar
window.loadAdminSidebar = () => {
    // Ensure buildNav and adminNavLinksData are available globally
    if (window.buildNav && window.adminNavLinksData) {
        window.buildNav(window.adminNavLinksData);
    } else {
        console.error('Required functions or data for admin sidebar not found on window object.');
    }
};
