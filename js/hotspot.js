window.renderHotspots = function (containerId, hotspotsData, onHotspotClick) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    const image = container.querySelector('img');
    if (!image) {
        console.error(`Image tag not found inside container '${containerId}'.`);
        return;
    }

    // Ensure container is relative for positioning the new overlay
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    // Find or create the dedicated overlay for hotspots
    let overlay = container.querySelector('.hotspot-overlay-wrapper');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'hotspot-overlay-wrapper';
        overlay.style.position = 'absolute';
        // For debugging the overlay itself:
        // overlay.style.border = '2px solid limegreen'; 
        container.appendChild(overlay);
    }

    // Clear previous hotspots from the overlay
    overlay.innerHTML = '';

    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const setupHotspots = () => {
        // Size and position the overlay to perfectly match the image's rendered dimensions
        overlay.style.left = `${image.offsetLeft}px`;
        overlay.style.top = `${image.offsetTop}px`;
        overlay.style.width = `${image.offsetWidth}px`;
        overlay.style.height = `${image.offsetHeight}px`;

        if (!hotspotsData || !Array.isArray(hotspotsData) || hotspotsData.length === 0) {
            return;
        }

        // Now, create and append hotspots to the correctly sized and positioned overlay
        hotspotsData.forEach((hotspot, index) => {
            const point = document.createElement('div');
            point.className = 'hotspot-point absolute w-6 h-6 -ml-3 -mt-3 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 z-50 flex items-center justify-center group';
            point.style.left = `${hotspot.x}%`;
            point.style.top = `${hotspot.y}%`;

            if (hotspot.label) {
                point.innerHTML = `<span class="text-[10px] font-bold text-white">${hotspot.label}</span>`;
                point.dataset.label = String(hotspot.label).trim();
            }

            if (typeof onHotspotClick === 'function') {
                point.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onHotspotClick(hotspot);
                });
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[12rem] bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 pointer-events-none';
            tooltip.innerHTML = `
                <div class="font-semibold mb-0.5 border-b border-gray-200 dark:border-gray-700 pb-0.5">${hotspot.partNumber || 'N/A'}</div>
                <div class="text-gray-600 dark:text-gray-300 leading-tight">${toTitleCase(hotspot.description) || 'No description'}</div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
            `;

            point.appendChild(tooltip);
            overlay.appendChild(point);
        });
    };

    // If the image is already rendered, set up the hotspots. Otherwise, wait for it to load.
    if (image.complete && image.naturalWidth !== 0) {
        setupHotspots();
    } else {
        image.addEventListener('load', setupHotspots, { once: true });
    }
};

window.fetchHotspots = async function (figure, model) {
    try {
        const response = await fetch(`${window.appsScriptUrl}?action=getHotspots&figure=${encodeURIComponent(figure)}&model=${encodeURIComponent(model)}`);
        const result = await response.json();
        if (result.status === 'success') {
            return result.data;
        } else {
            console.error('Error fetching hotspots:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return [];
    }
};

window.highlightHotspot = function (label) {
    // Remove existing highlights
    const allHotspots = document.querySelectorAll('.hotspot-point');
    allHotspots.forEach(point => {
        point.classList.remove('ring-4', 'ring-yellow-400', 'scale-125', 'z-[60]');
        point.classList.add('z-50'); // Reset z-index
    });

    // Find target hotspot
    const targetHotspot = document.querySelector(`.hotspot-point[data-label="${String(label).trim()}"]`);
    if (targetHotspot) {
        targetHotspot.classList.remove('z-50');
        targetHotspot.classList.add('ring-4', 'ring-yellow-400', 'scale-125', 'z-[60]');
        targetHotspot.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
};
