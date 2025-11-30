window.initFigurePage = function () {
    const app = window.app;
    const params = app ? app.params : {};
    let currentFiguresData = []; // Store fetched figures

    const searchInput = document.getElementById('model-search');
    const suggestionsList = document.getElementById('search-suggestions');
    const gridContainerWrapper = document.getElementById('figure-grid-container');
    const gridContainer = document.getElementById('figure-grid');

    // Create or get detail container
    let detailContainer = document.getElementById('figure-detail-container');
    if (!detailContainer && gridContainerWrapper) {
        detailContainer = document.createElement('div');
        detailContainer.id = 'figure-detail-container';
        detailContainer.className = 'hidden';
        gridContainerWrapper.parentNode.insertBefore(detailContainer, gridContainerWrapper.nextSibling);
    }

    // View Logic
    if (params.view === 'detail') {
        // Show Detail
        if (gridContainerWrapper) gridContainerWrapper.classList.add('hidden');
        if (detailContainer) {
            detailContainer.classList.remove('hidden');
            // If we have data, render immediately. Otherwise, fetchFigures will handle it after fetch.
            if (currentFiguresData.length > 0) {
                renderDetailView(params);
            } else if (params.model && params.category) {
                fetchFigures(params.model, params.category);
            }
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
        if (gridContainerWrapper) gridContainerWrapper.classList.remove('hidden');
        if (detailContainer) detailContainer.classList.add('hidden');

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

        // Show loading state
        if (!currentFiguresData.length) {
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading figures...</div>';
            gridContainerWrapper.classList.remove('hidden');
        }

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

    function renderFigures(data) {
        if (!gridContainer) return;

        if (data.length === 0) {
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8">No figures found for this model.</div>';
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
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
        if (!detailContainer) return;

        const selectedFigure = params.figure;

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

        detailContainer.innerHTML = `
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
                <div class="grid grid-cols-1 lg:grid-cols-12">
                    <!-- Sidebar -->
                    <div class="lg:col-span-3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
                             <button onclick="window.navigate('figure')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                Back to List
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
                            <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-1">FIG. ${params.figure} ${params.title}</h2>
                            <p class="text-sm text-gray-500">Model: ${params.model || '-'}</p>
                        </div>

                        <div class="flex justify-center items-center bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-8 min-h-[400px] mb-8">
                             ${currentFiguresData.find(i => i.Figure === params.figure)?.FigureUrl ? `
                                <img src="${currentFiguresData.find(i => i.Figure === params.figure).FigureUrl}" alt="${params.title}" class="max-w-full max-h-[600px] object-contain" />
                             ` : `
                                <div class="text-center text-gray-400">
                                    <svg class="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>No image available</p>
                                </div>
                             `}
                        </div>

                        <!-- Parts Table -->
                        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 overflow-hidden">
                            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 class="font-semibold text-gray-800 dark:text-white">Parts List</h3>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                    <thead class="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-700 dark:text-gray-300">
                                        <tr>
                                            <th scope="col" class="px-6 py-3">No</th>
                                            <th scope="col" class="px-6 py-3">Part Number</th>
                                            <th scope="col" class="px-6 py-3">Title</th>
                                        </tr>
                                    </thead>
                                    <tbody id="parts-table-body" class="divide-y divide-gray-200 dark:divide-gray-800">
                                        <tr>
                                            <td colspan="3" class="px-6 py-4 text-center">Loading parts...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Fetch and render parts
        fetchParts(params.figure, params.model).then(parts => {
            const tbody = document.getElementById('parts-table-body');
            if (!tbody) return;

            if (parts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center">No parts found.</td></tr>';
                return;
            }

            tbody.innerHTML = parts.map((part, index) => `
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${part.No || index + 1}</td>
                    <td class="px-6 py-4 font-mono text-primary">${part.PartNumber}</td>
                    <td class="px-6 py-4">${part.Title}</td>
                </tr>
            `).join('');
        });
    }

    if (searchInput && suggestionsList && gridContainerWrapper) {
        // Fetch models on init
        fetchVehicleModels().then(vehicleModels => {
            searchInput.addEventListener('input', function () {
                const query = this.value.toLowerCase();
                suggestionsList.innerHTML = '';

                if (query.length > 0) {
                    const filteredModels = vehicleModels.filter(item =>
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
                                // Fetch and display figures
                                fetchFigures(item.model, item.category);
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

        // Hide suggestions when clicking outside
        document.addEventListener('click', function (e) {
            if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add('hidden');
            }
        });
    }
};
