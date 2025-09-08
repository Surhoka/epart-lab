// File: src/router.js
// Deskripsi: Mengelola routing sisi klien dan menampilkan bagian yang sesuai.

import { initFigureViewer } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/figure-viewer.js';
import { initGallery } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/gallery.js';
import { renderPostList, renderPostDetail, renderLabels } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/ui.js';

const validSections = ['home', 'tentang', 'kontak', 'figure-viewer', 'figure-gallery'];

export function showSection(sectionId, params = {}) {
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.add('hidden');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');

        switch (sectionId) {
            case 'home':
                // renderPostList(1); // This might be handled by default content
                // renderLabels();
                break;
            case 'figure-viewer':
                initFigureViewer(params);
                break;
            case 'figure-gallery':
                initGallery(params);
                break;
        }
    }
    updateActiveNavLink();
}

function handleRouteChange() {
    const hash = window.location.hash.substring(1);
    const [sectionId, queryString] = hash.split('?');
    
    const paramsObject = {};
    if (queryString) {
        const params = new URLSearchParams(queryString);
        for (const [key, value] of params.entries()) {
            paramsObject[key] = value;
        }
    }

    if (sectionId && validSections.includes(sectionId)) {
        showSection(sectionId, paramsObject);
    } else {
        showSection('home');
    }
}

export function initRouter() {
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('load', () => {
        // Delay initial routing to allow data to be loaded
        setTimeout(handleRouteChange, 100);
    });
}

function updateActiveNavLink() {
    const currentHash = window.location.hash.substring(1).split('?')[0] || 'home';
    document.querySelectorAll('.main-menu-item').forEach(link => {
        link.classList.remove('active');
        const linkHash = link.getAttribute('href')?.substring(1).split('?')[0];
        if (linkHash === currentHash) {
            link.classList.add('active');
        }
    });
}
