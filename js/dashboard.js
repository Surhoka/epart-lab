const registerDashboardPage = () => {
    if (window.Alpine && !window.Alpine.data('dashboardPage')) {
        window.Alpine.data('dashboardPage', () => ({
            charts: {},
            map: null,
            loading: false,

            // Dummy Data
            countries: [
                { name: 'USA', count: 2379, percentage: 79, color: 'bg-brand-500', flag: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/country-01.svg' },
                { name: 'France', count: 589, percentage: 23, color: 'bg-brand-500', flag: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/country-02.svg' },
                { name: 'India', count: 402, percentage: 15, color: 'bg-brand-500', flag: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/country-03.svg' },
                { name: 'Canada', count: 210, percentage: 10, color: 'bg-brand-500', flag: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/country-04.svg' },
                { name: 'Brazil', count: 125, percentage: 5, color: 'bg-brand-500', flag: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/country-05.svg' },
            ],

            recentOrders: [
                { 
                    name: 'Macbook pro 13”', 
                    variant: '2 Variants', 
                    category: 'Laptop', 
                    price: '$2399.00', 
                    status: 'Delivered', 
                    statusColor: 'text-success-600 bg-success-50 dark:bg-success-500/15 dark:text-success-500',
                    image: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-01.jpg' 
                },
                { 
                    name: 'Apple Watch Ultra', 
                    variant: '1 Variants', 
                    category: 'Watch', 
                    price: '$879.00', 
                    status: 'Pending', 
                    statusColor: 'text-warning-600 bg-warning-50 dark:bg-warning-500/15 dark:text-orange-400',
                    image: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-02.jpg' 
                },
                { 
                    name: 'iPhone 15 Pro Max', 
                    variant: '2 Variants', 
                    category: 'SmartPhone', 
                    price: '$1869.00', 
                    status: 'Delivered', 
                    statusColor: 'text-success-600 bg-success-50 dark:bg-success-500/15 dark:text-success-500',
                    image: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-03.jpg' 
                },
                { 
                    name: 'iPad Pro 3rd Gen', 
                    variant: '2 Variants', 
                    category: 'Electronics', 
                    price: '$1699.00', 
                    status: 'Canceled', 
                    statusColor: 'text-error-600 bg-error-50 dark:bg-error-500/15 dark:text-error-500',
                    image: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-04.jpg' 
                },
                { 
                    name: 'Airpods Pro 2nd Gen', 
                    variant: '1 Variants', 
                    category: 'Accessories', 
                    price: '$240.00', 
                    status: 'Delivered', 
                    statusColor: 'text-success-700 bg-success-50 dark:bg-success-500/15 dark:text-success-500',
                    image: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-05.jpg' 
                },
            ],

            init() {
                console.log("Dashboard Page Initialized with Alpine Component.");
                // Ensure DOM elements are ready before initializing charts
                this.$nextTick(() => {
                    this.initDatePicker();
                    this.initCharts();
                    this.initMap();
                });
            },

            initDatePicker() {
                if (typeof flatpickr !== 'undefined') {
                    flatpickr(".datepicker", {
                        mode: "range",
                        static: true,
                        monthSelectorType: "static",
                        dateFormat: "M j, Y",
                        defaultDate: [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()],
                        prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8L1.4 6.8 5.4 2.8 6.8 4.2 4.2 6.8 6.8 9.4z" /></svg>',
                        nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L5.4 6.8 1.4 2.8 0 4.2 2.6 6.8 0 9.4z" /></svg>',
                    });
                }
            },

            initCharts() {
                if (typeof Chart === 'undefined') return;

                // Chart One: Monthly Sales
                const ctx1 = document.getElementById("chartOne");
                if (ctx1) {
                    this.charts.chartOne = new Chart(ctx1, {
                        type: "line",
                        data: {
                            labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
                            datasets: [{
                                label: "Sales",
                                data: [45, 50, 48, 55, 40, 60, 65, 58, 70, 75, 80, 85],
                                borderColor: "#3C50E0",
                                backgroundColor: "rgba(60, 80, 224, 0.1)",
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: "#fff",
                                pointBorderColor: "#3C50E0",
                            }, {
                                label: "Revenue",
                                data: [35, 40, 38, 45, 30, 50, 55, 48, 60, 65, 70, 75],
                                borderColor: "#80CAEE",
                                backgroundColor: "rgba(128, 202, 238, 0.1)",
                                borderWidth: 2,
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: "#fff",
                                pointBorderColor: "#80CAEE",
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: { mode: 'index', intersect: false }
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: { grid: { borderDash: [5, 5] }, beginAtZero: true }
                            }
                        }
                    });
                }

                // Chart Two: Monthly Target
                const ctx2 = document.getElementById("chartTwo");
                if (ctx2) {
                    this.charts.chartTwo = new Chart(ctx2, {
                        type: "bar",
                        data: {
                            labels: ["M", "T", "W", "T", "F", "S", "S"],
                            datasets: [{
                                label: "Sales",
                                data: [40, 30, 45, 35, 55, 40, 50],
                                backgroundColor: "#3C50E0",
                                borderRadius: 4,
                                barThickness: 10
                            }, {
                                label: "Revenue",
                                data: [30, 25, 35, 30, 45, 35, 45],
                                backgroundColor: "#80CAEE",
                                borderRadius: 4,
                                barThickness: 10
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                            },
                            scales: {
                                x: { stacked: true, grid: { display: false } },
                                y: { stacked: true, display: false }
                            }
                        }
                    });
                }

                // Chart Three: Statistics/Revenue
                const ctx3 = document.getElementById("chartThree");
                if (ctx3) {
                    this.charts.chartThree = new Chart(ctx3, {
                        type: "bar",
                        data: {
                            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                            datasets: [{
                                label: "Sales",
                                data: [20, 25, 35, 30, 45, 35, 55, 40, 50, 60, 75, 80],
                                backgroundColor: "#3C50E0",
                                borderRadius: 2,
                                barPercentage: 0.6
                            }, {
                                label: "Revenue",
                                data: [15, 20, 30, 25, 40, 30, 50, 35, 45, 55, 70, 75],
                                backgroundColor: "#80CAEE",
                                borderRadius: 2,
                                barPercentage: 0.6
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                            },
                            scales: {
                                x: { grid: { display: false } },
                                y: { grid: { borderDash: [5, 5] }, beginAtZero: true }
                            }
                        }
                    });
                }
            },

            initMap() {
                const mapEl = document.getElementById("mapOne");
                if (mapEl && typeof jsVectorMap !== 'undefined') {
                    mapEl.innerHTML = ''; // Clean up

                    this.map = new jsVectorMap({
                        selector: "#mapOne",
                        map: "world",
                        zoomButtons: true,
                        regionStyle: {
                            initial: {
                                fill: "#C8D0D8"
                            },
                            hover: {
                                fillOpacity: 1,
                                fill: "#3056D3"
                            },
                        },
                        regionLabelStyle: {
                            initial: {
                                fontFamily: "Satoshi",
                                fontWeight: "semibold",
                                fill: "#fff",
                            },
                            hover: {
                                cursor: "pointer",
                            },
                        },
                        markers: [
                            { coords: [37.0902, -95.7129], name: "USA" },
                            { coords: [46.2276, 2.2137], name: "France" },
                        ],
                        markerStyle: {
                            initial: {
                                r: 5, // size
                                fill: "#3056D3",
                                opacity: 1,
                                stroke: "#FFF",
                                strokeWidth: 1,
                                strokeOpacity: 1
                            },
                            hover: {
                                stroke: "#3056D3",
                                fill: "#FFF",
                                strokeWidth: 2,
                            },
                        },
                    });
                }
            }
        }));
    }
};

if (window.Alpine) {
    registerDashboardPage();
} else {
    document.addEventListener('alpine:init', registerDashboardPage);
}
