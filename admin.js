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

// Function to check login status (placeholder for actual authentication logic)
function isLoggedIn() {
    // In a real application, this would check for a valid authentication token
    // For demonstration, we'll use a simple localStorage flag
    return localStorage.getItem('isLoggedIn') === 'true';
}

// Function to update the login status label and button link
function updateLoginStatusUI() {
    const loginButton = document.getElementById('login-button');
    const loginStatusLabel = document.getElementById('login-status-label');

    if (loginButton && loginStatusLabel) {
        if (isLoggedIn()) {
            loginStatusLabel.textContent = 'Logout';
            loginButton.href = '#/logout';
            loginButton.title = 'Admin Logout';
        } else {
            loginStatusLabel.textContent = 'Login';
            loginButton.href = '#/login';
            loginButton.title = 'Admin Login';
        }
    }
}

// Event listener for login/logout actions (for demonstration)
document.addEventListener('DOMContentLoaded', () => {
    updateLoginStatusUI();

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            if (loginButton.href.endsWith('#/logout')) {
                // Simulate logout
                localStorage.setItem('isLoggedIn', 'false');
                updateLoginStatusUI();
                // Optionally redirect to homepage or login page after logout
                window.location.hash = '#/';
                event.preventDefault(); // Prevent default navigation
            } else if (loginButton.href.endsWith('#/login')) {
                // Simulate login (for demonstration, assume successful login)
                // In a real app, this would involve a login form submission
                // For now, we'll just toggle the status
                // localStorage.setItem('isLoggedIn', 'true');
                // updateLoginStatusUI();
                // window.location.hash = '#/admin/dashboard'; // Redirect to admin dashboard
                // event.preventDefault();
            }
        });
    }
});

// Expose functions globally if needed by other modules (e.g., for login form submission)
window.admin = window.admin || {};
window.admin.updateLoginStatusUI = updateLoginStatusUI;
window.admin.isLoggedIn = isLoggedIn;
