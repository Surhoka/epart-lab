window.initFigurePage = function () {
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Figure');
    }

    const figureData = [
        {
            Id: '1',
            Title: 'CYLINDER HEAD COVER',
            Figure: 'FIG. 102A',
            VehicleModel: 'UK110NE/L/P/2_102A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        },
        {
            Id: '2',
            Title: 'CYLINDER HEAD',
            Figure: 'FIG. 103A',
            VehicleModel: 'UK110NE/L/P/2_103A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        },
        {
            Id: '3',
            Title: 'CYLINDER',
            Figure: 'FIG. 107A',
            VehicleModel: 'UK110NE/L/P/2_107A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        },
        {
            Id: '4',
            Title: 'CRANKCASE',
            Figure: 'FIG. 108A',
            VehicleModel: 'UK110NE/L/P/2_108A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        },
        {
            Id: '5',
            Title: 'CRANKCASE COVER',
            Figure: 'FIG. 112A',
            VehicleModel: 'UK110NE/L/P/2_112A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        },
        {
            Id: '6',
            Title: 'CRANKSHAFT',
            Figure: 'FIG. 120A',
            VehicleModel: 'UK110NE/L/P/2_120A',
            Category: 'ENGINE',
            FigureUrl: '' // Placeholder
        }
    ];

    const vehicleModels = [
        { model: 'UK110NE', category: 'ENGINE' },
        { model: 'UK110L', category: 'ENGINE' },
        { model: 'UK110P', category: 'ENGINE' },
        { model: 'UK110Z', category: 'ENGINE' },
        { model: 'GSX150', category: 'ENGINE' },
        { model: 'SATRIA F150', category: 'ENGINE' }
    ];

    const searchInput = document.getElementById('model-search');
    const suggestionsList = document.getElementById('search-suggestions');
    const gridContainerWrapper = document.getElementById('figure-grid-container');
    const gridContainer = document.getElementById('figure-grid');

    if (searchInput && suggestionsList && gridContainerWrapper) {
        searchInput.addEventListener('input', function () {
            const query = this.value.toLowerCase();
            suggestionsList.innerHTML = '';

            if (query.length > 0) {
                const filteredModels = vehicleModels.filter(item =>
                    item.model.toLowerCase().includes(query) ||
                    item.category.toLowerCase().includes(query)
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
                            gridContainerWrapper.classList.remove('hidden');
                            // Optional: Filter grid items here if needed
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

        // Hide suggestions when clicking outside
        document.addEventListener('click', function (e) {
            if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add('hidden');
            }
        });
    }

    if (!gridContainer) return;

    gridContainer.innerHTML = figureData.map(item => `
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">${item.Figure}</span>
        </div>
        <div class="mb-4 flex justify-center">
            <div class="flex h-48 w-full items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                ${item.FigureUrl ? `<img src="${item.FigureUrl}" alt="${item.Title}" class="h-full w-full object-contain rounded-lg" />` :
            `<svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`}
            </div>
        </div>
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            ${item.Title}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">${item.VehicleModel}</p>
        </div>
      </div>
    `).join('');
};
