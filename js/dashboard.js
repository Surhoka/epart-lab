function initDashboardPage() {
    // Data Mock
    const orderData = [
        { no: 'SO-202511001', customer: 'Bagus Motor', date: '03 Nov 2025', total: 1500000, status: 'Lunas' },
        { no: 'SO-202511002', customer: 'Toko Jaya Abadi', date: '03 Nov 2025', total: 750000, status: 'Diproses' },
        { no: 'SO-202511003', customer: 'Ibu Ani (Eceran)', date: '02 Nov 2025', total: 245000, status: 'Dikirim' },
        { no: 'SO-202511004', customer: 'Bengkel Tulus', date: '01 Nov 2025', total: 3200000, status: 'Lunas' },
    ];

    function populateOrderTable() {
        const tableBody = document.getElementById('order-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        orderData.slice(0, 4).forEach(order => {
            let statusBadge = '';
            if (order.status === 'Lunas') {
                statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Lunas</span>';
            } else if (order.status === 'Diproses') {
                statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Diproses</span>';
            } else if (order.status === 'Dikirim') {
                statusBadge = '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Dikirim</span>';
            }

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">${order.no}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">Rp ${order.total.toLocaleString('id-ID')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center">${statusBadge}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function initializeCharts() {
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded.');
            return;
        }
        const ctxPenjualan = document.getElementById('penjualanChart');
        if (!ctxPenjualan) return;
        if (window.penjualanChartInstance) {
            window.penjualanChartInstance.destroy();
        }
        window.penjualanChartInstance = new Chart(ctxPenjualan.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'],
                datasets: [{
                    label: 'Total Penjualan (Juta Rp)',
                    data: [80, 105, 95, 120, 110, 125],
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false, title: { display: true, text: 'Total (Juta Rp)' } },
                },
                plugins: {
                    tooltip: { callbacks: { label: function(context) { return 'Penjualan: Rp ' + context.parsed.y + ' Juta'; } } }
                }
            }
        });

        const ctxStok = document.getElementById('stokChart');
        if(!ctxStok) return;
        if (window.stokChartInstance) {
            window.stokChartInstance.destroy();
        }
        window.stokChartInstance = new Chart(ctxStok.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Oli MPX 2', 'Filter Oli Avanza', 'Kampas Rem Vario', 'Busi NGK', 'Aki GS Astra'],
                datasets: [{
                    label: 'Jumlah Terjual (Unit)',
                    data: [180, 145, 110, 95, 70],
                    backgroundColor: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'],
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, indexAxis: 'y',
                scales: { x: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Initialize the dashboard content
    lucide.createIcons();
    populateOrderTable();
    initializeCharts();
}
