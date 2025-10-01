
/**
 * @file handlers.js
 * @description Contains functions that render HTML content for each page.
 */

const appContent = document.getElementById('main-section');
let postsData = [];
let pagesData = [];
let popularPostsData = [];
let labelsData = [];

function setGlobalData(data) {
    postsData = data.postsData || [];
    pagesData = data.pagesData || [];
    popularPostsData = data.popularPostsData || [];
    labelsData = data.labelsData || [];
}

function fadeIn(element) {
    element.classList.remove('fade-in');
    setTimeout(() => element.classList.add('fade-in'), 10);
}

function renderHomePage() {
    let postListHTML = '';
    postsData.forEach(post => {
        postListHTML += `
            <a href="#/artikel/${post.id}" class="block bg-white p-6 rounded-xl shadow-md transition duration-300 hover:shadow-lg mb-6">
                <h2 class="text-2xl font-bold text-gray-800">${post.title}</h2>
                <p class="text-gray-600 mt-2">${post.published ? new Date(post.published).toLocaleDateString() : ''}</p>
                <div class="text-gray-700 mt-4">${(post.content || '').substring(0, 200)}...</div>
            </a>
        `;
    });
    const contentHTML = `
        <h1 class="text-4xl font-bold text-gray-800" style="margin-bottom: 0px !important;">Recent Posts</h1>
        ${postListHTML || '<p class="text-gray-600">No posts found.</p>'}
        <div id="popular-posts-container" class="mt-12"></div>
        <div id="labels-container" class="mt-12"></div>
    `;
    appContent.innerHTML = contentHTML;
    renderPopularPosts();
    renderLabels();
    fadeIn(appContent);
}

function renderSearchPage({ query }) {
    const searchQuery = query.get('q');
    const filteredPosts = postsData.filter(post =>
        (post.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    let searchResultsHTML = '';
    filteredPosts.forEach(post => {
        searchResultsHTML += `
            <a href="#/artikel/${post.id}" class="block bg-gray-100 p-4 rounded-lg transition duration-300 hover:bg-gray-200">
                <h2 class="text-xl font-semibold text-gray-800">${post.title}</h2>
            </a>
        `;
    });
    const contentHTML = `
        <div class="bg-white p-8 rounded-xl shadow-md">
            <h1 class="text-4xl font-bold text-gray-800">Search Results for "${searchQuery}"</h1>
            <p class="text-gray-600 mt-4">${filteredPosts.length > 0 ? 'Found the following posts:' : 'No matching posts found.'}</p>
            <div class="mt-6 space-y-4">${searchResultsHTML}</div>
            <a href="#/" class="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg transition duration-300 hover:bg-gray-700">${getSvgIcon('home')}<span>Back to Home</span></a>
        </div>
    `;
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);
}

function renderPostPage({ params }) {
    const post = postsData.find(p => p.id == params.id);
    let contentHTML = '';
    if (post) {
        contentHTML = `
            <div class="bg-white p-8 rounded-xl shadow-md">
                <h1 class="text-4xl font-bold text-gray-800">${post.title}</h1>
                <p class="text-gray-500 mt-2 mb-6">Published on ${post.published ? new Date(post.published).toLocaleDateString() : 'N/A'}</p>
                <div class="text-gray-800 leading-relaxed">${post.content}</div>
                <hr class="my-8"/>
                <a href="#/" class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg transition duration-300 hover:bg-gray-700">${getSvgIcon('home')}<span>Back to Home</span></a>
            </div>
        `;
    } else {
        contentHTML = renderNotFoundPage(true);
    }
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);
}

function renderGenericPage({ params }) {
    const page = pagesData.find(p => p.route === params.route);
    let contentHTML = '';
    if (page) {
        contentHTML = `
            <div class="bg-white p-8 rounded-xl shadow-md">
                <h1 class="text-4xl font-bold text-gray-800">${page.title}</h1>
                <div class="text-gray-800 mt-6 leading-relaxed">${page.content}</div>
            </div>
        `;
    } else {
        contentHTML = renderNotFoundPage(true);
    }
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);
}

function renderLoginPage() {
    const contentHTML = `
        <div class="bg-white p-8 rounded-xl shadow-md text-center">
            <h1 class="text-4xl font-bold text-gray-800">Admin Login</h1>
            <p class="text-gray-600 mt-4 mb-8">Please log in with your Google account to access the admin dashboard.</p>
            <button id="google-login-button" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg transition duration-300 hover:bg-blue-600">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.243 8.92c.083-.493-.358-.92-.852-.92H12.375v1.75h2.5c-.125.875-.667 1.667-1.584 1.667-.958 0-1.75-.792-1.75-1.75s.792-1.75 1.75-1.75c.542 0 .917.25 1.167.458l1.333-1.292c-.917-.833-2.084-1.333-3.5-1.333-2.917 0-5.25 2.333-5.25 5.25s2.333 5.25 5.25 5.25c2.917 0 5.083-2.083 5.083-5.083 0-.375-.042-.667-.083-.917z" clip-rule="evenodd" /></svg>
                <span>Login with Google</span>
            </button>
            <p class="text-sm text-gray-500 mt-6">A new tab will open for login. After logging in, the Apps Script will attempt to redirect you back.</p>
        </div>
    `;
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);

    document.getElementById('google-login-button').addEventListener('click', async () => {
        try {
            const result = await callAppsScript('getLoginUrl');
            if (result && result.status === 'success' && result.url) {
                window.open(result.url, 'loginWindow', 'width=600,height=600');
            } else {
                throw new Error(result.message || 'Failed to get login URL.');
            }
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    });
}

function renderLoginCallbackPage({ query }) {
    const callbackEmail = query.get('email');
    if (callbackEmail) {
        localStorage.setItem('adminEmail', callbackEmail);
        if (window.opener) {
            window.opener.location.hash = '#/admin';
            window.close();
        } else {
            window.location.hash = '#/admin';
        }
    } else {
        window.location.hash = '#/login';
    }
    appContent.innerHTML = `<div class="bg-white p-8 rounded-xl shadow-md text-center"><h1 class="text-4xl font-bold text-gray-800">Login Callback</h1><p class="text-gray-600 mt-4">Processing login and redirecting...</p></div>`;
    fadeIn(appContent);
}

function renderAdminPage({ params }) {
    const adminEmail = localStorage.getItem('adminEmail');
    if (!adminEmail) {
        window.location.hash = '#/login';
        return;
    }

    const adminSubRoute = params.subpage || 'dashboard';
    let adminContentHTML = '';

    switch (adminSubRoute) {
        case 'dashboard':
            adminContentHTML = `...`; // Add dashboard HTML
            break;
        case 'posts':
            adminContentHTML = `...`; // Add posts table HTML
            break;
        // ... other admin cases
        default:
            adminContentHTML = `<p>Admin page not found.</p>`;
    }

    const contentHTML = `
        <div class="bg-white p-8 rounded-xl shadow-md">
            <div class="flex justify-between items-center mb-6">
                <h1 class="text-4xl font-bold text-gray-800">Admin Panel</h1>
                <button id="logout-button" class="bg-gray-600 text-white px-4 py-2 rounded">Logout</button>
            </div>
            <hr class="my-6"/>
            ${adminContentHTML}
        </div>
    `;
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);

    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('adminEmail');
        window.location.hash = '#/login';
    });
}

function renderNotFoundPage(returnHtml = false) {
    const contentHTML = `
        <div class="bg-white p-8 rounded-xl shadow-md text-center">
            <h1 class="text-4xl font-bold text-red-700">404 - Page Not Found</h1>
            <p class="text-gray-600 mt-4">The page you are looking for does not exist.</p>
            <a href="#/" class="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg transition duration-300 hover:bg-gray-700">${getSvgIcon('home')}<span>Back to Home</span></a>
        </div>
    `;
    if (returnHtml) return contentHTML;
    appContent.innerHTML = contentHTML;
    fadeIn(appContent);
}

// Helper functions previously in the main script
function renderPopularPosts() {
    const container = document.getElementById('popular-posts-container');
    if (!container || popularPostsData.length === 0) return;
    let content = '<h2 class="text-2xl font-bold text-gray-800 mb-4">Popular Posts</h2><div class="space-y-3">';
    popularPostsData.forEach(post => {
        content += `<a href="${post.url}" class="block bg-gray-100 p-3 rounded-lg transition duration-300 hover:bg-gray-200"><h3 class="font-semibold text-gray-800">${post.title}</h3></a>`;
    });
    content += '</div>';
    container.innerHTML = content;
}

function renderLabels() {
    const container = document.getElementById('labels-container');
    if (!container || labelsData.length === 0) return;
    let content = '<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-8">Labels</h2><div class="flex flex-wrap gap-2">';
    labelsData.forEach(label => {
        content += `<a href="${label.url}" class="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full transition duration-300 hover:bg-blue-200">${label.name} (${label.count})</a>`;
    });
    content += '</div>';
    container.innerHTML = content;
}
