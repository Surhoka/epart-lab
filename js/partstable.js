window.renderPartsTable = function (containerId, figure, model) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
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

    // Fetch and render parts
    fetchParts(figure, model).then(parts => {
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
};
