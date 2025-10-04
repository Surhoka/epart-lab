// Global variables for data
let postsData = [];
let blogInfo = {};

document.addEventListener('DOMContentLoaded', async () => {
    blogInfo = { // Assign to global blogInfo
        isIndexPage: document.getElementById('blogger-page-info').getAttribute('data-is-index-page') === 'true',
        homepageUrl: document.getElementById('blogger-page-info').getAttribute('data-homepage-url'),
        pageType: document.getElementById('blogger-page-info').getAttribute('data-page-type')
    };

    initUI(); // Initialize UI components
    await initializeApp(); // Initialize data and render page
});
