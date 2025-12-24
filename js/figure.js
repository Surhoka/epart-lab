window.initFigurePage = function () {
    const app = window.app;
    const params = app ? app.params : {};
    let currentFiguresData = []; // Store fetched figures
    let vehicleData = []; // Store all vehicle model data

    // Mobile elements
    const searchInput = document.getElementById('model-search');
    const suggestionsList = document.getElementById('search-suggestions');
    const modelSelect = document.getElementById('model-select');
    const categorySelect = document.getElementById('category-select');
    const resetBtn = document.getElementById('reset-filters');

    // Desktop elements
    const searchInputDesktop = document.getElementById('model-search-desktop');
    const suggestionsListDesktop = document.getElementById('search-suggestions-desktop');
    const modelSelectDesktop = document.getElementById('model-select-desktop');
    const categorySelectDesktop = document.getElementById('category-select-desktop');
    const resetBtnDesktop = document.getElementById('reset-filters-desktop');

    const gridContainerWrapper = document.getElementById('figure-grid-container');
    const gridContainer = document.getElementById('figure-grid');

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
            gridContainer.className = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-4';
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

        gridContainer.className = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 md:gap-4';

        if (data.length === 0) {
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8">No figures found for this selection.</div>';
            return;
        }

        gridContainer.innerHTML = data.map(item => `
            <div onclick="window.navigate('figure', { view: 'detail', figure: '${item.Figure}', title: '${item.Title}', model: '${item.VehicleModel}', category: '${item.Category || ''}' })" class="cursor-pointer rounded-2xl border border-gray-200 bg-white p-3 md:p-4 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col hover:shadow-lg transition-shadow">
                <!-- Image -->
                <div class="mb-3 md:mb-4 w-full flex items-center justify-center">
                    ${item.FigureUrl ? `
                        <img src="${item.FigureUrl}" alt="${item.Title}" class="w-full h-auto max-h-64 md:max-h-96 object-contain" />
                    ` : `
                        <div class="flex h-48 md:h-64 w-full items-center justify-center">
                            <svg class="h-10 w-10 md:h-12 md:w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    `}
                </div>

                <!-- Figure and Title -->
                <div class="flex flex-col justify-between min-h-[4rem] md:min-h-[4.5rem]">
                    <h3 class="text-sm md:text-base font-semibold text-gray-500 dark:text-white/90 line-clamp-2">
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
                        <div class="p-3 md:p-4 border-b border-gray-200 dark:border-gray-800">
                             <div class="flex items-center justify-between">
                                <button onclick="window.navigate('figure')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium">
                                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    Back to List
                                </button>
                                <div class="flex items-center gap-1 md:gap-2">
                                    <button onclick="${prevFigure ? `window.navigate('figure', { view: 'detail', figure: '${prevFigure.Figure}', title: '${prevFigure.Title}', model: '${prevFigure.VehicleModel}', category: '${prevFigure.Category || ''}' })` : ''}" class="flex items-center justify-center rounded-md p-1.5 md:p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800 ${!prevFigure ? 'opacity-50 cursor-not-allowed' : ''}" ${!prevFigure ? 'disabled' : ''}>
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                    <button onclick="${nextFigure ? `window.navigate('figure', { view: 'detail', figure: '${nextFigure.Figure}', title: '${nextFigure.Title}', model: '${nextFigure.VehicleModel}', category: '${nextFigure.Category || ''}' })` : ''}" class="flex items-center justify-center rounded-md p-1.5 md:p-2 text-gray-500 hover:bg-gray-100 hover:text-primary dark:hover:bg-gray-800 ${!nextFigure ? 'opacity-50 cursor-not-allowed' : ''}" ${!nextFigure ? 'disabled' : ''}>
                                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="p-2 md:p-3 h-[calc(100vh-300px)] overflow-y-auto sidebar-scrollbar">
                            <ul class="space-y-1">
                                ${sidebarList}
                            </ul>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="lg:col-span-9 p-4 md:p-6 lg:p-8">
                         <div class="mb-4 md:mb-6">
                            <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-1"> ${params.figure} | ${params.title}</h2>
                            <p class="text-sm text-gray-500">Model: ${params.model || '-'}</p>
                        </div>

                        <div id="figure-image-container" class="relative flex justify-center items-center bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4 md:p-8 min-h-[300px] md:min-h-[400px] mb-6 md:mb-8">
                             ${currentFiguresData.find(i => i.Figure === params.figure)?.FigureUrl ? `
                                <img src="${currentFiguresData.find(i => i.Figure === params.figure).FigureUrl}" alt="${params.title}" class="w-full h-auto object-contain" />
                             ` : `
                                <div class="text-center text-gray-400">
                                    <svg class="mx-auto h-12 w-12 md:h-16 md:w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p class="text-sm md:text-base">No image available</p>
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

    // Helper function to sync dropdowns
    function syncDropdowns(sourceModel, sourceCategory, targetModel, targetCategory) {
        if (targetModel && targetCategory) {
            targetModel.value = sourceModel.value;
            targetCategory.innerHTML = sourceCategory.innerHTML;
            targetCategory.value = sourceCategory.value;
        }
    }

    // Helper function to populate model dropdowns
    function populateModelDropdowns(data, selects) {
        const uniqueModels = [...new Set(data.map(item => item.model))].sort();
        selects.forEach(select => {
            if (select) {
                uniqueModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    select.appendChild(option);
                });
            }
        });
    }

    // Helper function to handle model change
    function handleModelChange(selectedModel, categorySelects, data) {
        // Reset Category Dropdowns
        categorySelects.forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">All Categories</option>';
            }
        });

        if (selectedModel) {
            // Filter categories for this model
            const categories = data
                .filter(item => item.model === selectedModel)
                .map(item => item.category)
                .filter(Boolean) // Remove null/undefined
                .sort();

            // Deduplicate
            const uniqueCategories = [...new Set(categories)];

            categorySelects.forEach(select => {
                if (select) {
                    uniqueCategories.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        select.appendChild(option);
                    });
                }
            });

            // Fetch figures for this model (all categories)
            fetchFigures(selectedModel, '');
        } else {
            // Clear grid if no model selected
            if (gridContainer) gridContainer.innerHTML = '';
        }
    }

    // Helper function to handle reset
    function handleReset() {
        [modelSelect, modelSelectDesktop].forEach(select => {
            if (select) select.value = '';
        });
        [categorySelect, categorySelectDesktop].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">All Categories</option>';
                select.value = '';
            }
        });
        [searchInput, searchInputDesktop].forEach(input => {
            if (input) input.value = '';
        });
        if (gridContainer) gridContainer.innerHTML = '';
        [suggestionsList, suggestionsListDesktop].forEach(list => {
            if (list) list.classList.add('hidden');
        });
    }

    // Helper function to handle search input
    function handleSearchInput(input, suggestions, otherInput) {
        const query = input.value.toLowerCase();
        suggestions.innerHTML = '';

        if (query.length > 0) {
            const filteredModels = vehicleData.filter(item =>
                String(item.model).toLowerCase().includes(query) ||
                String(item.category).toLowerCase().includes(query)
            );

            if (filteredModels.length > 0) {
                suggestions.classList.remove('hidden');
                filteredModels.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer text-black dark:text-white';
                    li.textContent = `${item.model} : ${item.category}`;
                    li.addEventListener('click', function () {
                        input.value = item.model;
                        if (otherInput) otherInput.value = item.model;
                        suggestions.classList.add('hidden');

                        // Sync Dropdowns
                        [modelSelect, modelSelectDesktop].forEach(select => {
                            if (select) select.value = item.model;
                        });
                        
                        // Trigger change event manually to update categories
                        if (modelSelect) modelSelect.dispatchEvent(new Event('change'));

                        // After categories update, set category if available
                        setTimeout(() => {
                            if (item.category) {
                                [categorySelect, categorySelectDesktop].forEach(select => {
                                    if (select) select.value = item.category;
                                });
                                // Fetch specific category
                                fetchFigures(item.model, item.category);
                            }
                        }, 100); // Small delay to allow dropdown population
                    });
                    suggestions.appendChild(li);
                });
            } else {
                suggestions.classList.add('hidden');
            }
        } else {
            suggestions.classList.add('hidden');
        }
    }

    if (gridContainerWrapper) {
        // Fetch models on init
        fetchVehicleModels().then(data => {
            vehicleData = data; // Store globally

            // Populate Model Dropdowns
            populateModelDropdowns(data, [modelSelect, modelSelectDesktop]);

            // Handle Model Change - Mobile
            if (modelSelect) {
                modelSelect.addEventListener('change', function () {
                    const selectedModel = this.value;
                    handleModelChange(selectedModel, [categorySelect, categorySelectDesktop], data);
                    // Sync desktop dropdown
                    if (modelSelectDesktop) modelSelectDesktop.value = selectedModel;
                });
            }

            // Handle Model Change - Desktop
            if (modelSelectDesktop) {
                modelSelectDesktop.addEventListener('change', function () {
                    const selectedModel = this.value;
                    handleModelChange(selectedModel, [categorySelect, categorySelectDesktop], data);
                    // Sync mobile dropdown
                    if (modelSelect) modelSelect.value = selectedModel;
                });
            }

            // Handle Category Change - Mobile
            if (categorySelect) {
                categorySelect.addEventListener('change', function () {
                    const selectedModel = modelSelect ? modelSelect.value : '';
                    const selectedCategory = this.value;
                    // Sync desktop dropdown
                    if (categorySelectDesktop) categorySelectDesktop.value = selectedCategory;

                    if (selectedModel) {
                        fetchFigures(selectedModel, selectedCategory);
                    }
                });
            }

            // Handle Category Change - Desktop
            if (categorySelectDesktop) {
                categorySelectDesktop.addEventListener('change', function () {
                    const selectedModel = modelSelectDesktop ? modelSelectDesktop.value : '';
                    const selectedCategory = this.value;
                    // Sync mobile dropdown
                    if (categorySelect) categorySelect.value = selectedCategory;

                    if (selectedModel) {
                        fetchFigures(selectedModel, selectedCategory);
                    }
                });
            }

            // Handle Reset - Mobile
            if (resetBtn) {
                resetBtn.addEventListener('click', handleReset);
            }

            // Handle Reset - Desktop
            if (resetBtnDesktop) {
                resetBtnDesktop.addEventListener('click', handleReset);
            }

            // Search Input Logic - Mobile
            if (searchInput && suggestionsList) {
                searchInput.addEventListener('input', function () {
                    handleSearchInput(this, suggestionsList, searchInputDesktop);
                });
            }

            // Search Input Logic - Desktop
            if (searchInputDesktop && suggestionsListDesktop) {
                searchInputDesktop.addEventListener('input', function () {
                    handleSearchInput(this, suggestionsListDesktop, searchInput);
                });
            }
        });
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function (e) {
        [
            { input: searchInput, suggestions: suggestionsList },
            { input: searchInputDesktop, suggestions: suggestionsListDesktop }
        ].forEach(({ input, suggestions }) => {
            if (input && suggestions && !input.contains(e.target) && !suggestions.contains(e.target)) {
                suggestions.classList.add('hidden');
            }
        });
    });
};
