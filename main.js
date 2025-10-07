import { getAppLayoutHtml, initializeLayout } from 'https://cdn.jsdelivr.net/ghSurhoka/epart-lab/layout.js';
import { getHomePageHtml } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/home.js';
import { getUserProfilesHtml, initializeUserProfilesPage } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab/userProfiles.js';

const pages = {
  home: getHomePageHtml,
  profile: getUserProfilesHtml,
  // Add other pages here as they are converted
};

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (root) {
    loadPage('home');
    initializeLayout();
  }
});

function loadPage(pageName) {
  const root = document.getElementById('root');
  if (!root) return;

  const pageContentHtml = pages[pageName] ? pages[pageName]() : `<h1>Page Not Found</h1><p>The page "${pageName}" does not exist.</p><button onclick="loadPage('home')">Go to Home</button>`;
  root.innerHTML = getAppLayoutHtml(pageContentHtml);

  // Initialize page-specific scripts
  if (pageName === 'profile') {
    initializeUserProfilesPage();
  }
}

window.loadPage = loadPage; // Make loadPage globally accessible for onclick events
