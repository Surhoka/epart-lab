// Data estimasi akan disimpan di sini
let estimasiItems = [];

// Fungsi untuk memuat data dari localStorage
function loadEstimasiFromLocalStorage() {
    const storedData = localStorage.getItem('estimasiData');
    if (storedData) {
        try {
            estimasiItems = JSON.parse(storedData);
        } catch (e) {
            console.error("Kesalahan saat mengurai data estimasi dari localStorage:", e);
            estimasiItems = []; // Reset jika ada kesalahan penguraian
        }
    } else {
        estimasiItems = [];
    }
}

// Fungsi untuk menyimpan data ke localStorage
function saveEstimasiToLocalStorage() {
    localStorage.setItem('estimasiData', JSON.stringify(estimasiItems));
}

/**
 * Menambahkan item baru ke daftar estimasi atau memperbarui kuantitas item yang sudah ada.
 * @param {Object} newItem - Item yang akan ditambahkan atau diperbarui.
 * @param {boolean} [isIncrement=true] - Jika true, menambah kuantitas. Jika false, mengurangi.
 */
function addEstimasiItem(newItem, isIncrement = true) {
    if (!newItem || !newItem.kodePart || !newItem.deskripsi || !newItem.qty || !newItem.harga) {
        console.warn("Data item tidak lengkap:", newItem);
        return;
    }

    const kodeBaru = newItem.kodePart.trim().toUpperCase();
    const deskripsiBaru = newItem.deskripsi.trim();
    const qtyBaru = newItem.qty;

    const existingIndex = estimasiItems.findIndex(item =>
        item.kodePart.trim().toUpperCase() === kodeBaru &&
        item.deskripsi.trim() === deskripsiBaru
    );

    if (existingIndex !== -1) { // Item sudah ada
        if (isIncrement) {
            estimasiItems[existingIndex].qty += qtyBaru;
            if (typeof window.showMessageBox === 'function') {
                window.showMessageBox(`Qty untuk part '${deskripsiBaru}' ditambahkan jadi ${estimasiItems[existingIndex].qty}x`);
            }
        } else { // Kurangi kuantitas
            estimasiItems[existingIndex].qty -= qtyBaru;
            if (estimasiItems[existingIndex].qty <= 0) {
                estimasiItems.splice(existingIndex, 1);
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) dihapus dari keranjang.`);
                }
            } else {
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Qty untuk part '${deskripsiBaru}' dikurangi jadi ${estimasiItems[existingIndex].qty}x`);
                }
            }
        }
    } else { // Item belum ada
        if (isIncrement) { // Hanya tambahkan jika operasi adalah penambahan
            estimasiItems.push({
                kodePart: kodeBaru,
                deskripsi: deskripsiBaru,
                qty: qtyBaru,
                harga: newItem.harga
            });
            if (typeof window.showMessageBox === 'function') {
                window.showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) ditambahkan ke keranjang dengan ${qtyBaru}x`);
            }
        } else { // Item tidak ada dan operasi bukan penambahan (misal: mencoba mengurangi item yang tidak ada)
            if (typeof window.showMessageBox === 'function') {
                window.showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) tidak ditemukan di keranjang.`);
            }
        }
    }

    saveEstimasiToLocalStorage();
    renderEstimasiTable();
}

// Fungsi untuk merender ulang tabel dan memperbarui badge
function renderEstimasiTable() {
    const estimasiTableBody = document.getElementById('estimasiTableBody');
    if (!estimasiTableBody) return;

    estimasiTableBody.innerHTML = '';
    let totalBelanja = 0;
    let totalQuantity = 0;

    if (estimasiItems.length === 0) {
        estimasiTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="py-2 px-4 border-b text-center text-sm text-gray-500">
                    Tidak ada item dalam estimasi.
                </td>
            </tr>`;
        const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');
        if (estimasiQtyBadge) {
            estimasiQtyBadge.textContent = '0';
            estimasiQtyBadge.classList.remove('show-badge');
        }
        const estimasiPriceBadge = document.getElementById('estimasiPriceBadge');
        if (estimasiPriceBadge) {
            estimasiPriceBadge.textContent = 'Rp 0';
            estimasiPriceBadge.classList.remove('show-badge');
        }
        return;
    }

    estimasiItems.forEach((item, index) => {
        const jumlah = item.qty * item.harga;
        totalBelanja += jumlah;
        totalQuantity += item.qty;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-2 px-4 text-center">${index + 1}</td>
            <td class="py-2 px-4 text-center">${item.kodePart}</td>
            <td class="py-2 px-4 deskripsi-cell" title="${item.deskripsi}">${item.deskripsi}</td>
            <td class="py-2 px-4 text-center">
                <div class="inline-flex items-center justify-center relative">
                    <input type="number" class="qty-input-table w-16 text-center" value="${item.qty}" min="1" data-index="${index}" />
                    <div class="absolute right-0 flex flex-col">
                        <button class="qty-btn-up text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">🔼</button>
                        <button class="qty-btn-down text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">🔽</button>
                    </div>
                </div>
            </td>
            <td class="py-2 px-4 text-right">
                <input type="text" class="price-input-table" value="Rp ${item.harga.toLocaleString('id-ID')}" data-index="${index}" />
            </td>
            <td class="py-2 px-4 text-right">Rp ${jumlah.toLocaleString('id-ID')}</td>
            <td class="py-2 px-4 text-center">
                <button class="delete-item-btn text-gray-500 hover:text-red-600 transition duration-200" title="Hapus" data-index="${index}">
                    <i class="fas fa-trash-alt text-lg"></i>
                </button>
            </td>
        `;
        estimasiTableBody.appendChild(row);
    });

    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
        <td colspan="5" class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Total:</td>
        <td class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
        <td class="py-2 px-4 border-t border-gray-200 text-sm"></td>
    `;
    estimasiTableBody.appendChild(totalRow);

    // Listener untuk qty input
    document.querySelectorAll('.qty-input-table').forEach(input => {
        input.addEventListener('change', e => {
            const newQty = parseInt(e.target.value, 10);
            const idx = parseInt(e.target.dataset.index);

            if (!isNaN(newQty) && newQty > 0 && idx >= 0 && idx < estimasiItems.length) {
                estimasiItems[idx].qty = newQty;
                saveEstimasiToLocalStorage();
                renderEstimasiTable();
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi ${newQty}x`);
                }
            } else {
                if (newQty <= 0 && idx >= 0 && idx < estimasiItems.length) {
                    const namaItem = estimasiItems[idx].deskripsi;
                    estimasiItems.splice(idx, 1);
                    if (typeof window.showMessageBox === 'function') {
                        window.showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                    }
                } else {
                    if (typeof window.showMessageBox === 'function') {
                        window.showMessageBox(`Qty tidak valid. Masukkan angka lebih dari 0.`);
                    }
                    e.target.value = estimasiItems[idx].qty;
                }
            }
        });
    });

    // Listener untuk input harga
    document.querySelectorAll('.price-input-table').forEach(input => {
        input.addEventListener('change', e => {
            const newPriceString = e.target.value.replace(/[^0-9]/g, '');
            const newPrice = parseInt(newPriceString, 10);
            const idx = parseInt(e.target.dataset.index);

            if (!isNaN(newPrice) && newPrice >= 0 && idx >= 0 && idx < estimasiItems.length) {
                estimasiItems[idx].harga = newPrice;
                saveEstimasiToLocalStorage();
                renderEstimasiTable();
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Harga untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi Rp ${newPrice.toLocaleString('id-ID')}`);
                }
            } else {
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Harga tidak valid. Masukkan angka yang benar.`);
                }
                e.target.value = `Rp ${estimasiItems[idx].harga.toLocaleString('id-ID')}`;
            }
        });
    });

    // Listener untuk tombol hapus
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            let idx = parseInt(e.target.dataset.index);
            if (isNaN(idx)) {
                const parentButton = e.target.closest('button');
                if (parentButton) {
                    idx = parseInt(parentButton.dataset.index);
                }
            }

            if (idx >= 0 && idx < estimasiItems.length) {
                const namaItem = estimasiItems[idx].deskripsi;
                estimasiItems.splice(idx, 1);
                saveEstimasiToLocalStorage();
                renderEstimasiTable();
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                }
            }
        });
    });

    // Listener untuk tombol tambah qty
    document.querySelectorAll('.qty-btn-up').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
            if (idx >= 0 && idx < estimasiItems.length) {
                estimasiItems[idx].qty++;
                saveEstimasiToLocalStorage();
                renderEstimasiTable();
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' ditambahkan jadi ${estimasiItems[idx].qty}x`);
                }
            }
        });
    });

    // Listener untuk tombol kurang qty
    document.querySelectorAll('.qty-btn-down').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
            if (idx >= 0 && idx < estimasiItems.length) {
                estimasiItems[idx].qty--;
                if (estimasiItems[idx].qty <= 0) {
                    const namaItem = estimasiItems[idx].deskripsi;
                    estimasiItems.splice(idx, 1);
                    if (typeof window.showMessageBox === 'function') {
                        window.showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                    }
                } else {
                    if (typeof window.showMessageBox === 'function') {
                        window.showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' dikurangi jadi ${estimasiItems[idx].qty}x`);
                    }
                }
                saveEstimasiToLocalStorage();
                renderEstimasiTable();
            }
        });
    });

    // Perbarui badge kuantitas
    const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');
    if (estimasiQtyBadge) {
        estimasiQtyBadge.textContent = totalQuantity.toString();
        if (totalQuantity > 0) {
            estimasiQtyBadge.classList.add('show-badge');
        } else {
            estimasiQtyBadge.classList.remove('show-badge');
        }
    }

    // Perbarui badge harga
    const estimasiPriceBadge = document.getElementById('estimasiPriceBadge');
    if (estimasiPriceBadge) {
        estimasiPriceBadge.textContent = `Rp ${totalBelanja.toLocaleString('id-ID')}`;
        if (totalBelanja > 0) {
            estimasiPriceBadge.classList.add('show-badge');
        } else {
            estimasiPriceBadge.classList.remove('show-badge');
        }
    }
}

/**
 * Mengambil semua data estimasi dari postingan Blogger.
 * Setiap postingan diharapkan memiliki elemen <script class="data-estimasi" type="application/json">
 * yang berisi array JSON dari item estimasi.
 * @returns {Promise<Array<Object>>} Array gabungan dari semua item estimasi.
 */
async function ambilSemuaEstimasi() {
    console.log("Memulai pengambilan data estimasi dari Blogger...");
    const url = "/feeds/posts/default/-/estimasi?alt=json&max-results=50";
    let estimasiGabungan = [];

    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Kesalahan HTTP! status: ${res.status}`);
        }
        const json = await res.json();
        const entries = json.feed.entry || [];

        const parser = new DOMParser();

        for (const entry of entries) {
            const htmlContent = entry.content?.$t;
            if (htmlContent) {
                const docFromHtml = parser.parseFromString(htmlContent, 'text/html');
                const scriptNode = docFromHtml.querySelector("script.data-estimasi[type='application/json']");
                if (scriptNode && scriptNode.textContent) {
                    try {
                        const data = JSON.parse(scriptNode.textContent);
                        if (Array.isArray(data)) {
                            estimasiGabungan.push(...data);
                            console.log(`Berhasil mengurai data dari postingan: ${entry.title?.$t}`);
                        } else {
                            console.warn(`Data estimasi di postingan "${entry.title?.$t}" bukan array. Melewati.`);
                        }
                    } catch (e) {
                        console.warn(`Gagal mengurai JSON di postingan "${entry.title?.$t}":`, e);
                    }
                } else {
                    console.log(`Konten HTML kosong untuk postingan: ${entry.title?.$t}`);
                }
            }
        }
        console.log(`Pengambilan data estimasi selesai. Total item: ${estimasiGabungan.length}`);
    } catch (error) {
        console.error("Kesalahan saat mengambil data estimasi dari Blogger:", error);
    }
    return estimasiGabungan;
}

// Buat fungsi yang relevan dapat diakses secara global
window.updateEstimasiBadges = renderEstimasiTable;
window.addEstimasiItem = function(item) {
    addEstimasiItem(item, true);
};
window.getEstimasiItems = function() {
    return [...estimasiItems];
};
window.clearEstimasi = function() {
    estimasiItems = [];
    saveEstimasiToLocalStorage();
    renderEstimasiTable();
};
window.ambilSemuaEstimasi = ambilSemuaEstimasi; // Buat fungsi ambilSemuaEstimasi dapat diakses secara global

/**
 * Fungsi inisialisasi untuk modul tabel.
 */
window.initTable = function() {
    // Muat data estimasi saat DOM dimuat
    loadEstimasiFromLocalStorage();
    renderEstimasiTable(); // Render tabel dan badge setelah post map siap
};
