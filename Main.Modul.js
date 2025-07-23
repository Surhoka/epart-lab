// KONTEN BARU UNTUK Main.Modul.js

// Definisikan postMap secara global jika digunakan di luar populatePostMap
window.postMap = {}; 

/**
 * Mengisi postMap dengan judul dan URL postingan dari elemen tersembunyi.
 * @returns {Promise<void>} Sebuah Promise yang selesai ketika postMap terisi.
 */
window.populatePostMap = async function() {
    return new Promise((resolve, reject) => {
        const postMappingHidden = document.getElementById('postMappingHidden');
        if (postMappingHidden) {
            const links = postMappingHidden.querySelectorAll('a');
            links.forEach(link => {
                const title = link.textContent.trim();
                const url = link.getAttribute('href');
                if (title && url) {
                    window.postMap[title.toUpperCase()] = url;
                }
            });
            console.log("Main.Modul.js: Post map populated:", window.postMap);
            resolve();
        } else {
            // Ini akan muncul jika widget Blog2 tidak ada atau tidak memiliki #postMappingHidden
            console.warn("Main.Modul.js: Elemen #postMappingHidden tidak ditemukan. Post map tidak dapat diisi.");
            reject(new Error("Elemen #postMappingHidden tidak ditemukan."));
        }
    });
};

// Data Sheet URL (jika ini ada di Main.Modul.js)
const dataSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4jL9b8Wq-7qK6H0G8X5r-5rC6F7R1J5P6D0N9L6F8Z8C7T4M0P9S6D0H5R1J5P6D0N9L6F8Z8C7T4M0P9S6D0H5/pub?gid=0&single=true&output=csv';

// Array untuk menyimpan data item estimasi (jika ini ada di Main.Modul.js)
let estimasiItems = []; // Gunakan let agar bisa dimodifikasi

// Anda perlu memindahkan semua fungsi terkait estimasi, pencarian FIG,
// dan inisialisasi event listener yang sebelumnya ada di Main.Modul.js
// ke sini, dan pastikan mereka juga terekspos ke window jika dipanggil dari HTML
// atau modul lain.

// Contoh: Fungsi untuk merender ulang seluruh tabel estimasi
window.renderTable = function() {
    const tableBody = document.getElementById('estimasiTableBody');
    if (!tableBody) {
        console.error("Main.Modul.js: Elemen #estimasiTableBody tidak ditemukan.");
        return;
    }
    tableBody.innerHTML = ''; // Kosongkan tabel sebelum render ulang

    let grandTotal = 0;
    estimasiItems.forEach((item, index) => {
        tableBody.innerHTML += renderItemRow(item, index); // Pastikan renderItemRow ada atau diimpor
        grandTotal += item.qty * item.harga;
    });

    // Tambahkan baris input part baru di atas total
    tableBody.innerHTML += renderNewPartInputRow(); // Pastikan renderNewPartInputRow ada atau diimpor

    // Tambahkan baris total
    const totalRow = document.getElementById('totalRow');
    if (totalRow) {
        totalRow.innerHTML = renderTotalRow(grandTotal); // Pastikan renderTotalRow ada atau diimpor
    } else {
        console.warn("Main.Modul.js: Elemen #totalRow tidak ditemukan.");
    }

    // Setelah merender ulang, pasang kembali event listener
    attachTableEventListeners(); // Pastikan attachTableEventListeners ada atau diimpor
    updateNewPartAutoTotal(); // Pastikan updateNewPartAutoTotal ada atau diimpor
};

// Contoh: Fungsi untuk merender baris item (jika di Main.Modul.js)
function renderItemRow(item, index) {
    // ... (kode Anda untuk renderItemRow)
    const formattedPrice = window.formatRupiah(item.harga); // Pastikan formatRupiah global
    const total = item.qty * item.harga;
    const formattedTotal = window.formatRupiah(total);
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

// Contoh: Fungsi untuk format mata uang Rupiah (jika di Main.Modul.js atau Utils.Modul.js)
// Jika Anda punya Utils.Modul.js, ini harusnya ada di sana.
// Jika tidak, definisikan di sini dan ekspos ke window.
window.formatRupiah = function(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};
window.parseRupiah = function(rupiahString) {
    const cleanString = rupiahString.replace(/[^,\d]/g, '').replace('.', '');
    return parseFloat(cleanString.replace(',', '.'));
};

// ... (lanjutkan dengan semua fungsi lain dari Main.Modul.js Anda,
//      pastikan yang perlu diakses dari HTML atau modul lain
//      didefinisikan dengan `window.namaFungsi = function() { ... }`)

// Contoh: Initialisasi event listener yang bergantung pada DOM siap
// Ini bisa tetap di dalam DOMContentLoaded jika Anda mau,
// tetapi pastikan fungsi-fungsi yang dipanggil sudah global.
document.addEventListener('DOMContentLoaded', function() {
    console.log('Main.Modul.js: DOM Content Loaded. Initializing main functionalities.');

    // Inisialisasi event listener untuk tombol "Buat Estimasi"
    const openEstimasiModalBtn = document.getElementById('openEstimasiModal');
    if (openEstimasiModalBtn) {
        openEstimasiModalBtn.addEventListener('click', function(event) {
            event.preventDefault();
            // Panggil fungsi openEstimasiModal yang harusnya ada di Main.Modul.js atau Modal.Modul.js
            if (window.openEstimasiModal) {
                window.openEstimasiModal();
                window.renderTable(); // Panggil renderTable saat modal dibuka
            } else {
                console.error("Main.Modul.js: Fungsi openEstimasiModal tidak ditemukan.");
            }
        });
    }

    // Inisialisasi event listener untuk form pencarian di sidebar
    const sidebarForm = document.getElementById('sidebarSearchForm');
    const sidebarInput = document.getElementById('sidebarSearchInput');
    if (sidebarForm && sidebarInput) {
        sidebarForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = sidebarInput.value.trim().toUpperCase();
            if (query && window.jalankanPencarianFigSidebar) { // Pastikan jalankanPencarianFigSidebar global
                window.jalankanPencarianFigSidebar(query);
            } else if (!window.jalankanPencarianFigSidebar) {
                console.warn("Main.Modul.js: Fungsi jalankanPencarianFigSidebar tidak ditemukan.");
            }
        });
    }

    // Inisialisasi event listener untuk tombol download PDF
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', function() {
            if (window.generatePdf) { // Pastikan generatePdf global
                window.generatePdf();
            } else {
                console.warn("Main.Modul.js: Fungsi generatePdf tidak ditemukan.");
            }
        });
    }

    // Inisialisasi event listener untuk dropdown kategori kendaraan
    const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
    if (vehicleCategorySelect && window.populateVehicleCategories) { // Pastikan populateVehicleCategories global
        window.populateVehicleCategories();
        vehicleCategorySelect.addEventListener('change', function() {
            const selectedLabel = this.value;
            if (selectedLabel) {
                window.router.navigateTo(`/search/label/${selectedLabel}`);
            } else {
                window.router.navigateTo('/'); // Kembali ke beranda jika "Pilih Model Kendaraan" dipilih
            }
        });
    } else if (!window.populateVehicleCategories) {
        console.warn("Main.Modul.js: Fungsi populateVehicleCategories tidak ditemukan.");
    }
});

// Contoh: Fungsi untuk membuka modal estimasi (jika di Main.Modul.js)
window.openEstimasiModal = function() {
    const estimasiModal = document.getElementById('estimasiModal');
    if (estimasiModal) {
        estimasiModal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Mencegah scroll body
    } else {
        console.error("Main.Modul.js: Elemen #estimasiModal tidak ditemukan.");
    }
};

window.closeEstimasiModal = function() {
    const estimasiModal = document.getElementById('estimasiModal');
    if (estimasiModal) {
        estimasiModal.style.display = 'none';
        document.body.style.overflow = ''; // Mengembalikan scroll body
    }
};

// Event listener untuk menutup modal jika klik di luar area konten
const estimasiModal = document.getElementById('estimasiModal');
if (estimasiModal) {
    estimasiModal.addEventListener('click', function(e) {
        if (e.target === estimasiModal) {
            window.closeEstimasiModal();
        }
    });
}

// Event listener untuk menutup modal jika menekan tombol escape
document.addEventListener('keydown', function(e) {
    const estimasiModal = document.getElementById('estimasiModal');
    if (e.key === 'Escape' && estimasiModal && estimasiModal.style.display === 'flex') {
        window.closeEstimasiModal();
    }
});

// Fungsi untuk mengisi dropdown kategori kendaraan (jika di Main.Modul.js)
window.populateVehicleCategories = function() {
    const selectElement = document.getElementById('vehicleCategorySelect');
    const linkListWidget = document.querySelector('#LinkList2 ul'); // Asumsi LinkList2 berisi kategori
    
    if (selectElement && linkListWidget) {
        // Kosongkan opsi yang ada (kecuali opsi default)
        selectElement.innerHTML = '<option value="">Pilih Model Kendaraan</option>';
        
        const links = linkListWidget.querySelectorAll('li a');
        links.forEach(link => {
            const text = link.textContent.trim();
            // Ambil bagian setelah /search/label/
            const value = link.getAttribute('href').split('/search/label/')[1];
            if (text && value) {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = text;
                selectElement.appendChild(option);
            }
        });
        console.log("Main.Modul.js: Kategori kendaraan diisi.");
    } else {
        console.warn("Main.Modul.js: Elemen dropdown kategori atau widget LinkList2 tidak ditemukan.");
    }
};

// Fungsi pencarian FIG (dijalankan dari form pencarian)
window.jalankanPencarianFigSidebar = function(query) {
    const hasilContainer = document.getElementById('searchOnlyContent'); // Menggunakan searchOnlyContent
    if (!hasilContainer) {
        console.error("Main.Modul.js: Elemen #searchOnlyContent tidak ditemukan.");
        return;
    }
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
            // Update figData (jika ini global di Main.Modul.js)
            window.figData = lines.slice(1).map(line => {
                const values = line.split(',');
                let item = {};
                headers.forEach((header, index) => {
                    item[header] = values[index];
                });
                item.harga = parseFloat(item.harga) || 0; // Pastikan harga adalah number
                return item;
            });

            const q = query.toUpperCase();
            const hasil = window.figData.filter(row => { // Gunakan window.figData
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
              </div>`; // Pastikan renderFigResult global
            }
        })
        .catch(err => {
            console.error("Main.Modul.js: Gagal memuat data Sheet:", err);
            hasilContainer.innerHTML = `
              <div class="bg-red-100 border border-400 text-red-700 px-3 py-2 rounded">
                ⚠️ Gagal memuat data Sheet. (${err.message})
              </div>`;
        });
};

// Fungsi untuk merender hasil pencarian FIG (jika di Main.Modul.js)
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
window.handleAddToEstimasi = function(event) {
    const button = event.target.closest('.add-to-estimasi-btn');
    if (button) {
        const kodePart = button.dataset.kodePart;
        const deskripsi = button.dataset.deskripsi;
        const harga = parseFloat(button.dataset.harga);

        estimasiItems.push({ // Gunakan estimasiItems yang didefinisikan di atas
            kode_part: kodePart,
            deskripsi: deskripsi,
            qty: 1, // Default quantity
            harga: harga
        });
        window.renderTable(); // Panggil renderTable global
        window.showMessageBox(`"${kodePart}" ditambahkan ke estimasi.`, 'success');
        // Opsional: berikan feedback ke pengguna, misalnya tombol berubah jadi "Ditambahkan"
    }
};

// Pasang event listener untuk tombol "Tambah" di hasil pencarian
// Ini harus dipanggil setelah elemen hasil pencarian ada di DOM
document.addEventListener('DOMContentLoaded', function() {
    const hasilPencarianFigContainer = document.getElementById('searchOnlyContent');
    if (hasilPencarianFigContainer) {
        hasilPencarianFigContainer.addEventListener('click', window.handleAddToEstimasi);
    }
});

// Fungsi untuk merender baris total
function renderTotalRow(total) {
    return `
        <tr class="bg-blue-50 border-t-2 border-blue-200">
            <td colspan="5" class="text-right font-semibold pr-4 py-2 text-blue-800">Total Estimasi:</td>
            <td class="font-bold text-right py-2 text-blue-800" id="grandTotal">${window.formatRupiah(total)}</td>
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
                <input type="text" id="newPartAutoTotal" value="${window.formatRupiah(0)}" readonly class="bg-gray-100 cursor-not-allowed text-right"/>
            </td>
            <td>
                <button id="addNewPartBtn" class="bg-blue-600 hover:bg-blue-700 text-white active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full">
                    <i class="fas fa-plus"></i> Add
                </button>
            </td>
        </tr>
    `;
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
            e.target.value = window.parseRupiah(e.target.value);
        };
        input.onblur = (e) => { // Format kembali saat blur
            e.target.value = window.formatRupiah(parseFloat(e.target.value) || 0);
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
            e.target.value = window.parseRupiah(e.target.value);
        };
        newPartPriceInput.onblur = (e) => {
            e.target.value = window.formatRupiah(parseFloat(e.target.value) || 0);
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
    window.renderTable();
}

// Handler tombol plus/minus kuantitas
function handleQuantityButtonClick(event, delta) {
    const index = parseInt(event.target.dataset.index);
    estimasiItems[index].qty = Math.max(0, estimasiItems[index].qty + delta);
    window.renderTable();
}

// Handler perubahan harga
function handlePriceChange(event) {
    const index = parseInt(event.target.dataset.index);
    let newPrice = window.parseRupiah(event.target.value);
    if (isNaN(newPrice) || newPrice < 0) {
        newPrice = 0;
    }
    estimasiItems[index].harga = newPrice;
    window.renderTable();
}

// Handler penghapusan item
function handleRemoveItem(event) {
    const index = parseInt(event.target.dataset.index);
    estimasiItems.splice(index, 1);
    window.renderTable();
}

// Fungsi untuk memperbarui auto-total di baris input part baru
function updateNewPartAutoTotal() {
    const newPartQtyInput = document.getElementById('newPartQty');
    const newPartPriceInput = document.getElementById('newPartPrice');
    const newPartAutoTotalElement = document.getElementById('newPartAutoTotal');

    if (newPartQtyInput && newPartPriceInput && newPartAutoTotalElement) {
        const newPartQty = parseFloat(newPartQtyInput.value) || 0;
        const newPartPrice = window.parseRupiah(newPartPriceInput.value) || 0;
        newPartAutoTotalElement.value = window.formatRupiah(newPartQty * newPartPrice);
    }
}

// Handler penambahan part baru
function handleAddNewPart() {
    const newPartCodeInput = document.getElementById('newPartCode');
    const newPartDescriptionInput = document.getElementById('newPartDescription');
    const newPartQtyInput = document.getElementById('newPartQty');
    const newPartPriceInput = document.getElementById('newPartPrice');

    if (!newPartCodeInput || !newPartDescriptionInput || !newPartQtyInput || !newPartPriceInput) {
        window.showMessageBox('Error: Input field tidak ditemukan.', 'error');
        return;
    }

    const newPartCode = newPartCodeInput.value.trim();
    const newPartDescription = newPartDescriptionInput.value.trim();
    const newPartQty = parseFloat(newPartQtyInput.value) || 0;
    const newPartPrice = window.parseRupiah(newPartPriceInput.value) || 0;

    if (!newPartCode || !newPartDescription) {
        window.showMessageBox('Kode Part dan Deskripsi Part tidak boleh kosong.', 'error');
        return;
    }

    estimasiItems.push({
        kode_part: newPartCode,
        deskripsi: newPartDescription,
        qty: newPartQty,
        harga: newPartPrice
    });

    // Kosongkan input field setelah menambahkan
    newPartCodeInput.value = '';
    newPartDescriptionInput.value = '';
    newPartQtyInput.value = '1';
    newPartPriceInput.value = '0';

    window.renderTable();
    window.showMessageBox(`Part "${newPartCode}" berhasil ditambahkan.`, 'success');
}


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
            harga: window.formatRupiah(item.harga),
            jumlah: window.formatRupiah(total)
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
    doc.text(`Total Estimasi: ${window.formatRupiah(grandTotal)}`, doc.internal.pageSize.getWidth() - 14, finalY + 10, { align: 'right' });

    // Simpan PDF
    doc.save('estimasi-part.pdf');
    window.showMessageBox('PDF berhasil dibuat!', 'success');
};


// ============== Nested Modal (Kirim Estimasi) ==============
window.openKirimEstimasiModal = function() {
    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
    if (kirimEstimasiModal) {
        kirimEstimasiModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    } else {
        console.error("Main.Modul.js: Elemen #kirimEstimasiModal tidak ditemukan.");
    }
};

window.closeKirimEstimasiModal = function() {
    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
    if (kirimEstimasiModal) {
        kirimEstimasiModal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// Event listener untuk tombol "Kirim Estimasi" di modal utama
document.addEventListener('DOMContentLoaded', function() {
    const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
    if (openKirimEstimasiModalBtn) {
        openKirimEstimasiModalBtn.addEventListener('click', window.openKirimEstimasiModal);
    }

    const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
    if (closeKirimEstimasiModalBtn) {
        closeKirimEstimasiModalBtn.addEventListener('click', window.closeKirimEstimasiModal);
    }

    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
    if (kirimEstimasiModal) {
        kirimEstimasiModal.addEventListener('click', function(e) {
            if (e.target === kirimEstimasiModal) {
                window.closeKirimEstimasiModal();
            }
        });
    }

    // Handle form submission for "Kirim Estimasi"
    const estimasiForm = document.getElementById('estimasiForm');
    if (estimasiForm) {
        estimasiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nama = document.getElementById('namaPengirim').value;
            const hp = document.getElementById('noHandphone').value;
            const email = document.getElementById('emailPengirim').value;

            if (!nama || !hp || !email) {
                window.showMessageBox('Harap isi semua kolom form.', 'error');
                return;
            }

            // Format data estimasi untuk pengiriman
            const formattedEstimasi = estimasiItems.map(item => ({
                'Kode Part': item.kode_part,
                'Deskripsi': item.deskripsi,
                'Qty': item.qty,
                'Harga': window.formatRupiah(item.harga),
                'Jumlah': window.formatRupiah(item.qty * item.harga)
            }));

            const grandTotal = estimasiItems.reduce((sum, item) => sum + (item.qty * item.harga), 0);

            let messageBody = `Nama: ${nama}\n`;
            messageBody += `No. HP: ${hp}\n`;
            messageBody += `Email: ${email}\n\n`;
            messageBody += "Detail Estimasi:\n";
            formattedEstimasi.forEach(item => {
                messageBody += `- ${item['Kode Part']} (${item['Qty']}x) - ${item['Deskripsi']} @ ${item['Harga']} = ${item['Jumlah']}\n`;
            });
            messageBody += `\nTotal Keseluruhan: ${window.formatRupiah(grandTotal)}`;

            const whatsappUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(messageBody)}`; // Ganti dengan nomor WhatsApp Anda
            window.open(whatsappUrl, '_blank');

            window.showMessageBox('Estimasi berhasil dikirim via WhatsApp!', 'success');
            window.closeKirimEstimasiModal();
            // Reset form
            estimasiForm.reset();
        });
    }
});

// Fungsi untuk memperbarui badge harga dan kuantitas di tombol "Estimasi"
window.updateEstimasiBadge = function() {
    const estimasiPriceBadge = document.getElementById('estimasiPriceBadge');
    const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');

    if (estimasiPriceBadge && estimasiQtyBadge) {
        const totalQty = estimasiItems.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = estimasiItems.reduce((sum, item) => sum + (item.qty * item.harga), 0);

        estimasiQtyBadge.textContent = totalQty;
        estimasiPriceBadge.textContent = window.formatRupiah(totalPrice);

        if (totalQty > 0) {
            estimasiQtyBadge.classList.add('show-badge');
            estimasiPriceBadge.classList.add('show-badge');
        } else {
            estimasiQtyBadge.classList.remove('show-badge');
            estimasiPriceBadge.classList.remove('show-badge');
        }
    }
};

// Panggil updateEstimasiBadge setiap kali tabel dirender ulang
const originalRenderTable = window.renderTable;
window.renderTable = function() {
    originalRenderTable(); // Panggil fungsi renderTable asli
    window.updateEstimasiBadge(); // Perbarui badge setelah render
};

// Panggil updateEstimasiBadge saat DOMContentLoaded untuk inisialisasi awal
document.addEventListener('DOMContentLoaded', window.updateEstimasiBadge);
