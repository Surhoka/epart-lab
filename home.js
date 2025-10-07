export function getHomePageHtml() {
  return `
    <div class="p-4">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Home</h2>
      <p class="text-gray-600 dark:text-gray-300">Welcome to the static TailAdmin dashboard.</p>
      <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Total Users</h3>
          <p class="text-3xl font-bold text-brand-500">1,234</p>
        </div>
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Total Sales</h3>
          <p class="text-3xl font-bold text-success-500">$5,678</p>
        </div>
        <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Pending Orders</h3>
          <p class="text-3xl font-bold text-warning-500">89</p>
        </div>
      </div>
    </div>
  `;
}
