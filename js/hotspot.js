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

    // Clean up any existing hotspot setup first
    if (container._hotspotCleanup) {
        container._hotspotCleanup();
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
        overlay.style.pointerEvents = 'none'; // Allow clicks to pass through overlay
        container.appendChild(overlay);
    }

    // Clear previous hotspots from the overlay
    overlay.innerHTML = '';

    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const setupHotspots = () => {
        // Clear any existing hotspots first
        overlay.innerHTML = '';

        // Get the image's current rendered dimensions and position
        const imageLeft = image.offsetLeft;
        const imageTop = image.offsetTop;
        const imageWidth = image.offsetWidth;
        const imageHeight = image.offsetHeight;

        // Size and position the overlay to perfectly match the image's rendered dimensions
        overlay.style.left = `${imageLeft}px`;
        overlay.style.top = `${imageTop}px`;
        overlay.style.width = `${imageWidth}px`;
        overlay.style.height = `${imageHeight}px`;

        if (!hotspotsData || !Array.isArray(hotspotsData) || hotspotsData.length === 0) {
            return;
        }

        // Now, create and append hotspots to the correctly sized and positioned overlay
        hotspotsData.forEach((hotspot) => {
            const point = document.createElement('div');
            // Responsive hotspot size: smaller on mobile, larger on desktop
            point.className = 'hotspot-point absolute w-5 h-5 md:w-6 md:h-6 -ml-2.5 -mt-2.5 md:-ml-3 md:-mt-3 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer transform transition-transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center group';
            point.style.pointerEvents = 'auto'; // Enable clicks on hotspot points
            
            // Use precise positioning based on image dimensions
            const leftPos = (hotspot.x / 100) * imageWidth;
            const topPos = (hotspot.y / 100) * imageHeight;
            
            point.style.left = `${leftPos}px`;
            point.style.top = `${topPos}px`;

            if (hotspot.label) {
                // Responsive text size
                point.innerHTML = `<span class="text-[8px] md:text-[10px] font-bold text-white">${hotspot.label}</span>`;
                point.dataset.label = String(hotspot.label).trim();
            }

            if (typeof onHotspotClick === 'function') {
                point.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onHotspotClick(hotspot);
                });

                // Add touch support for mobile
                point.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onHotspotClick(hotspot);
                });
            }

            const tooltip = document.createElement('div');
            // Mobile-responsive tooltip
            tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 md:mb-2 w-max max-w-[10rem] md:max-w-[12rem] bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-[10px] md:text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 md:p-2 pointer-events-none';
            
            // Check if tooltip would go off-screen on mobile and adjust position
            const isMobile = window.innerWidth < 768;
            if (isMobile && hotspot.x > 70) {
                // If hotspot is on the right side, show tooltip on the left
                tooltip.className = tooltip.className.replace('left-1/2 transform -translate-x-1/2', 'right-0');
            } else if (isMobile && hotspot.x < 30) {
                // If hotspot is on the left side, show tooltip on the right
                tooltip.className = tooltip.className.replace('left-1/2 transform -translate-x-1/2', 'left-0');
            }

            tooltip.innerHTML = `
                <div class="font-semibold mb-0.5 border-b border-gray-200 dark:border-gray-700 pb-0.5 text-[9px] md:text-xs">${hotspot.partNumber || hotspot.title || 'N/A'}</div>
                <div class="text-gray-600 dark:text-gray-300 leading-tight text-[8px] md:text-[10px]">${toTitleCase(hotspot.description || hotspot.content) || 'No description'}</div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-gray-800"></div>
            `;

            point.appendChild(tooltip);
            overlay.appendChild(point);
        });
    };

    // Function to handle resize events with proper cleanup
    const handleResize = () => {
        // Debounce resize events
        if (container._resizeTimeout) {
            clearTimeout(container._resizeTimeout);
        }
        container._resizeTimeout = setTimeout(() => {
            setupHotspots();
        }, 100);
    };

    // If the image is already rendered, set up the hotspots. Otherwise, wait for it to load.
    if (image.complete && image.naturalWidth !== 0) {
        setupHotspots();
    } else {
        image.addEventListener('load', setupHotspots, { once: true });
    }

    // Add resize listener to recalculate positions when screen size changes
    window.addEventListener('resize', handleResize);
    
    // Store cleanup function for later use
    container._hotspotCleanup = () => {
        window.removeEventListener('resize', handleResize);
        if (container._resizeTimeout) {
            clearTimeout(container._resizeTimeout);
            delete container._resizeTimeout;
        }
        // Remove the overlay
        const existingOverlay = container.querySelector('.hotspot-overlay-wrapper');
        if (existingOverlay) {
            existingOverlay.remove();
        }
    };
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

// Cleanup function to remove event listeners
window.cleanupHotspots = function (containerId) {
    const container = document.getElementById(containerId);
    if (container && container._hotspotCleanup) {
        container._hotspotCleanup();
        delete container._hotspotCleanup;
    }
};

window.highlightHotspot = function (label) {
    // Remove existing highlights
    const allHotspots = document.querySelectorAll('.hotspot-point');
    allHotspots.forEach(point => {
        point.classList.remove('ring-4', 'ring-yellow-400', 'scale-125', 'z-[60]', 'ring-2', 'ring-yellow-300', 'scale-110');
        point.classList.add('z-50'); // Reset z-index
    });

    // Find target hotspot
    const targetHotspot = document.querySelector(`.hotspot-point[data-label="${String(label).trim()}"]`);
    if (targetHotspot) {
        targetHotspot.classList.remove('z-50');
        
        // Responsive highlight: smaller ring on mobile
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            targetHotspot.classList.add('ring-2', 'ring-yellow-300', 'scale-110', 'z-[60]');
        } else {
            targetHotspot.classList.add('ring-4', 'ring-yellow-400', 'scale-125', 'z-[60]');
        }
        
        targetHotspot.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        
        // Add a brief pulse effect for better visibility on mobile
        if (isMobile) {
            targetHotspot.style.animation = 'pulse 1s ease-in-out 2';
            setTimeout(() => {
                targetHotspot.style.animation = '';
            }, 2000);
        }
    }
};
