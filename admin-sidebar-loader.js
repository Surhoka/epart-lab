import { adminNavLinksData } from 'https://rawcdn.githack.com/Surhoka/epart-lab/main/navigation.js';

// Ensure buildNav is available globally before attempting to call it
if (window.buildNav) {
    window.buildNav(adminNavLinksData);
} else {
    console.error('buildNav function not found on window object.');
}
