// admin.js
// This file will contain the navigation links specific to the admin section.

const adminNavLinks = [
    { name: 'Dashboard', href: '#/admin/dashboard', icon: 'dashboard' },
    { name: 'Posts', href: '#/admin/posts', icon: 'postingan' },
    { name: 'Comments', href: '#/admin/comments', icon: 'link' }, // Using 'link' as a placeholder, consider adding a specific SVG for comments if needed
    { name: 'Users', href: '#/admin/users', icon: 'admin' },
    { name: 'Settings', href: '#/admin/settings', icon: 'settings' }
];

// This array is exposed globally to be used by other JavaScript files (e.g., ui.js or main.js)
// to dynamically render the admin navigation when an admin is logged in.
window.adminNavLinks = adminNavLinks;
