// Public navigation links for Blogger SPA Template.xml
export const publicNavLinksData = [
    {
        name: 'Beranda',
        url: '#/home',
        icon: 'home' // Assuming 'home' is a valid SVG icon name
    },
    {
        name: 'Blog',
        url: '#/blog',
        icon: 'blog' // Assuming 'blog' is a valid SVG icon name
    },
    {
        name: 'Kontak',
        url: '#/kontak',
        icon: 'contact' // Assuming 'contact' is a valid SVG icon name
    },
    {
        name: 'Admin',
        url: '#/admin',
        icon: 'admin_panel_settings' // Using a Material Icon name for consistency, will need to map to SVG in public template
    }
];

// Admin navigation links for admin.html
export const adminNavLinksData = [
    {
        name: 'Postingan',
        url: '#/postingan',
        icon: 'article'
    },
    {
        name: 'Statistik',
        url: '#/statistik',
        icon: 'bar_chart'
    },
    {
        name: 'Halaman',
        url: '#/halaman',
        icon: 'pages'
    },
    {
        name: 'Tata Letak',
        url: '#/tataletak',
        icon: 'dashboard'
    },
    {
        name: 'Tema',
        url: '#/tema',
        icon: 'palette'
    },
    {
        name: 'Setelan',
        url: '#/setelan',
        icon: 'settings'
    },
    {
        name: 'Lihat blog',
        url: '#/home', // Link back to the public home page
        icon: 'visibility'
    }
];

// SVG Icon Definitions for public template
export const svgIcons = {
    'home': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>`,
    'blog': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2zM5 10h14M5 14h14M5 18h14"></path></svg>`,
    'search': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
    'link': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.5 6H5.25A2.25 2.0 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path></svg>`,
    'about': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    'contact': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
    'phone': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>`,
    'admin_panel_settings': `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 21h4a2 2 0 002-2v-2a2 2 0 00-2-2h-4a2 2 0 00-2 2v2a2 2 0 002 2zM12 13V7m0 0V3m0 4h-4m4 0h4"></path></svg>`
};

export const getSvgIcon = (iconName) => {
    if (svgIcons[iconName]) {
        return svgIcons[iconName];
    }
    // Material Icons for admin panel
    const materialIconsMap = {
        'article': `<span class="material-icons">article</span>`,
        'bar_chart': `<span class="material-icons">bar_chart</span>`,
        'pages': `<span class="material-icons">pages</span>`,
        'dashboard': `<span class="material-icons">dashboard</span>`,
        'palette': `<span class="material-icons">palette</span>`,
        'settings': `<span class="material-icons">settings</span>`,
        'visibility': `<span class="material-icons">visibility</span>`,
        'admin_panel_settings': `<span class="material-icons">admin_panel_settings</span>`
    };
    if (materialIconsMap[iconName]) {
        return materialIconsMap[iconName];
    }
    console.warn(`Icon "${iconName}" not found. Defaulting to 'link' icon.`);
    return svgIcons['link']; // Default to 'link' icon if not found
};
