
/**
 * @file ui.js
 * @description Manages all UI interactions and DOM manipulations.
 */

// SVG Icon Definitions
const svgIcons = {
    'home': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
    'blog': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM5 10h14M5 14h14M5 18h14"></path></svg>`,
    'search': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
    'link': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 6H5.25A2.25 2.0 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path></svg>`,
    'about': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    'contact': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
    'phone': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>`,
    'admin': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm-3 13.542c0-3.393 2.757-6.15 6.15-6.15s6.15 2.757 6.15 6.15c0 3.393-2.757 6.15-6.15 6.15s-6.15-2.757-6.15-6.15z"></path></svg>`,
    'dashboard': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7-8v8m14-8v8"></path></svg>`,
    'postingan': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
    'halaman': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
    'image_hotspot': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
    'calculator': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-3 4v6m-2-4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
    'settings': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.12 1.12 0 001.912.644l1.45-1.06c1.446-1.056 3.354-.235 3.856 1.683.165.61.165 1.287 0 1.897-.502 1.918-2.41 2.74-3.856 1.684l-1.45-1.06a1.12 1.12 0 00-1.912.644c-.426 1.756-2.924 1.756-3.35 0a1.12 1.12 0 00-1.912-.644l-1.45 1.06c-1.446 1.056-3.354.235-3.856-1.683-.165-.61-.165-1.287 0-1.897.502-1.918 2.41-2.74 3.856-1.684l1.45 1.06a1.12 1.12 0 001.912-.644z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`
};

function getSvgIcon(iconName) {
    if (svgIcons[iconName]) {
        return svgIcons[iconName];
    }
    console.warn(`SVG icon "${iconName}" not found. Defaulting to 'link' icon.`);
    return svgIcons['link'];
}

function initUI() {
    // Language Dropdown
    const languageToggleButton = document.getElementById('language-toggle-button');
    const languageDropdown = document.getElementById('language-dropdown');
    if (languageToggleButton) {
        languageToggleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            languageDropdown.classList.toggle('hidden');
        });
    }
    window.addEventListener('click', (event) => {
        if (languageDropdown && !languageDropdown.classList.contains('hidden') && !event.target.closest('#language-toggle-button')) {
            languageDropdown.classList.add('hidden');
        }
    });

    // Sidebar
    const sidebar = document.querySelector('.sidebar');
    const outerWrapper = document.querySelector('.outer-wrapper');
    const sidebarToggleButton = document.getElementById('sidebar-toggle-button');
    if (sidebarToggleButton) {
        let isSidebarExpanded = false;
        const toggleSidebar = () => {
            isSidebarExpanded = !isSidebarExpanded;
            sidebar.classList.toggle('expanded', isSidebarExpanded);
            outerWrapper.classList.toggle('sidebar-expanded', isSidebarExpanded);
            sidebarToggleButton.classList.toggle('active', isSidebarExpanded);
        };
        sidebarToggleButton.addEventListener('click', toggleSidebar);
    }

    // Search
    const searchInputDesktop = document.getElementById('search-input-desktop');
    const searchButtonDesktop = document.getElementById('search-button-desktop');
    const performSearch = () => {
        const query = searchInputDesktop.value.trim();
        if (query) {
            window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
        } else {
            window.location.hash = '#/';
        }
    };
    if (searchButtonDesktop) searchButtonDesktop.addEventListener('click', performSearch);
    if (searchInputDesktop) searchInputDesktop.addEventListener('keypress', (e) => e.key === 'Enter' && performSearch());

    // Theme Toggle
    const themeToggleButton = document.getElementById('theme-toggle-button');
    if (themeToggleButton) {
        const sunIcon = themeToggleButton.querySelector('.fa-sun');
        const moonIcon = themeToggleButton.querySelector('.fa-moon');
        const htmlEl = document.documentElement;
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
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            sunIcon.style.display = isDarkMode ? 'none' : 'inline-block';
            moonIcon.style.display = isDarkMode ? 'inline-block' : 'none';
        });
    }

    // Footer Year
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

    // Floating Up Button
    const floatingUpButton = document.getElementById('floating-up-button');
    if (floatingUpButton) {
        window.addEventListener('scroll', () => {
            floatingUpButton.classList.toggle('hidden', window.scrollY <= 200);
        });
        floatingUpButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

function buildNav(linksData) {
    const sidebarNavLinks = document.getElementById('sidebar-nav-links');
    if (!sidebarNavLinks) return;
    let sidebarHTML = '';
    linksData.forEach(link => {
        sidebarHTML += `
            <div class="sidebar-nav-item">
                <a href="${link.url || '#'}">
                    <span class="nav-icon">${getSvgIcon(link.icon)}</span>
                    <span class="nav-text">${link.name}</span>
                </a>
            </div>
        `;
    });
    sidebarNavLinks.innerHTML = sidebarHTML;
    highlightActiveLink();
}

function highlightActiveLink() {
    const currentHash = window.location.hash || '#/';
    document.querySelectorAll('#sidebar-nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentHash) {
            link.classList.add('active');
        }
    });
}

// Google Translate helpers
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'id', includedLanguages: 'en,id', autoDisplay: false}, 'google_translate_element');
}

function doGTranslate(lang_pair) {
  if (lang_pair.value) lang_pair = lang_pair.value;
  if (lang_pair == '') return;
  var lang = lang_pair.split('|')[1];
  var teCombo = document.querySelector('#google_translate_element select');
  if (teCombo) {
    teCombo.value = lang;
    teCombo.dispatchEvent(new Event('change'));
  } else {
    var d = new Date();
    d.setTime(d.getTime() + (24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = "googtrans=/id/" + lang + ";" + expires + ";path=/";
    location.reload();
  }
}
