document.addEventListener('DOMContentLoaded', async () => {
    initUI();

    // Cek login dari URL hash (misalnya setelah login via Apps Script)
    const hash = window.location.hash;
    if (hash.includes('?')) {
        const params = new URLSearchParams(hash.split('?')[1]);
        const email = params.get('email');
        if (params.get('action') === 'login' && email) {
            localStorage.setItem('adminEmail', email);
            window.location.hash = '#/admin/dashboard';
        }
    }

    try {
        const [pagesResult, postsResult] = await Promise.all([
            callAppsScript('getHalaman'),
            callAppsScript('getPostingan')
        ]);

        const pagesData = pagesResult.data || [];
        const postsData = postsResult.data || [];

        // Ambil data dari widget tersembunyi
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
                const countMatch = labelName.match(/\((\d+)\)/);
                const count = countMatch ? parseInt(countMatch[1], 10) : 0;
                const cleanLabel = labelName.replace(/\s*\((\d+)\)/, '').trim();
                labelsData.push({ name: cleanLabel, url: link.getAttribute('href'), count });
            });
        }

        setGlobalData({ postsData, pagesData, popularPostsData, labelsData });

        // Navigasi modular
        window.appNavigation = { public: [], admin: [] };

        const adminTitles = ['Dashboard', 'Data Postingan', 'Halaman', 'Settings', 'Tentang', 'Kontak', 'Kalkulator', 'Peta Gambar'];
        const adminIcons = ['dashboard', 'postingan', 'halaman', 'settings'];
        const normalizedAdminTitles = adminTitles.map(t => t.toLowerCase().trim());

        const publicLinks = pagesData
            .filter(page => {
                const title = page.title.toLowerCase().trim();
                const isAdminPage =
                    (page.route && page.route.startsWith('admin')) ||
                    normalizedAdminTitles.includes(title) ||
                    adminIcons.includes(page.icon);
                return !isAdminPage;
            })
            .map(page => ({
                name: page.title,
                url: `/#/${page.route || ''}`,
                icon: page.icon || 'link'
            }));

        publicLinks.unshift({ name: 'Beranda', url: '#/', icon: 'home' });

        const adminLinks = [
            { name: 'Dashboard', url: '#/admin/dashboard', icon: 'dashboard' },
            { name: 'Data Postingan', url: '#/admin/posts', icon: 'postingan' },
            { name: 'Halaman', url: '#/admin/pages', icon: 'halaman' },
            { name: 'Settings', url: '#/admin/settings', icon: 'settings' }
        ];

        const finalPublicLinks = publicLinks.filter(pub =>
            !adminLinks.some(adm =>
                adm.name.toLowerCase().trim() === pub.name.toLowerCase().trim() ||
                adm.url === pub.url
            )
        );

        window.appNavigation.public = finalPublicLinks;
        window.appNavigation.admin = adminLinks;

        window.addEventListener('hashchange', handleRouteChange);
        handleRouteChange();

        // Render navigasi sesuai status login
        if (isAdminRoute() && isAdminLoggedIn()) {
            buildNav(window.appNavigation.admin, true);
        } else {
            buildNav(window.appNavigation.public);
        }

        // Sembunyikan tombol login jika sudah login
        const loginBtn = document.getElementById('login-button');
        if (loginBtn) {
            loginBtn.style.display = isAdminLoggedIn() ? 'none' : 'inline-block';
        }

        // Tampilkan tombol logout jika sudah login
        const logoutBtn = document.getElementById('logout-button');
        if (logoutBtn) {
            logoutBtn.style.display = isAdminLoggedIn() ? 'inline-block' : 'none';
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('adminEmail');
                window.location.hash = '#/';
            });
        }

    } catch (err) {
        console.error('Init error:', err);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = `<div class="bg-red-100 text-red-800 p-8 rounded-xl shadow-md text-center">
                <h1 class="text-4xl font-bold text-red-700">Application Error</h1>
                <p class="text-red-600 mt-4">Gagal memuat data aplikasi. Cek console untuk detail.</p>
            </div>`;
        }
        buildNav([{ name: 'Admin', url: '#/admin', icon: 'admin' }], true);
    }
});

// Cek apakah route admin
function isAdminRoute() {
    return window.location.hash.startsWith('#/admin');
}

// Cek apakah user sudah login sebagai admin
function isAdminLoggedIn() {
    return localStorage.getItem('adminEmail') !== null;
}

// Proteksi akses admin
function handleRouteChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#/admin') && !isAdminLoggedIn()) {
        window.location.hash = '#/';
        return;
    }

    // Tambahkan routing lain di sini jika perlu
}
