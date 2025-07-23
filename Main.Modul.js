// Data Sheet URL
const dataSheetUrl = 'https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster';

// Fungsi bantuan untuk format mata uang Rupiah
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Fungsi bantuan untuk parse Rupiah string kembali ke number
function parseRupiah(rupiahString) {
    const cleanString = rupiahString.replace(/[^,\d]/g, '').replace('.', '');
    return parseFloat(cleanString.replace(',', '.'));
}

// Fungsi untuk merender baris item di tabel estimasi
function renderItemRow(item, index) {
    const formattedPrice = formatRupiah(item.harga);
    const total = item.qty * item.harga;
    const formattedTotal = formatRupiah(total);

    return `
        <tr class="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200">
            <td>${index + 1}</td>
            <td>${item.kode_part}</td>
            <td class="deskripsi-cell">${item.deskripsi}</td>
            <td>
                <div class="inline-flex items-center justify-center relative">
                    <button type="button" class="qty-btn-down absolute left-0" data-index="${index}">-</button>
                    <input type="number" class="qty-input-table" value="${item.qty}" min="0" data-index="${index}" />
                    <button type="button" class="qty-btn-up absolute right-0" data-index="${index}">+</button>
                </div>
            </td>
            <td>
                <input type="text" class="price-input-table" value="${formattedPrice}" data-index="${index}" />
            </td>
            <td><span class="total-item-price">${formattedTotal}</span></td>
            <td>
                <button type="button" class="remove-item-btn text-red-600 hover:text-red-800 transition-colors duration-150" data-index="${index}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `;
}

// Fungsi untuk merender baris total
function renderTotalRow(total) {
    return `
        <tr class="bg-blue-50 border-t-2 border-blue-200">
            <td colspan="5" class="text-right font-semibold pr-4 py-2 text-blue-800">Total Estimasi:</td>
            <td class="font-bold text-right py-2 text-blue-800" id="grandTotal">${formatRupiah(total)}</td>
            <td></td>
        </tr>
    `;
}

// Fungsi untuk merender baris input part baru
function renderNewPartInputRow() {
    return `
        <tr class="estimasi-input-row">
            <td class="py-2 px-2 text-center text-gray-500 font-bold">#</td>
            <td>
                <input type="text" id="newPartCode" placeholder="Kode Part" class="focus:border-blue-500 focus:ring-blue-500"/>
            </td>
            <td>
                <input type="text" id="newPartDescription" placeholder="Deskripsi Part" class="focus:border-blue-500 focus:ring-blue-500"/>
            </td>
            <td>
                <input type="number" id="newPartQty" value="1" min="1" class="focus:border-blue-500 focus:ring-blue-500 text-center"/>
            </td>
            <td>
                <input type="text" id="newPartPrice" value="0" class="focus:border-blue-500 focus:ring-blue-500 text-right"/>
            </td>
            <td class="text-center">
                <input type="text" id="newPartAutoTotal" value="${formatRupiah(0)}" readonly class="bg-gray-100 cursor-not-allowed text-right"/>
            </td>
            <td>
                <button id="addNewPartBtn" class="bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full">
                    <i class="fas fa-plus"></i> Add
                </button>
            </td>
        </tr>
    `;
}

// Array untuk menyimpan data item estimasi
let estimasiItems = [];

// Fungsi untuk merender ulang seluruh tabel estimasi
function renderTable() {
    const tableBody = document.getElementById('estimasiTableBody');
    tableBody.innerHTML = ''; // Kosongkan tabel sebelum render ulang

    let grandTotal = 0;
    estimasiItems.forEach((item, index) => {
        tableBody.innerHTML += renderItemRow(item, index);
        grandTotal += item.qty * item.harga;
    });

    // Tambahkan baris input part baru di atas total
    tableBody.innerHTML += renderNewPartInputRow();

    // Tambahkan baris total
    const totalRow = document.getElementById('totalRow');
    totalRow.innerHTML = renderTotalRow(grandTotal);

    // Setelah merender ulang, pasang kembali event listener
    attachTableEventListeners();
    updateNewPartAutoTotal();
}

// Fungsi untuk memasang event listener pada elemen tabel
function attachTableEventListeners() {
    document.querySelectorAll('.qty-input-table').forEach(input => {
        input.oninput = handleQuantityChange;
        input.onchange = handleQuantityChange;
    });
    document.querySelectorAll('.qty-btn-up').forEach(button => {
        button.onclick = (e) => handleQuantityButtonClick(e, 1);
    });
    document.querySelectorAll('.qty-btn-down').forEach(button => {
        button.onclick = (e) => handleQuantityButtonClick(e, -1);
    });
    document.querySelectorAll('.price-input-table').forEach(input => {
        input.oninput = handlePriceChange;
        input.onchange = handlePriceChange;
        input.onfocus = (e) => { // Hapus format saat fokus
            e.target.value = parseRupiah(e.target.value);
        };
        input.onblur = (e) => { // Format kembali saat blur
            e.target.value = formatRupiah(parseFloat(e.target.value) || 0);
        };
    });
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.onclick = handleRemoveItem;
    });

    // Event listeners untuk baris input part baru
    const newPartQtyInput = document.getElementById('newPartQty');
    const newPartPriceInput = document.getElementById('newPartPrice');
    const addNewPartBtn = document.getElementById('addNewPartBtn');

    if (newPartQtyInput) {
        newPartQtyInput.oninput = updateNewPartAutoTotal;
        newPartQtyInput.onchange = updateNewPartAutoTotal;
    }
    if (newPartPriceInput) {
        newPartPriceInput.oninput = updateNewPartAutoTotal;
        newPartPriceInput.onchange = updateNewPartAutoTotal;
        newPartPriceInput.onfocus = (e) => {
            e.target.value = parseRupiah(e.target.value);
        };
        newPartPriceInput.onblur = (e) => {
            e.target.value = formatRupiah(parseFloat(e.target.value) || 0);
        };
    }
    if (addNewPartBtn) {
        addNewPartBtn.onclick = handleAddNewPart;
    }
}

// Handler perubahan kuantitas
function handleQuantityChange(event) {
    const index = parseInt(event.target.dataset.index);
    let newQty = parseInt(event.target.value);
    if (isNaN(newQty) || newQty < 0) {
        newQty = 0;
    }
    estimasiItems[index].qty = newQty;
    renderTable();
}

// Handler tombol plus/minus kuantitas
function handleQuantityButtonClick(event, delta) {
    const index = parseInt(event.target.dataset.index);
    estimasiItems[index].qty = Math.max(0, estimasiItems[index].qty + delta);
    renderTable();
}

// Handler perubahan harga
function handlePriceChange(event) {
    const index = parseInt(event.target.dataset.index);
    let newPrice = parseRupiah(event.target.value);
    if (isNaN(newPrice) || newPrice < 0) {
        newPrice = 0;
    }
    estimasiItems[index].harga = newPrice;
    renderTable();
}

// Handler penghapusan item
function handleRemoveItem(event) {
    const index = parseInt(event.target.dataset.index);
    estimasiItems.splice(index, 1);
    renderTable();
}

// Fungsi untuk memperbarui auto-total di baris input part baru
function updateNewPartAutoTotal() {
    const newPartQty = parseFloat(document.getElementById('newPartQty')?.value) || 0;
    const newPartPrice = parseRupiah(document.getElementById('newPartPrice')?.value) || 0;
    const newPartAutoTotal = document.getElementById('newPartAutoTotal');
    if (newPartAutoTotal) {
        newPartAutoTotal.value = formatRupiah(newPartQty * newPartPrice);
    }
}

// Handler penambahan part baru
function handleAddNewPart() {
    const newPartCode = document.getElementById('newPartCode')?.value?.trim();
    const newPartDescription = document.getElementById('newPartDescription')?.value?.trim();
    const newPartQty = parseFloat(document.getElementById('newPartQty')?.value) || 0;
    const newPartPrice = parseRupiah(document.getElementById('newPartPrice')?.value) || 0;

    if (!newPartCode || !newPartDescription) {
        alert('Kode Part dan Deskripsi Part tidak boleh kosong.');
        return;
    }

    estimasiItems.push({
        kode_part: newPartCode,
        deskripsi: newPartDescription,
        qty: newPartQty,
        harga: newPartPrice
    });

    // Kosongkan input field setelah menambahkan
    document.getElementById('newPartCode').value = '';
    document.getElementById('newPartDescription').value = '';
    document.getElementById('newPartQty').value = '1';
    document.getElementById('newPartPrice').value = '0';

    renderTable();
}


// ============== Fungsi Modal Estimasi ==============
const estimasiModal = document.getElementById('estimasiModal');
const closeButton = estimasiModal?.querySelector('.close-button');

function openEstimasiModal() {
    estimasiModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Mencegah scroll body
}

function closeEstimasiModal() {
    estimasiModal.style.display = 'none';
    document.body.style.overflow = ''; // Mengembalikan scroll body
}

// Tutup modal jika klik di luar area konten
estimasiModal?.addEventListener('click', function(e) {
    if (e.target === estimasiModal) {
        closeEstimasiModal();
    }
});

// Tutup modal jika menekan tombol escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && estimasiModal.style.display === 'flex') {
        closeEstimasiModal();
    }
});

// Pasang listener untuk tombol "Buat Estimasi"
document.querySelectorAll('.open-estimasi-modal-btn').forEach(button => {
    button.addEventListener('click', (event) => {
        event.preventDefault(); // Mencegah navigasi jika ini link
        openEstimasiModal();
        renderTable(); // Pastikan tabel dirender saat modal dibuka
    });
});


// ============== PDF Generation Logic ==============
window.generatePdf = function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Kolom tabel
    const columns = [
        { header: 'No', dataKey: 'no' },
        { header: 'Kode Part', dataKey: 'kode_part' },
        { header: 'Deskripsi', dataKey: 'deskripsi' },
        { header: 'Qty', dataKey: 'qty' },
        { header: 'Harga', dataKey: 'harga' },
        { header: 'Jumlah', dataKey: 'jumlah' }
    ];

    // Persiapan data
    const data = estimasiItems.map((item, index) => {
        const total = item.qty * item.harga;
        return {
            no: index + 1,
            kode_part: item.kode_part,
            deskripsi: item.deskripsi,
            qty: item.qty,
            harga: formatRupiah(item.harga),
            jumlah: formatRupiah(total)
        };
    });

    // Hitung grand total
    const grandTotal = estimasiItems.reduce((sum, item) => sum + (item.qty * item.harga), 0);

    // Tambahkan judul
    doc.setFontSize(18);
    doc.text("Daftar Estimasi Part", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    // Tambahkan tabel
    doc.autoTable({
        columns: columns,
        body: data,
        startY: 30,
        headStyles: { fillColor: [0, 51, 102] }, // Dark blue header
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
            no: { cellWidth: 10 },
            kode_part: { cellWidth: 30 },
            deskripsi: { cellWidth: 70 },
            qty: { cellWidth: 15, halign: 'center' },
            harga: { cellWidth: 30, halign: 'right' },
            jumlah: { cellWidth: 30, halign: 'right' }
        },
        didDrawPage: function (data) {
            // Footer
            let str = "Page " + doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(str, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    });

    // Tambahkan total di bagian bawah tabel
    const finalY = doc.autoTable.previous.finalY; // Get the y position of the end of the table
    doc.setFontSize(12);
    doc.text(`Total Estimasi: ${formatRupiah(grandTotal)}`, doc.internal.pageSize.getWidth() - 14, finalY + 10, { align: 'right' });

    // Simpan PDF
    doc.save('estimasi-part.pdf');
};

// ============== Pencarian Fig (data dari Google Sheet) ==============
// Contoh data FIG (akan dimuat dari Google Sheet)
let figData = [];

// Fungsi untuk merender hasil pencarian FIG
function renderFigResult(item) {
    return `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-center justify-between group">
            <div>
                <h4 class="font-semibold text-gray-800">${item.kode_part}</h4>
                <p class="text-gray-600 text-sm">${item.deskripsi}</p>
            </div>
            <button class="add-to-estimasi-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-150 transform translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    data-kode-part="${item.kode_part}"
                    data-deskripsi="${item.deskripsi}"
                    data-harga="${item.harga}">
                <i class="fas fa-plus-circle"></i> Tambah
            </button>
        </div>
    `;
}

// Fungsi untuk menambahkan item dari hasil pencarian ke tabel estimasi
function handleAddToEstimasi(event) {
    const button = event.target.closest('.add-to-estimasi-btn');
    if (button) {
        const kodePart = button.dataset.kodePart;
        const deskripsi = button.dataset.deskripsi;
        const harga = parseFloat(button.dataset.harga);

        estimasiItems.push({
            kode_part: kodePart,
            deskripsi: deskripsi,
            qty: 1, // Default quantity
            harga: harga
        });
        renderTable();
        // Opsional: berikan feedback ke pengguna, misalnya tombol berubah jadi "Ditambahkan"
    }
}

// Pasang event listener untuk tombol "Tambah" di hasil pencarian
document.getElementById('hasilPencarianFigContainer')?.addEventListener('click', handleAddToEstimasi);

// Fungsi pencarian FIG (dijalankan dari form pencarian)
window.jalankanPencarianFigSidebar = function(query) {
    const hasilContainer = document.getElementById('hasilPencarianFigContainer');
    hasilContainer.innerHTML = `<div class="bg-blue-50 border border-blue-200 rounded p-3 text-blue-700 text-sm">
                                  ⏳ Mencari data untuk <strong>${query}</strong>...
                                </div>`;

    fetch(dataSheetUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            const lines = csvText.split('\n');
            const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
            figData = lines.slice(1).map(line => {
                const values = line.split(',');
                let item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                item.harga = parseFloat(item.harga) || 0; // Pastikan harga adalah number
                return item;
            });

            const q = query.toUpperCase();
            const hasil = figData.filter(row => {
                const kp = row.kode_part?.toUpperCase() || "";
                const ja = row.jenis_aplikasi?.toUpperCase() || "";
                const ds = row.deskripsi?.toUpperCase() || "";
                return kp.includes(q) || ja.includes(q) || ds.includes(q);
            });

            if (hasil.length === 0) {
                hasilContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                  ❌ Tidak ditemukan hasil untuk <strong>${query}</strong>
                </div>`;
            } else {
                hasilContainer.innerHTML = `<div class="space-y-4">
                ${hasil.map(renderFigResult).join('')}
              </div>`;
            }
        })
        .catch(err => {
            console.error("⚠️ Fetch gagal:", err);
            hasilContainer.innerHTML = `
              <div class="bg-red-100 border border-400 text-red-700 px-3 py-2 rounded">
                ⚠️ Gagal memuat data Sheet. (${err.message})
              </div>`;
        });
};

// 🧾 Pasang listener form pencarian di sidebar (Disesuaikan)
const sidebarForm = document.getElementById('sidebarSearchForm');
const sidebarInput = document.getElementById('sidebarSearchInput');
sidebarForm?.addEventListener('submit', function (e) {
    e.preventDefault();
    const query = sidebarInput?.value?.trim()?.toUpperCase();
    if (query) window.jalankanPencarianFigSidebar(query);
});

// Event listener untuk menu mobile
const mobileMenuButton = document.getElementById('mobile-menu-button-in-nav');
const mainMenuNav = document.getElementById('main-menu-nav');

if (mobileMenuButton && mainMenuNav) {
    mobileMenuButton.addEventListener('click', () => {
        mainMenuNav.classList.toggle('show');
    });
}

// Event listener untuk dropdown di menu mobile
document.querySelectorAll('li.group > a.dropdown-toggle').forEach(dropdownToggle => {
    dropdownToggle.addEventListener('click', function(e) {
        if (window.innerWidth <= 767) { // Hanya aktif di mobile
            e.preventDefault();
            const parentLi = this.closest('li.group');
            parentLi.classList.toggle('show-dropdown');

            // Tutup dropdown lain pada level yang sama
            parentLi.parentNode.querySelectorAll('li.group').forEach(otherLi => {
                if (otherLi !== parentLi) {
                    otherLi.classList.remove('show-dropdown');
                }
            });
        }
    });
});