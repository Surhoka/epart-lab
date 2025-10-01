// admin.js
// This file will contain the navigation links specific to the admin section.

const adminNavLinks = [
    { name: 'Dashboard', url: '#/admin/dashboard', icon: 'dashboard' },
    { name: 'Posts', url: '#/admin/posts', icon: 'postingan' },
    { name: 'Comments', url: '#/admin/comments', icon: 'link' }, // Using 'link' as a placeholder, consider adding a specific SVG for comments if needed
    { name: 'Users', url: '#/admin/users', icon: 'admin' },
    { name: 'Settings', url: '#/admin/settings', icon: 'settings' }
];

// This array is exposed globally to be used by other JavaScript files (e.g., ui.js or main.js)
// to dynamically render the admin navigation when an admin is logged in.
window.adminNavLinks = adminNavLinks;
