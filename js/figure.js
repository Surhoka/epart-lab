window.initFigurePage = function () {
    const figureData = [
        {
            ID: '1',
            tittle: 'CYLINDER HEAD COVER',
            figure: 'FIG. 102A',
            vehicleModel: 'UK110NE/L/P/2_102A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        },
        {
            ID: '2',
            tittle: 'CYLINDER HEAD',
            figure: 'FIG. 103A',
            vehicleModel: 'UK110NE/L/P/2_103A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        },
        {
            ID: '3',
            tittle: 'CYLINDER',
            figure: 'FIG. 107A',
            vehicleModel: 'UK110NE/L/P/2_107A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        },
        {
            ID: '4',
            tittle: 'CRANKCASE',
            figure: 'FIG. 108A',
            vehicleModel: 'UK110NE/L/P/2_108A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        },
        {
            ID: '5',
            tittle: 'CRANKCASE COVER',
            figure: 'FIG. 112A',
            vehicleModel: 'UK110NE/L/P/2_112A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        },
        {
            ID: '6',
            tittle: 'CRANKSHAFT',
            figure: 'FIG. 120A',
            vehicleModel: 'UK110NE/L/P/2_120A',
            Category: 'ENGINE',
            imageUrl: '' // Placeholder
        }
    ];

    const gridContainer = document.getElementById('figure-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = figureData.map(item => `
      <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400">${item.figure}</span>
        </div>
        <div class="mb-4 flex justify-center">
            <div class="flex h-48 w-full items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.tittle}" class="h-full w-full object-contain rounded-lg" />` :
            `<svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`}
            </div>
        </div>
        <div>
          <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            ${item.tittle}
          </h4>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">${item.vehicleModel}</p>
        </div>
      </div>
    `).join('');
};
