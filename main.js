
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
        const adminPageTitles = ['Dashboard', 'Data Postingan', 'Halaman', 'Settings'];
        const publicLinks = pagesData
            .filter(page => 
                (!page.route || !page.route.startsWith('admin')) && 
                !adminPageTitles.includes(page.title)
            )
            .map(page => ({
                name: page.title,
                url: `/#/${page.route || ''}`,
                icon: page.icon || 'link'
            }));
        publicLinks.unshift({ name: 'Beranda', url: '#/', icon: 'home' });
        
        // Add admin links
        const adminLinks = [
            { name: 'Dashboard', url: '#/admin/dashboard', icon: 'dashboard' },
            { name: 'Data Postingan', url: '#/admin/posts', icon: 'postingan' },
            { name: 'Halaman', url: '#/admin/pages', icon: 'halaman' },
            { name: 'Settings', url: '#/admin/settings', icon: 'settings' }
        ];

        window.appNavigation.public = publicLinks;
        window.appNavigation.admin = adminLinks;

        // Setup routing
        window.addEventListener('hashchange', handleRouteChange);
        handleRouteChange(); // Initial route handling

    } catch (error) {
        console.error("Initialization failed:", error);
        appContent.innerHTML = `<div class="bg-red-100 text-red-800 p-8 rounded-xl shadow-md text-center"><h1 class="text-4xl font-bold text-red-700">Application Error</h1><p class="text-red-600 mt-4">Could not load application data. Check the console for details.</p></div>`;
        // Build a minimal nav for recovery
        buildNav([{ name: 'Admin', url: '#/admin', icon: 'admin' }]);
    }
});
