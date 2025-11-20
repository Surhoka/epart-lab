// app.js
function appData() {
    return {
        page: 'ecommerce',
        loaded: true,
        darkMode: false,
        sidebarToggle: false,
        scrollTop: false,
        pageContent: '',
        isLoading: false,
        githubBaseUrl: 'https://raw.githubusercontent.com/Surhoka/epart-lab/main/pages/',

        async init() {
            // Dark Mode
            this.darkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
            this.$watch('darkMode', v => localStorage.setItem('darkMode', JSON.stringify(v)));

            // Router
            this.handleHashChange();
            window.addEventListener('hashchange', () => this.handleHashChange());

            // Preloader
            window.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.loaded = false, 500);
            });
        },

        async handleHashChange() {
            const hash = window.location.hash.substring(1);
            this.page = hash || 'ecommerce';
            await this.fetchPage(this.page);
        },

        async fetchPage(pageName) {
            this.isLoading = true;
            this.pageContent = '';
            try {
                const url = `${this.githubBaseUrl}${pageName}.html`;
                const response = await fetch(url);
                if (response.ok) {
                    this.pageContent = await response.text();
                } else {
                    this.pageContent = `<div class="p-10 text-center">
                        <h2 class="text-2xl font-bold text-gray-500">404 - Page Not Found</h2>
                        <p class="text-gray-400">The requested page could not be loaded.</p>
                    </div>`;
                }
            } catch (error) {
                console.error('Fetch error:', error);
                this.pageContent = `<div class="p-10 text-center">
                    <h2 class="text-2xl font-bold text-error-500">Error Loading Page</h2>
                    <p class="text-gray-400">Please check your connection or configuration.</p>
                </div>`;
            } finally {
                this.isLoading = false;
            }
        }
    }
}