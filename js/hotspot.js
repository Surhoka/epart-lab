window.renderHotspots = function (containerId, hotspotsData, onHotspotClick) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    // Ensure container is relative for absolute positioning of hotspots
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    // Remove existing hotspots if any
    const existingHotspots = container.querySelectorAll('.hotspot-point');
    existingHotspots.forEach(el => el.remove());

    if (!hotspotsData || !Array.isArray(hotspotsData) || hotspotsData.length === 0) {
        return;
    }

    hotspotsData.forEach((hotspot, index) => {
        // Create Hotspot Point
        const point = document.createElement('div');
        point.className = 'hotspot-point absolute w-6 h-6 -ml-3 -mt-3 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 z-10 flex items-center justify-center group';
        point.style.left = `${hotspot.x}%`;
        point.style.top = `${hotspot.y}%`;

        // Optional: Add a label or number inside the dot
        if (hotspot.label) {
            point.innerHTML = `<span class="text-[10px] font-bold text-white">${hotspot.label}</span>`;
        }

        // Add Click Listener
        if (typeof onHotspotClick === 'function') {
            point.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent bubbling
                onHotspotClick(hotspot);
            });
        }

        // Create Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 p-3 pointer-events-none';
        tooltip.innerHTML = `
            <div class="font-semibold mb-1 border-b border-gray-200 dark:border-gray-700 pb-1">${hotspot.partNumber || 'N/A'}</div>
            <div class="text-gray-600 dark:text-gray-300 leading-tight">${hotspot.description || 'No description'}</div>
            <!-- Arrow -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
        `;

        point.appendChild(tooltip);
        container.appendChild(point);
    });
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
