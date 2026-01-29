const registerDashboardPage = () => {
    if (window.Alpine && !window.Alpine.data('dashboardPage')) {
        window.Alpine.data('dashboardPage', () => ({
            charts: {},
            map: null,

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
