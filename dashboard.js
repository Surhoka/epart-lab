window.initDashboard = function () {
  const container = document.getElementById('main-content-wrapper');
  if (!container) return;

  container.innerHTML = `
    <div class="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 m-6">
      <main class="flex-grow p-6">
        <div class="mb-6 p-4 rounded-xl">
          <div id="breadcrumb" class="text-sm font-medium text-gray-500">
            <span class="text-indigo-600">Dasbor</span>
          </div>
          <h1 id="page-title" class="text-3xl font-bold text-gray-900 mt-1">Dasbor Utama</h1>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          ${generateStatCard('Total Penjualan Bulan Ini', 'Rp 125.000.000', 'trending-up', 'text-indigo-500')}
          ${generateStatCard('Total Produk Unik', '1.250', 'package', 'text-green-500')}
          ${generateStatCard('Stok Kritis', '25 Item', 'alert-triangle', 'text-yellow-500')}
          ${generateStatCard('Order Tertunda', '5 Order', 'list-checks', 'text-red-500')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="p-6 border border-gray-200 rounded-2xl bg-white">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">Tren Penjualan (6 Bulan Terakhir)</h2>
            <div style="height: 300px;"><canvas id="penjualanChart"></canvas></div>
          </div>
          <div class="p-6 border border-gray-200 rounded-2xl bg-white">
            <h2 class="text-xl font-semibold mb-4 text-gray-800">Produk Terlaris Bulan Ini</h2>
            <div style="height: 300px;"><canvas id="stokChart"></canvas></div>
          </div>
        </div>

        <div class="p-6 border border-gray-200 rounded-2xl bg-white mb-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-800">Order Penjualan Terbaru</h2>
          <div class="table-container overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Order</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pelanggan</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody id="order-table-body" class="bg-white divide-y divide-gray-200"></tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;

  lucide.createIcons();
  populateOrderTable();
  initializeCharts();
};

// 🔹 Komponen Card Statistik
function generateStatCard(label, value, icon, color) {
  return `
    <div class="p-5 border border-gray-200 rounded-2xl bg-white">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-gray-500">${label}</p>
        <i data-lucide="${icon}" class="w-6 h-6 ${color}"></i>
      </div>
      <p class="text-2xl font-bold text-gray-900 mt-1">${value}</p>
    </div>
  `;
}

// 🔹 Data Mock Order
const orderData = [
  { no: 'SO-202511001', customer: 'Bagus Motor', date: '03 Nov 2025', total: 1500000, status: 'Lunas' },
  { no: 'SO-202511002', customer: 'Toko Jaya Abadi', date: '03 Nov 2025', total: 750000, status: 'Diproses' },
  { no: 'SO-202511003', customer: 'Ibu Ani (Eceran)', date: '02 Nov 2025', total: 245000, status: 'Dikirim' },
  { no: 'SO-202511004', customer: 'Bengkel Tulus', date: '01 Nov 2025', total: 3200000, status: 'Lunas' },
];

// 🔹 Tabel Order
function populateOrderTable() {
  const tableBody = document.getElementById('order-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  orderData.forEach(order => {
    const statusBadge = {
      'Lunas': '<span class="px-2 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Lunas</span>',
      'Diproses': '<span class="px-2 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Diproses</span>',
      'Dikirim': '<span class="px-2 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Dikirim</span>'
    }[order.status] || '';

    const row = `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 text-sm font-medium text-indigo-600">${order.no}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${order.customer}</td>
        <td class="px-6 py-4 text-sm text-gray-500">${order.date}</td>
        <td class="px-6 py-4 text-sm text-right font-medium text-gray-900">Rp ${order.total.toLocaleString('id-ID')}</td>
        <td class="px-6 py-4 text-sm text-center">${statusBadge}</td>
      </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', row);
  });
}

// 🔹 Grafik Chart.js
function initializeCharts() {
  const ctxPenjualan = document.getElementById('penjualanChart')?.getContext('2d');
  if (ctxPenjualan) {
    if (window.penjualanChartInstance) window.penjualanChartInstance.destroy();
    window.penjualanChartInstance = new Chart(ctxPenjualan, {
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
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: false, title: { display: true, text: 'Total (Juta Rp)' } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: ctx => 'Penjualan: Rp ' + ctx.parsed.y + ' Juta'
            }
          }
        }
      }
    });
  }

  const ctxStok = document.getElementById('stokChart')?.getContext('2d');
  if (ctxStok) {
    if (window.stokChartInstance) window.stokChartInstance.destroy();
    window.stokChartInstance = new Chart(ctxStok, {
      type: 'bar',
      data: {
        labels: ['Oli MPX 2', 'Filter Oli Avanza', 'Kampas Rem Vario', 'Busi NGK', 'Aki GS Astra'],
        datasets: [{
          label: 'Jumlah Terjual (Unit)',
          data: [180, 145, 110, 95, 70],
          backgroundColor: ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: { x: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  }
}