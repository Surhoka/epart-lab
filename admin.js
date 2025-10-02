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
});

// Handle login/logout button click
document.addEventListener('click', async (event) => {
    const loginButton = event.target.closest('#login-button');
    if (loginButton) {
        event.preventDefault(); // Prevent default navigation

        if (isLoggedIn()) {
            // Perform logout
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('adminEmail');
            updateLoginStatusUI();
            window.location.hash = '#/'; // Redirect to homepage after logout
        } else {
            // Initiate login process
            try {
                const response = await callAppsScript('getLoginUrl');
                if (response.status === 'success' && response.url) {
                    window.location.href = response.url; // Redirect to Google Apps Script for login
                } else {
                    console.error('Failed to get login URL:', response.message);
                    alert('Failed to initiate login. Please try again.');
                }
            } catch (error) {
                console.error('Error fetching login URL:', error);
                alert('Error initiating login. Please check your connection.');
            }
        }
    }
});

// Handle login callback from Google Apps Script
window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#/login-callback')) {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const email = params.get('email');

        if (email) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('adminEmail', email);
            updateLoginStatusUI();
            window.location.hash = '#/admin/dashboard'; // Redirect to admin dashboard
        } else {
            console.error('Login callback failed: No email received.');
            alert('Login failed. Please try again.');
            window.location.hash = '#/'; // Redirect to homepage
        }
    }
});

// Expose functions globally if needed by other modules (e.g., for login form submission)
window.admin = window.admin || {};
window.admin.updateLoginStatusUI = updateLoginStatusUI;
window.admin.isLoggedIn = isLoggedIn;
