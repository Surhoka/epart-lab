// Global state for products (simulated)
let productsData = [
    {
        name: 'Apple Watch Series 7',
        category: 'Electronics',
        price: '$269',
        status: 'Active',
        image: 'product-01.jpg',
        variants: '1 Variant'
    },
    {
        name: 'Macbook Pro M1',
        category: 'Electronics',
        price: '$1269',
        status: 'Active',
        image: 'product-02.jpg',
        variants: '2 Variants'
    },
    {
        name: 'Dell Inspiron 15',
        category: 'Electronics',
        price: '$669',
        status: 'Out of Stock',
        image: 'product-03.jpg',
        variants: '1 Variant'
    },
    {
        name: 'HP Probook 450',
        category: 'Electronics',
        price: '$869',
        status: 'Active',
        image: 'product-04.jpg',
        variants: '3 Variants'
    },
    {
        name: 'Logitech MX Master 3',
        category: 'Accessories',
        price: '$99',
        status: 'Active',
        image: 'product-05.jpg',
        variants: '1 Variant'
    }
];

function initProductsPage() {
    console.log('Products Page Initialized');

    // Initialize Breadcrumb
    if (window.renderBreadcrumb) {
        window.renderBreadcrumb('breadcrumb-container', [
            { name: 'Dashboard', link: '#dashboard' },
            { name: 'Products', link: '#products' }
        ]);
    }
    if (!tbody) return;

    tbody.innerHTML = productsData.map(product => `
        <tr>
            <td class="py-3">
            ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
            : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
        }">
                    ${product.status}
                </p>
            </td>
            <td class="py-3">
                <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg class="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.17812 8.99981 3.17812C14.5686 3.17812 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.6873 8.99999C2.41856 10.3219 5.24231 13.6969 8.99981 13.6969C12.7573 13.6969 15.5811 10.3219 16.3123 8.99999C15.5811 7.67812 12.7573 4.30312 8.99981 4.30312C5.24231 4.30312 2.41856 7.67812 1.6873 8.99999Z" fill=""/>
                            <path d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.73438C8.32499 7.73438 7.73438 8.32499 7.73438 9C7.73438 9.675 8.32499 10.2656 9 10.2656C9.675 10.2656 10.2656 9.675 10.2656 9C10.2656 8.32499 9.675 7.73438 9 7.73438Z" fill=""/>
                        </svg>
                    </button>
                    <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg class="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16.875 2.16563H12.9375V1.26563C12.9375 0.5625 12.375 0 11.6719 0H6.32812C5.625 0 5.0625 0.5625 5.0625 1.26563V2.16563H1.125C0.50625 2.16563 0 2.67188 0 3.29063V3.43125C0 3.65625 0.196875 3.825 0.421875 3.825H1.4625L2.10938 16.3125C2.16562 17.2688 2.95312 18 3.90938 18H14.1187C15.075 18 15.8625 17.2406 15.9187 16.2844L16.5656 3.825H17.5781C17.8031 3.825 18 3.62813 18 3.43125V3.29063C18 2.67188 17.4937 2.16563 16.875 2.16563ZM14.7937 16.2281C14.7656 16.6219 14.4562 16.875 14.1187 16.875H3.90937C3.57187 16.875 3.2625 16.6219 3.23437 16.2563L2.5875 3.825H15.4406L14.7937 16.2281ZM6.1875 1.26563C6.1875 1.18125 6.24375 1.125 6.32812 1.125H11.6719C11.7562 1.125 11.8125 1.18125 11.8125 1.26563V2.16563H6.1875V1.26563Z" fill=""/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}
