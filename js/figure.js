window.initFigurePage = function () {
    const app = window.app;
    const params = app ? app.params : {};

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
            renderDetailView(params);
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
        gridContainer.innerHTML = '<div class="col-span-full text-center py-8">Loading figures...</div>';
        gridContainerWrapper.classList.remove('hidden');

        try {
            const response = await fetch(`${window.appsScriptUrl}?action=getFigures&model=${encodeURIComponent(model)}&category=${encodeURIComponent(category)}`);
            const result = await response.json();

            if (result.status === 'success') {
                renderFigures(result.data);
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

        if (data.length === 0) {
            gridContainer.innerHTML = '<div class="col-span-full text-center py-8">No figures found for this model.</div>';
            return;
        }

        gridContainer.innerHTML = data.map(item => `
<div onclick="window.navigate('figure', { view: 'detail', figure: '${item.Figure}', title: '${item.Title}', model: '${item.VehicleModel}' })" class="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] flex flex-col hover:shadow-lg transition-shadow">
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

        detailContainer.innerHTML = `
            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div class="mb-6">
                    <button onclick="window.navigate('figure')" class="flex items-center gap-2 text-sm text-gray-500 hover:text-primary">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Back to List
                    </button>
                </div>
                
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">${params.title || 'Detail'}</h2>
                <p class="text-lg text-gray-600 dark:text-gray-300 mb-4">${params.figure || ''}</p>
                
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p class="text-sm text-gray-500">Model: <span class="font-medium text-gray-900 dark:text-white">${params.model || '-'}</span></p>
                </div>
            </div>
        `;
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
