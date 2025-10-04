// Global variables for data
let postsData = [];
let blogInfo = {};

// Function to initialize UI elements and event listeners
function initUI() {
    const sidebar = document.querySelector('.sidebar');
    const outerWrapper = document.querySelector('.outer-wrapper');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');

    let isSidebarExpanded = false;

    const toggleSidebar = () => {
        isSidebarExpanded = !isSidebarExpanded;
        sidebar.classList.toggle('expanded', isSidebarExpanded);
        outerWrapper.classList.toggle('sidebar-expanded', isSidebarExpanded);
        sidebarToggleButton.classList.toggle('active', isSidebarExpanded);
    };

    if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener('click', toggleSidebar);
    }

    // Theme Toggle Logic
    const themeToggleButton = document.getElementById('theme-toggle-button');
    if (themeToggleButton) {
        const sunIcon = themeToggleButton.querySelector('.fa-sun');
        const moonIcon = themeToggleButton.querySelector('.fa-moon');
        const htmlEl = document.documentElement;

        // Apply saved theme on load
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            htmlEl.classList.add('dark');
            if(sunIcon) sunIcon.style.display = 'none';
            if(moonIcon) moonIcon.style.display = 'inline-block';
        } else {
            htmlEl.classList.remove('dark');
            if(sunIcon) sunIcon.style.display = 'inline-block';
            if(moonIcon) moonIcon.style.display = 'none';
        }

        themeToggleButton.addEventListener('click', () => {
            htmlEl.classList.toggle('dark');
            const isDarkMode = htmlEl.classList.contains('dark');
            if (isDarkMode) {
                sunIcon.style.display = 'none';
                moonIcon.style.display = 'inline-block';
                localStorage.setItem('theme', 'dark');
            } else {
                sunIcon.style.display = 'inline-block';
                moonIcon.style.display = 'none';
                localStorage.setItem('theme', 'light');
            }
        });
    }

    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    const floatingUpButton = document.getElementById('floating-up-button');

    if (floatingUpButton) {
        // Show button on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 200) {
                floatingUpButton.classList.remove('hidden');
            } else {
                floatingUpButton.classList.add('hidden');
            }
        });

        // Scroll to top on click
        floatingUpButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.hash = '#/admin';
        });
    }
}

// Make buildNav globally accessible for dynamically loaded scripts
window.buildNav = (linksData) => {
    const sidebarNavLinks = document.getElementById('sidebar-nav-links');
    let sidebarHTML = '';

    linksData.forEach(link => {
        sidebarHTML += `
            <div class="sidebar-nav-item">
                <a href="${link.url || '#'}">
                    <span class="nav-icon">${window.getSvgIcon(link.icon)}</span>
                    <span class="nav-text">${link.name}</span>
                </a>
            </div>
        `;
    });

    sidebarNavLinks.innerHTML = sidebarHTML;

    const highlightActiveLink = () => {
        const currentHash = window.location.hash || '#/home';
        document.querySelectorAll('#sidebar-nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentHash) {
                link.classList.add('active');
            }
        });
    };

    highlightActiveLink();
    window.addEventListener('hashchange', highlightActiveLink);
};

const fetchData = async (sheetName) => {
    const sheetId = '1AvJMfIaj1Iu9aJstmkIvlDyrlY-dfbeKbp9K_TlTpyA';
    const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${sheetName}:`, error);
        return [];
    }
};

async function loadPage(slug, targetElement) {
    const url = `/p/${slug}.html`;
    targetElement.innerHTML = '<div class="text-center p-8"><p>Memuat...</p></div>';
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Halaman tidak ditemukan: ${response.status}`);
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const postBody = doc.querySelector(".post-body");
        
        if (postBody) {
            targetElement.innerHTML = postBody.innerHTML;
            
            const scripts = Array.from(postBody.querySelectorAll("script"));
            scripts.forEach(oldScript => {
                const newScript = document.createElement("script");
                for (const attr of oldScript.attributes) {
                    newScript.setAttribute(attr.name, attr.value);
                }
                newScript.textContent = oldScript.textContent;
                targetElement.appendChild(newScript);
            });
            scripts.forEach(oldScript => oldScript.remove());

        } else {
            targetElement.innerHTML = "<p>Konten tidak ditemukan di dalam halaman.</p>";
        }

    } catch (err) {
        console.error("Gagal memuat halaman:", err);
        targetElement.innerHTML = "<p>Gagal memuat konten. Pastikan halaman statis ada dan dapat diakses.</p>";
    }
}

function handleRouteChange() {
    const hash = window.location.hash.slice(1) || '/';
    const route = hash.startsWith('/') ? hash.slice(1) : hash;
    const sectionId = route.split('/')[0] || 'home';

    const mainContentWrapper = document.getElementById('main-content-wrapper');

    const routeMap = {
        'home': { type: 'internal' },
        'blog': { type: 'internal' },
        'kontak': { type: 'page', slug: 'kontak' },
        'admin': { type: 'page', slug: 'admin' }
    };
    
    const routeInfo = routeMap[sectionId];

    // Always build public navigation by default
    window.buildNav(window.publicNavLinksData);

    // Dynamically load admin sidebar logic if on admin route
    if (sectionId === 'admin') {
        // Check if the script is already loaded to prevent multiple loads
        if (!document.getElementById('admin-sidebar-script')) {
            const script = document.createElement('script');
            script.id = 'admin-sidebar-script';
            script.src = 'https://rawcdn.githack.com/Surhoka/epart-lab/main/admin-sidebar-loader.js';
            script.onload = () => {
                // Once the script is loaded, call the global function
                if (window.loadAdminSidebar) {
                    window.loadAdminSidebar();
                } else {
                    console.error('loadAdminSidebar function not found after script load.');
                }
            };
            document.body.appendChild(script);
        } else {
            // If script is already loaded, just call the function
            if (window.loadAdminSidebar) {
                window.loadAdminSidebar();
            }
        }
    } else {
        // If navigating away from admin, remove the admin sidebar script if it exists
        const adminScript = document.getElementById('admin-sidebar-script');
        if (adminScript) {
            adminScript.remove();
        }
    }

    if (routeInfo) {
        if (routeInfo.type === 'page') {
            loadPage(routeInfo.slug, mainContentWrapper);
        } else {
            if (sectionId === 'home') {
                mainContentWrapper.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-md">
                    <h1 class="text-4xl font-bold text-gray-800">Welcome to the Simple SPA Blog</h1>
                    <p class="text-gray-600 mt-4">Here are the latest posts:</p>
                    <div id="posts-list" class="mt-6 space-y-4">
                    </div>
                </div>
            `;
            const postsList = document.getElementById('posts-list');
            postsData.forEach(post => {
                postsList.innerHTML += `
                    <a href="#/artikel/${post.id}" class="block bg-gray-100 p-4 rounded-lg transition duration-300 hover:bg-gray-200">
                        <h2 class="text-xl font-semibold text-gray-800">${post.title}</h2>
                    </a>
                `;
            });
            } else if (sectionId === 'blog') {
                mainContentWrapper.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-md">
                    <h1 class="text-4xl font-bold text-gray-800">Blog Archive</h1>
                    <p class="text-gray-600 mt-4">List of all blog posts:</p>
                    <div id="posts-list-all" class="mt-6 space-y-4">
                    </div>
                </div>
            `;
            const postsListAll = document.getElementById('posts-list-all');
            postsData.forEach(post => {
                postsListAll.innerHTML += `
                    <a href="#/artikel/${post.id}" class="block bg-gray-100 p-4 rounded-lg transition duration-300 hover:bg-gray-200">
                        <h2 class="text-xl font-semibold text-gray-800">${post.title}</h2>
                    </a>
                `;
            });
            }
        }
    } else if (sectionId.startsWith('artikel/')) {
        const postId = parseInt(sectionId.split('/')[1]);
        const post = postsData.find(p => p.id === postId);
        if (post) {
            mainContentWrapper.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-md">
                    <h1 class="text-4xl font-bold text-gray-800">${post.title}</h1>
                    <p class="text-gray-500 mt-2 text-sm">Published on 2024</p>
                    <hr class="my-4"/>
                    <p class="text-gray-700 mt-4 leading-relaxed">${post.content}</p>
                    <a href="#/home" class="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg transition duration-300 hover:bg-gray-700">${window.getSvgIcon('home')}<span>Back to Home</span></a>
                </div>
            `;
        } else {
            mainContentWrapper.innerHTML = "<p>Post tidak ditemukan.</p>";
        }
    } else {
        mainContentWrapper.innerHTML = "<p>Halaman tidak ditemukan (404).</p>";
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    blogInfo = { // Assign to global blogInfo
        isIndexPage: document.getElementById('blogger-page-info').getAttribute('data-is-index-page') === 'true',
        homepageUrl: document.getElementById('blogger-page-info').getAttribute('data-homepage-url'),
        pageType: document.getElementById('blogger-page-info').getAttribute('data-page-type')
    };

    initUI(); // Initialize UI components
    await initializeApp(); // Initialize data and render page
});

const initializeApp = async () => {
    try {
        // Use publicNavLinksData from navigation.js
        // Initial buildNav call should also consider the current hash
        const initialHash = window.location.hash.slice(1) || '/';
        const initialRoute = initialHash.startsWith('/') ? initialHash.slice(1) : initialHash;
        const initialSectionId = initialRoute.split('/')[0] || 'home';
        // Only build public nav initially. Admin nav will be loaded dynamically.
        window.buildNav(window.publicNavLinksData);

        if (blogInfo.pageType === 'index') {
            // SPA-specific logic for index page
            postsData = await fetchData('postingan');
            const mainContentWrapper = document.getElementById('main-content-wrapper');

            if (!mainContentWrapper) {
                console.error('SPA Error: #main-content-wrapper not found. This should exist on index page.');
                return;
            }
            mainContentWrapper.style.display = 'block'; // Show main content wrapper for SPA

            if (postsData.length === 0) {
                console.warn("No posts data loaded from Google Sheet. Displaying no content message.");
                mainContentWrapper.innerHTML = `
                <div class="bg-red-100 text-red-800 p-8 rounded-xl shadow-md text-center">
                    <h1 class="text-4xl font-bold text-red-700">No Content</h1>
                    <p class="text-red-600 mt-4">
                        Could not load posts data from Google Sheet. Make sure the OpenSheet URL is correct and the sheet is accessible.
                    </p>
                </div>
            `;
                return;
            }

            window.addEventListener('hashchange', handleRouteChange);
            handleRouteChange(); // Initial load for SPA content
        } else {
            // Logic for non-index pages (static, item, etc.)
            // Main content is rendered directly by Blogger, no SPA content loading needed.
            // main-content-wrapper is already hidden by default CSS.
        }

    } catch (error) {
        console.error("Initialization failed:", error);
        // Guarded write to main content wrapper to show error
        const mainContentWrapper = document.getElementById('main-content-wrapper');
        if (mainContentWrapper && blogInfo.pageType === 'index') { // Only show error in SPA area on index page
            mainContentWrapper.style.display = 'block'; // Ensure it's visible to show error
            mainContentWrapper.innerHTML = `
                <div class="bg-red-100 text-red-800 p-8 rounded-xl shadow-md text-center">
                    <h1 class="text-4xl font-bold text-red-700">Application Error</h1>
                    <p class="text-red-600 mt-4">
                        An error occurred while starting the application. Some features may not work.
                    </p>
                </div>
            `;
        }
    }
};
