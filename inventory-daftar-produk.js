let inventoryData = [
    { id: 1, sku: 'OL001', name: 'Oli MPX 2 0.8L', brand: 'AHM', category: 'Pelumas', stock: 150, price: 55000, last_update: '2025-11-01' },
    { id: 2, sku: 'FO045', name: 'Filter Oli Avanza/Xenia', brand: 'Denso', category: 'Filter', stock: 85, price: 30000, last_update: '2025-10-30' },
    { id: 3, sku: 'KR022', name: 'Kampas Rem Vario 125', brand: 'Federal', category: 'Rem', stock: 210, price: 45000, last_update: '2025-11-02' },
    { id: 4, sku: 'BS011', name: 'Busi NGK C7HSA', brand: 'NGK', category: 'Pengapian', stock: 95, price: 15000, last_update: '2025-10-25' },
    { id: 5, sku: 'AKI12V', name: 'Aki GS Astra GTZ5S', brand: 'GS Astra', category: 'Aki & Kelistrikan', stock: 70, price: 210000, last_update: '2025-11-03' },
    { id: 6, sku: 'LT005', name: 'Lampu Depan LED H4', brand: 'Philips', category: 'Lampu', stock: 40, price: 125000, last_update: '2025-10-28' },
];

function openAddProductForm() {
    document.getElementById('modal-title').textContent = 'Tambah Produk Baru';
    document.getElementById('add-product-form').reset();
    document.getElementById('product-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

document.getElementById('add-product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Lakukan validasi dan simpan data di sini (mock)
    const name = document.getElementById('product-name').value;
    const sku = document.getElementById('product-sku').value;
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;

    // Simple validation
    if (!name || !sku || !price || !stock) {
        console.error('Semua kolom harus diisi.');
        // Di aplikasi nyata, tampilkan pesan error di UI
        return;
    }

    const newId = inventoryData.length + 1;
    inventoryData.unshift({ // Tambahkan di depan agar muncul pertama di tabel
        id: newId, 
        sku: sku.toUpperCase(), 
        name: name, 
        brand: 'Baru', 
        category: 'Uncategorized', 
        stock: parseInt(stock), 
        price: parseInt(price), 
        last_update: new Date().toISOString().slice(0, 10)
    });

    closeProductModal();
    populateInventoryTable();
});

function populateInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';
    
    inventoryData.forEach(product => {
        let stockColor = 'text-green-600';
        if (product.stock < 50) {
            stockColor = 'text-yellow-600';
        }
        if (product.stock < 20) {
            stockColor = 'text-red-600 font-bold';
        }
        
        const formattedPrice = product.price.toLocaleString('id-ID');

        const row = `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.sku}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${product.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.brand}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">Rp ${formattedPrice}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center ${stockColor}">${product.stock}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button class="text-indigo-600 hover:text-indigo-900 mx-1 action-button" title="Edit">
                        <i data-lucide="square-pen" class="w-4 h-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 mx-1 action-button" title="Hapus">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    populateInventoryTable();
});
