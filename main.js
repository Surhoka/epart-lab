
/**
 * @file main.js
 * @description Main entry point for the application.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize basic UI elements and event listeners
    initUI();

    // Handle potential auth redirects on initial load
    const hash = window.location.hash;
    if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const email = params.get('email');
        if (params.get('action') === 'login' && email) {
            localStorage.setItem('adminEmail', email);
            window.location.hash = '#/admin'; // Redirect to admin
        }
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

        // Build navigation
        const adminPageTitles = ['Dashboard', 'Data Postingan', 'Halaman', 'Settings', 'Tentang', 'Kontak', 'Kalkulator', 'Peta Gambar']; // Added Indonesian titles
        const normalizedAdminPageTitles = adminPageTitles.map(title => title.toLowerCase().trim());
        const adminIcons = ['dashboard', 'postingan', 'halaman', 'settings']; // Icons typically associated with admin functions

        const publicLinks = pagesData
            .filter(page => {
                const normalizedPageTitle = page.title.toLowerCase().trim();
                const isConsideredAdminPage = 
                    (page.route && page.route.startsWith('admin')) || // Route starts with 'admin'
                    normalizedAdminPageTitles.includes(normalizedPageTitle) || // Title matches an admin title
                    adminIcons.includes(page.icon); // Icon matches an admin icon

                return !isConsideredAdminPage;
            })
            .map(page => ({
                name: page.title,
                url: `/#/${page.route || ''}`,
                icon: page.icon || 'link'
            }));
        publicLinks.unshift({ name: 'Beranda', url: '#/', icon: 'home' });
        
        // Define admin links
        const adminLinks = [
            { name: 'Dashboard', url: '#/admin/dashboard', icon: 'dashboard' },
            { name: 'Data Postingan', url: '#/admin/posts', icon: 'postingan' },
            { name: 'Halaman', url: '#/admin/pages', icon: 'halaman' },
            { name: 'Settings', url: '#/admin/settings', icon: 'settings' }
        ];

        // Ensure no admin links are present in public navigation after initial filtering
        const finalPublicLinks = publicLinks.filter(publicLink => {
            return !adminLinks.some(adminLink => 
                adminLink.name.toLowerCase().trim() === publicLink.name.toLowerCase().trim() ||
                adminLink.url === publicLink.url
            );
        });

        window.appNavigation.public = finalPublicLinks;
        window.appNavigation.admin = adminLinks;

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

// Function to check if the current route is an admin route
function isAdminRoute() {
    return window.location.hash.startsWith('#/admin');
}
