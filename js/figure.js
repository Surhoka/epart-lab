window.initFigurePage = function () {
    const app = window.app;
    const params = app ? app.params : {};
    let currentFiguresData = []; // Store fetched figures
    let vehicleData = []; // Store all vehicle model data

    const searchInput = document.getElementById('model-search');
    const suggestionsList = document.getElementById('search-suggestions');
    const gridContainerWrapper = document.getElementById('figure-grid-container');
    const gridContainer = document.getElementById('figure-grid');

    // New Elements
    const modelSelect = document.getElementById('model-select');
    const categorySelect = document.getElementById('category-select');
    const resetBtn = document.getElementById('reset-filters');

    // View Logic
    if (gridContainerWrapper) {
        gridContainerWrapper.classList.remove('hidden');
    }

    if (params.view === 'detail') {
        if (gridContainer) {
            gridContainer.className = ''; // Remove grid classes
            gridContainer.innerHTML = '<div class="text-center py-8">Loading figure details...</div>'; // Loading indicator
        }

        // Fetch data or render if already available
        if (currentFiguresData.length > 0) {
            renderDetailView(params);
        } else if (params.model) {
            // If we have model in params, try to fetch figures for it
            // Note: params.category might be undefined, which is fine (fetches all)
            fetchFigures(params.model, params.category || '');
        }

        // Breadcrumb
        if (typeof window.renderBreadcrumb === 'function') {
            window.renderBreadcrumb([
                { label: 'Home', link: '/' },
                { label: 'Figure', action: "window.navigate('figure')" },
                'Detail'
            ]);
        }
    } else {
        // Show List
        if (gridContainer) {
            gridContainer.className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3';
            gridContainer.innerHTML = ''; // Clear content
        }
        // Breadcrumb
        if (typeof window.renderBreadcrumb === 'function') {
            window.renderBreadcrumb('Figure');
        }
    }

    // Function to fetch vehicle models
    async function fetchVehicleModels() {
        try {
            const response = await fetch(`${window.appsScriptUrl}?action=getVehicleModels`);
            const result = await response.json();
            if (result.status === 'success') {
                return result.data;
            } else {
                console.error('Error fetching models:', result.message);
                return [];
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return [];
        }
    }

    // Function to fetch figures
    async function fetchFigures(model, category) {
        if (!gridContainer) return;

        // Update UI to show loading
        gridContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading figures...</div>';

        try {
            const response = await fetch(`${window.appsScriptUrl}?action=getFigures&model=${encodeURIComponent(model)}&category=${encodeURIComponent(category)}`);
            const result = await response.json();

            if (result.status === 'success') {
                currentFiguresData = result.data;

                // Check current view state
                const currentParams = window.app ? window.app.params : {};
                if (currentParams.view === 'detail') {
                    renderDetailView(currentParams);
                } else {
                    renderFigures(result.data);
                }
            } else {
                gridContainer.innerHTML = `<div class="col-span-full text-center py-8 text-red-500">Error: ${result.message}</div>`;
            }
        } catch (error) {
            console.error('Fetch error:', error);
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">Failed to load figures.</div>';
        }
    }

    function renderFigures(data) {
        if (!gridContainer) return;

        gridContainer.className = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3';

        if (data.length === 0) {
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8">No figures found for this selection.</div>';
            return;
        }

        gridContainer.innerHTML = data.map(item => `
            <div onclick="window.navigate('figure', { view: 'detail', figure: '${item.Figure}', title: '${item.Title}', model: '${item.VehicleModel}', category: '${item.Category || ''}' })" class="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col hover:shadow-lg transition-shadow">
                <!-- Image -->
                <div class="mb-4 w-full flex items-center justify-center">
                    ${item.FigureUrl ? `
                        <img src="${item.FigureUrl}" alt="${item.Title}" class="w-full h-auto max-h-96 object-contain" />
                    ` : `
                        <div class="flex h-64 w-full items-center justify-center">
                            <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    `}
                </div>

                <!-- Figure and Title -->
                <div class="flex flex-col justify-between min-h-[4.5rem]">
                    <h3 class="text-base font-semibold text-gray-500 dark:text-white/90 line-clamp-2">
                        ${item.Figure} | ${item.Title}
                    </h3>
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">${item.VehicleModel}</p>
                </div>
            </div>
        `).join('');
    }

    function renderDetailView(params) {
        if (!gridContainer) return;

        // Ensure grid classes are removed for detail view
        gridContainer.className = '';

        const selectedFigure = params.figure;

        // Find current index for back/forward navigation
        const currentIndex = currentFiguresData.findIndex(item => item.Figure === selectedFigure);
        const prevFigure = currentIndex > 0 ? currentFiguresData[currentIndex - 1] : null;
        const nextFigure = currentIndex < currentFiguresData.length - 1 ? currentFiguresData[currentIndex + 1] : null;

        // Generate Sidebar List
        const sidebarList = currentFiguresData.map(item => {
            const isActive = item.Figure === selectedFigure;
            const activeClass = isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800';
            return `
                <li class="cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors ${activeClass}"
                    onclick="window.navigate('figure', { view: 'detail', figure: '${item.Figure}', title: '${item.Title}', model: '${item.VehicleModel}', category: '${item.Category || ''}' })">
                    ${item.Figure} ${item.Title}
                </li>
            `;
        }).join('');

        gridContainer.innerHTML = `
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div class="grid grid-cols-1 lg:grid-cols-12">
                    <!-- Sidebar -->
                    <div class="lg:col-span-3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
                             <div class="flex items-center justify-between mb-3">
                                <button onclick="window.navigate('figure')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Back to List
                                </button>
                                <div class="flex items-center gap-2">
                                    <button onclick="${prevFigure ? `window.navigate('figure', { view: 'detail', figure: '${prevFigure.Figure}', title: '${prevFigure.Title}', model: '${prevFigure.VehicleModel}', category: '${prevFigure.Category || ''}' })` : ''}" class="flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800 ${!prevFigure ? 'opacity-50 cursor-not-allowed' : ''}" ${!prevFigure ? 'disabled' : ''}>
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                    <button onclick="${nextFigure ? `window.navigate('figure', { view: 'detail', figure: '${nextFigure.Figure}', title: '${nextFigure.Title}', model: '${nextFigure.VehicleModel}', category: '${nextFigure.Category || ''}' })` : ''}" class="flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800 ${!nextFigure ? 'opacity-50 cursor-not-allowed' : ''}" ${!nextFigure ? 'disabled' : ''}>
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                </div>
                            </div>
                            <!-- Reset Button -->
                            <button onclick="window.navigate('figure')" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium text-sm">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 3.125C6.20312 3.125 3.125 6.20312 3.125 10C3.125 11.7734 3.79688 13.3906 4.90625 14.625L3.65625 15.875C2.1875 14.3281 1.25 12.2812 1.25 10C1.25 5.17188 5.17188 1.25 10 1.25C14.8281 1.25 18.75 5.17188 18.75 10C18.75 14.8281 14.8281 18.75 10 18.75C8.82812 18.75 7.70312 18.5156 6.67188 18.0938L8.03125 16.4375C8.64062 16.6875 9.29688 16.875 10 16.875C13.7969 16.875 16.875 13.7969 16.875 10C16.875 6.20312 13.7969 3.125 10 3.125Z" fill="currentColor"/>
                                    <path d="M2.5 5.625H5.625V2.5H4.375V4.17188L2.5 5.625Z" fill="currentColor"/>
                                </svg>
                                Reset to Figure List
                            </button>
                        </div>
                        <div class="p-3 h-[calc(100vh-300px)] overflow-y-auto sidebar-scrollbar">
                            <ul class="space-y-1">
                                ${sidebarList}
                            </ul>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="lg:col-span-9 p-6 lg:p-8">
                         <div class="mb-6">
                            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1"> ${params.figure} | ${params.title}</h2>
                            <p class="text-sm text-gray-500">Model: ${params.model || '-'}</p>
                        </div>

                        <div id="figure-image-container" class="relative flex justify-center items-center bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-8 min-h-[400px] mb-8">
                             ${currentFiguresData.find(i => i.Figure === params.figure)?.FigureUrl ? `
                                <img src="${currentFiguresData.find(i => i.Figure === params.figure).FigureUrl}" alt="${params.title}" class="w-full h-auto object-contain" />
                             ` : `
                                <div class="text-center text-gray-400">
                                    <svg class="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>No image available</p>
                                </div>
                             `}
                        </div>

                        <!-- Parts Table Container -->
                        <div id="parts-table-container"></div>
                    </div>
                </div>
            </div>
        `;

        // Render Parts Table and Hotspots
        if (typeof window.renderPartsTable === 'function' && typeof window.fetchHotspots === 'function') {
            Promise.all([
                window.renderPartsTable('parts-table-container', params.figure, params.model),
                window.fetchHotspots(params.figure, params.model)
            ]).then(([parts, hotspots]) => {
                // Render Hotspots
                if (typeof window.renderHotspots === 'function') {
                    // Merge parts data into hotspots
                    const hotspotsWithData = hotspots.map(hotspot => {
                        let matchedPart = null;
                        let matchedId = null;

                        // Iterate parts to find match using normalized number
                        for (let i = 0; i < parts.length; i++) {
                            const p = parts[i];
                            const partNo = p.No || (i + 1);
                            if (String(partNo).trim() === String(hotspot.label).trim()) {
                                matchedPart = p;
                                matchedId = String(partNo).trim();
                                break;
                            }
                        }

                        return {
                            ...hotspot,
                            title: matchedPart ? matchedPart.PartNumber : 'Unknown Part',
                            content: matchedPart ? matchedPart.Description : 'No description available.',
                            matchedPartNo: matchedId // Store matched ID
                        };
                    });

                    window.renderHotspots('figure-image-container', hotspotsWithData, (clickedHotspot) => {
                        // Handle Hotspot Click
                        if (typeof window.highlightPartRow === 'function') {
                            // Use matchedPartNo if available, otherwise fallback to label (trimmed)
                            const targetId = clickedHotspot.matchedPartNo || String(clickedHotspot.label).trim();
                            window.highlightPartRow(targetId);
                        }
                    });

                }
            }).catch(error => {
                console.error('Error loading detail view data:', error);
            });
        }
    }

    if (searchInput && suggestionsList && gridContainerWrapper) {
        // Fetch models on init
        fetchVehicleModels().then(data => {
            vehicleData = data; // Store globally

            // Populate Model Dropdown
            const uniqueModels = [...new Set(data.map(item => item.model))].sort();
            uniqueModels.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });

            // Handle Model Change
            modelSelect.addEventListener('change', function () {
                const selectedModel = this.value;

                // Reset Category Dropdown
                categorySelect.innerHTML = '<option value="">All Categories</option>';

                if (selectedModel) {
                    // Filter categories for this model
                    const categories = data
                        .filter(item => item.model === selectedModel)
                        .map(item => item.category)
                        .filter(Boolean) // Remove null/undefined
                        .sort();

                    // Deduplicate
                    const uniqueCategories = [...new Set(categories)];

                    uniqueCategories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        categorySelect.appendChild(option);
                    });

                    // Fetch figures for this model (all categories)
                    fetchFigures(selectedModel, '');
                } else {
                    // Clear grid if no model selected
                    gridContainer.innerHTML = '';
                }
            });

            // Handle Category Change
            categorySelect.addEventListener('change', function () {
                const selectedModel = modelSelect.value;
                const selectedCategory = this.value;

                if (selectedModel) {
                    fetchFigures(selectedModel, selectedCategory);
                }
            });

            // Handle Reset
            resetBtn.addEventListener('click', function () {
                modelSelect.value = '';
                categorySelect.innerHTML = '<option value="">All Categories</option>';
                categorySelect.value = '';
                searchInput.value = '';
                gridContainer.innerHTML = '';
                suggestionsList.classList.add('hidden');
            });


            // Search Input Logic (Keep existing logic but maybe sync with dropdowns?)
            searchInput.addEventListener('input', function () {
                const query = this.value.toLowerCase();
                suggestionsList.innerHTML = '';

                if (query.length > 0) {
                    const filteredModels = vehicleData.filter(item =>
                        String(item.model).toLowerCase().includes(query) ||
                        String(item.category).toLowerCase().includes(query)
                    );

                    if (filteredModels.length > 0) {
                        suggestionsList.classList.remove('hidden');
                        filteredModels.forEach(item => {
                            const li = document.createElement('li');
                            li.className = 'px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer text-black dark:text-white';
                            li.textContent = `${item.model} : ${item.category}`;
                            li.addEventListener('click', function () {
                                searchInput.value = item.model;
                                suggestionsList.classList.add('hidden');

                                // Sync Dropdowns
                                modelSelect.value = item.model;
                                // Trigger change event manually to update categories
                                modelSelect.dispatchEvent(new Event('change'));

                                // After categories update, set category if available
                                setTimeout(() => {
                                    if (item.category) {
                                        categorySelect.value = item.category;
                                        // Fetch specific category
                                        fetchFigures(item.model, item.category);
                                    }
                                }, 100); // Small delay to allow dropdown population
                            });
                            suggestionsList.appendChild(li);
                        });
                    } else {
                        suggestionsList.classList.add('hidden');
                    }
                } else {
                    suggestionsList.classList.add('hidden');
                }
            });
        });
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        if (searchInput && !searchInput.contains(e.target) && suggestionsList && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('hidden');
        }
    });
};
