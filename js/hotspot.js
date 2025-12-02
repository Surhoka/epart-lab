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
        point.className = 'hotspot-point absolute w-6 h-6 -ml-3 -mt-3 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 z-50 flex items-center justify-center group';
        point.style.left = `${hotspot.x}%`;
        point.style.top = `${hotspot.y}%`;

        // Optional: Add a label or number inside the dot
        if (hotspot.label) {
            point.innerHTML = `<span class="text-[10px] font-bold text-white">${hotspot.label}</span>`;
            point.dataset.label = String(hotspot.label).trim(); // Store label for reverse lookup
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
        tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[12rem] bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 pointer-events-none';
        tooltip.innerHTML = `
            <div class="font-semibold mb-0.5 border-b border-gray-200 dark:border-gray-700 pb-0.5">${hotspot.partNumber || 'N/A'}</div>
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

window.enableHotspotDebug = function(containerId, maxWaitTime = 5000) {
    // 1. Create/get the debug box immediately, so the user knows the script is running.
    let debugBox = document.getElementById('hotspot-debug-box');
    if (!debugBox) {
        debugBox = document.createElement('div');
        debugBox.id = 'hotspot-debug-box';
        debugBox.style.position = 'fixed';
        debugBox.style.bottom = '10px';
        debugBox.style.left = '10px';
        debugBox.style.padding = '10px';
        debugBox.style.backgroundColor = 'rgba(0,0,0,0.75)';
        debugBox.style.color = 'white';
        debugBox.style.zIndex = '10000';
        debugBox.style.fontFamily = 'monospace';
        debugBox.style.fontSize = '14px';
        debugBox.style.borderRadius = '5px';
        debugBox.style.pointerEvents = 'none'; // Make it non-interactive
        document.body.appendChild(debugBox);
    }
    debugBox.innerHTML = `Mencari kontainer: #${containerId}...`;

    const interval = 100; // check every 100ms
    let elapsedTime = 0;

    const tryToAttachListener = () => {
        const container = document.getElementById(containerId);
        if (container) {
            // Container found, attach the listener
            debugBox.innerHTML = 'Hotspot debug aktif. Klik pada area gambar untuk melihat koordinat.';
            
            // VISUAL DEBUG: Add borders to diagnose layout issues
            container.style.border = '3px solid red';
            const imageInside = container.querySelector('img');
            if (imageInside) {
                imageInside.style.border = '3px solid blue';
                debugBox.innerHTML += '<br>Bingkai: Merah=Kontainer, Biru=Gambar';
            } else {
                debugBox.innerHTML += '<br>Peringatan: Tag &lt;img&gt; tidak ditemukan di dalam kontainer.';
            }


            container.addEventListener('click', function(e) {
                // Prevent event from bubbling to hotspot points
                if (e.target.classList.contains('hotspot-point') || e.target.parentElement.classList.contains('hotspot-point')) {
                    return;
                }

                const rect = container.getBoundingClientRect();
                const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                const yPct = ((e.clientY - rect.top) / rect.height) * 100;

                const logMessage = `Clicked: x=${xPct.toFixed(4)}%, y=${yPct.toFixed(4)}%`;
                console.log(logMessage);
                
                // Also show the absolute pixel coordinates relative to the container
                const x_abs = e.clientX - rect.left;
                const y_abs = e.clientY - rect.top;
                
                debugBox.innerHTML = `${logMessage}<br>Pixels: x=${x_abs.toFixed(2)}, y=${y_abs.toFixed(2)}`;
                debugBox.innerHTML += '<br>Bingkai: Merah=Kontainer, Biru=Gambar';
            });
            console.log(`Hotspot debug terpasang pada #${containerId}.`);
        } else {
            // Container not found, check again if time allows
            elapsedTime += interval;
            if (elapsedTime < maxWaitTime) {
                setTimeout(tryToAttachListener, interval);
            } else {
                // Timed out
                debugBox.innerHTML = `Error: Kontainer #${containerId} tidak ditemukan setelah ${maxWaitTime / 1000} detik.`;
                console.error(`Could not find container with ID '${containerId}' after ${maxWaitTime}ms.`);
            }
        }
    };

    // Start the process
    tryToAttachListener();
};
