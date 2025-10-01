
/**
 * @file main.js
 * @description Main entry point for the application.
 */



document.addEventListener('DOMContentLoaded', async () => {
    // Initialize basic UI elements and event listeners
    initUI();

    // Status login dan role user
    let isLoggedIn = false;
    let isAdminUser = false;

    const hash = window.location.hash;
    if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const email = params.get('email');
        if (params.get('action') === 'login' && email) {
            localStorage.setItem('adminEmail', email);
            isLoggedIn = true;
            isAdminUser = true;
            window.location.hash = '#/admin'; // Redirect to admin
        }
    }

    // Check if adminEmail exists in localStorage for persistent login
    if (localStorage.getItem('adminEmail')) {
        isLoggedIn = true;
        isAdminUser = true;
    }

    try {
        // Fetch all initial data in parallel
        const [pagesResult, postsResult] = await Promise.all([
            callAppsScript('getHalaman'),
            callAppsScript('getPostingan')
        ]);

        const pagesData = pagesResult.data || [];
        const postsData = postsResult.data || [];
        
        // Parse data from hidden widgets
        const popularPostsData = [];
        const labelsData = [];
        const popularPostsWidget = document.getElementById('PopularPosts1');
        if (popularPostsWidget) {
            popularPostsWidget.querySelectorAll('ul > li > a').forEach(link => {
                popularPostsData.push({ title: link.textContent.trim(), url: link.getAttribute('href') });
            });
        }
        const labelsWidget = document.getElementById('Label1');
        if (labelsWidget) {
            labelsWidget.querySelectorAll('.widget-content a').forEach(link => {
                const labelName = link.textContent.trim();
                const postCountMatch = labelName.match(/\((\d+)\)/);
                const count = postCountMatch ? parseInt(postCountMatch[1], 10) : 0;
                const cleanLabelName = labelName.replace(/\s*\((\d+)\)/, '').trim();
                labelsData.push({ name: cleanLabelName, url: link.getAttribute('href'), count: count });
            });
        }

        // Make data globally available to handlers
        setGlobalData({ postsData, pagesData, popularPostsData, labelsData });

        window.appNavigation = { public: [], admin: [] };

        // Define all possible menu items
        const allMenuItems = [
            { name: 'Beranda', url: '#/', icon: 'home', isPublic: true },
            // Dynamically add pages from pagesData
            ...pagesData.map(page => ({
                name: page.title,
                url: `#/${page.route || ''}`,
                icon: page.icon || 'link',
                isPublic: !(page.route && page.route.startsWith('admin')) // Assume public unless route is admin
            })),
            { name: 'Login', url: '#/login', icon: 'admin', showIfNotLoggedIn: true } // Assuming a login page
        ];

        // Filter menu items for public navigation
        const publicNavLinks = allMenuItems.filter(item => {
            // Exclude items that are part of the globally exposed admin navigation
            const isAdminNavLink = window.adminNavLinks && window.adminNavLinks.some(adminItem => adminItem.url === item.url);
            if (isAdminNavLink) return false;

            // Show login if not logged in
            if (item.showIfNotLoggedIn) return !isLoggedIn;

            // Only include items explicitly marked as public or default public (like 'Beranda')
            return item.isPublic;
        });

        // Use the globally exposed adminNavLinks if the user is an admin, otherwise an empty array
        const adminNavLinks = isAdminUser ? window.adminNavLinks : [];

        window.appNavigation.public = publicNavLinks;
        window.appNavigation.admin = adminNavLinks;

        // Setup routing
        window.addEventListener('hashchange', handleRouteChange);
        handleRouteChange(); // Initial route handling

        // Build initial navigation based on route
        if (isAdminRoute()) {
            buildNav(window.appNavigation.admin, true);
        } else {
            buildNav(window.appNavigation.public);
        }

    } catch (error) {
        console.error("Initialization failed:", error);
        const appContent = document.getElementById('app-content'); // Ensure appContent is defined
        if (appContent) {
            appContent.innerHTML = `<div class="bg-red-100 text-red-800 p-8 rounded-xl shadow-md text-center"><h1 class="text-4xl font-bold text-red-700">Application Error</h1><p class="text-red-600 mt-4">Could not load application data. Check the console for details.</p></div>`;
        }
        // Build a minimal nav for recovery
        buildNav([{ name: 'Admin', url: '#/admin', icon: 'admin' }], true);
    }
});



// Function to check if the current route is an admin route
function isAdminRoute() {
    return window.location.hash.startsWith('#/admin');
}
