window.renderPartsTable = function (containerId, figure, model) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Helper function to convert text to title case
    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Helper function to truncate text and add tooltip if needed
    const truncateWithTooltip = (text, maxLength = 60) => {
        if (!text) return '';
        const titleCaseText = toTitleCase(text);
        
        if (titleCaseText.length <= maxLength) {
            return titleCaseText;
        }
        
        const truncated = titleCaseText.substring(0, maxLength) + '...';
        return `<span class="relative group cursor-help">
            ${truncated}
            <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-80 p-3 text-xs text-white bg-gray-900 rounded-lg shadow-lg dark:bg-gray-700">
                <div class="font-medium mb-1">Full Description:</div>
                <div class="leading-relaxed">${titleCaseText}</div>
                <div class="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
        </span>`;
    };

    container.innerHTML = `
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
            <div class="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 class="font-semibold text-sm md:text-base text-gray-800 dark:text-white">Parts List</h3>
            </div>
            <div class="overflow-x-auto">
                <!-- Mobile Card Layout -->
                <div id="parts-mobile-container" class="md:hidden">
                    <!-- Mobile cards will be inserted here -->
                </div>
                
                <!-- Desktop Table Layout -->
                <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400 hidden md:table table-fixed">
                    <thead class="bg-blue-50 dark:bg-blue-800 text-xs uppercase text-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" class="w-16 px-4 md:px-6 py-2 md:py-3 truncate">No</th>
                            <th scope="col" class="w-48 px-4 md:px-6 py-2 md:py-3 truncate">Part Number</th>
                            <th scope="col" class="px-4 md:px-6 py-2 md:py-3 truncate">Description</th>
                            <th scope="col" class="w-20 px-4 md:px-6 py-2 md:py-3 truncate">Qty</th>
                        </tr>
                    </thead>
                    <tbody id="parts-table-body" class="divide-y divide-gray-200 dark:divide-gray-800">

                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Function to fetch parts
    async function fetchParts(figure, model) {
        try {
            const response = await fetch(`${window.appsScriptUrl}?action=getParts&figure=${encodeURIComponent(figure)}&model=${encodeURIComponent(model)}`);
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            } else {
                console.error('Error fetching parts:', result.message);
                return [];
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }

    // Return a promise that resolves with the parts data
    return fetchParts(figure, model).then(parts => {
        const tbody = document.getElementById('parts-table-body');
        const mobileContainer = document.getElementById('parts-mobile-container');
        
        if (parts.length === 0) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-4 md:px-6 py-2 text-center text-xs md:text-sm">No parts found.</td></tr>';
            }
            if (mobileContainer) {
                mobileContainer.innerHTML = '<div class="p-4 text-center text-xs text-gray-500">No parts found.</div>';
            }
            return [];
        }

        // Render desktop table
        if (tbody) {
            tbody.innerHTML = parts.map((part, index) => {
                const displayNo = part.No || (index + 1);
                return `
                <tr id="part-row-${String(displayNo).trim()}" onclick="window.highlightHotspot('${String(displayNo).trim()}')" class="cursor-pointer transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50">
                    <td class="w-16 px-4 md:px-6 py-2 font-medium text-gray-900 dark:text-white text-xs md:text-sm truncate">${displayNo}</td>
                    <td class="w-48 px-4 md:px-6 py-2 text-xs md:text-sm truncate">
                        <span class="font-mono text-blue-600 dark:text-blue-400 font-medium">${part.PartNumber}</span>
                    </td>
                    <td class="px-4 md:px-6 py-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        ${truncateWithTooltip(part.Description)}
                    </td>
                    <td class="w-20 px-4 md:px-6 py-2 text-xs md:text-sm text-center truncate">${part.Qty || '-'}</td>
                </tr>
            `}).join('');
        }

        // Render mobile cards
        if (mobileContainer) {
            mobileContainer.innerHTML = parts.map((part, index) => {
                const displayNo = part.No || (index + 1);
                return `
                <div id="part-card-${String(displayNo).trim()}" onclick="window.highlightHotspot('${String(displayNo).trim()}')" class="cursor-pointer transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-700/50 border-b border-gray-200 dark:border-gray-800 p-3">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">${displayNo}</span>
                            <span class="font-mono text-blue-600 dark:text-blue-400 text-sm font-medium">${part.PartNumber}</span>
                        </div>
                        <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Qty: ${part.Qty || '-'}</span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-8">${toTitleCase(part.Description)}</p>
                </div>
            `}).join('');
        }

        return parts; // Resolve with parts data
    });
};

window.highlightPartRow = function (partNo) {
    // Remove existing highlights from both table rows and mobile cards
    const allRows = document.querySelectorAll('#parts-table-body tr');
    const allCards = document.querySelectorAll('[id^="part-card-"]');
    
    allRows.forEach(row => {
        row.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
        row.removeAttribute('tabindex');
    });
    
    allCards.forEach(card => {
        card.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
        card.removeAttribute('tabindex');
    });

    // Find and highlight the target row (desktop)
    const targetRow = document.getElementById(`part-row-${String(partNo).trim()}`);
    if (targetRow) {
        targetRow.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
        targetRow.setAttribute('tabindex', '-1'); // Make it focusable
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRow.focus({ preventScroll: true }); // Focus without extra scroll
    }

    // Find and highlight the target card (mobile)
    const targetCard = document.getElementById(`part-card-${String(partNo).trim()}`);
    if (targetCard) {
        targetCard.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
        targetCard.setAttribute('tabindex', '-1'); // Make it focusable
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.focus({ preventScroll: true }); // Focus without extra scroll
        
        // Add a brief pulse effect for better visibility on mobile
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            targetCard.style.animation = 'pulse 1s ease-in-out 2';
            setTimeout(() => {
                targetCard.style.animation = '';
            }, 2000);
        }
    }
};
