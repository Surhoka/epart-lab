// estimation-modal.js

// Pastikan window.postMap sudah diinisialisasi secara global atau dimuat dari localStorage
// Ini diperlukan untuk fungsi ambilSemuaEstimasi dan resolveFigLink jika digunakan di luar modal
window.postMap = window.postMap || {};

// --- Custom Toast Notification ---
const customToast = document.getElementById('customToast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout; // Variabel untuk menyimpan ID timeout

/**
 * Menampilkan pesan toast kustom.
 * @param {string} message - Pesan yang akan ditampilkan di toast.
 */
function showMessageBox(message) {
    if (customToast && toastMessage) {
        // Hapus timeout yang ada untuk mencegah tumpang tindih toast
        clearTimeout(toastTimeout);
        
        toastMessage.textContent = message;
        customToast.style.display = 'block'; // Jadikan terlihat
        customToast.classList.add('show'); // Tambahkan kelas 'show' untuk transisi

        // Sembunyikan toast secara otomatis setelah 3 detik
        toastTimeout = setTimeout(() => {
            customToast.classList.remove('show'); // Hapus kelas 'show' untuk transisi keluar
            // Setelah transisi, atur display ke none untuk menghapusnya dari tata letak
            setTimeout(() => {
                customToast.style.display = 'none';
            }, 400); // Sesuaikan dengan durasi transisi CSS
        }, 3000); // 3 detik
    }
}

// --- Estimation Modal Functionality with LocalStorage ---
const openEstimasiModalBtn = document.getElementById('openEstimasiModal');

// Hanya lanjutkan dengan inisialisasi modal jika tombol pembuka modal ada di halaman
if (openEstimasiModalBtn) {
    const estimasiModal = document.getElementById('estimasiModal');
    const closeEstimasiModalBtn = document.getElementById('closeEstimasiModal');
    const estimasiTableBody = document.getElementById('estimasiTableBody');
    const estimasiModalContent = document.getElementById('estimasiModalContent');
    const headerTableWrapper = document.querySelector('.header-table-wrapper');
    const bodyTableWrapper = document.querySelector('.body-table-wrapper');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Elemen input baris part baru (sekarang global dalam cakupan ini)
    let newPartKodePartInput;
    let newPartDeskripsiInput;
    let newPartQtyInput;
    let newPartHargaInput;
    let addPartBtn;

    // Elemen modal bersarang (nested modal)
    const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
    const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
    const estimasiForm = document.getElementById('estimasiForm');

    // Data estimasi akan disimpan di sini
    let estimasiItems = [];

    /**
     * Memuat data estimasi dari localStorage.
     */
    function loadEstimasiFromLocalStorage() {
        const storedData = localStorage.getItem('estimasiData');
        if (storedData) {
            try {
                estimasiItems = JSON.parse(storedData);
            } catch (e) {
                console.error("Kesalahan saat mengurai data estimasi dari localStorage:", e);
                estimasiItems = []; // Reset jika ada kesalahan penguraian
            }
        }
    }

    /**
     * Menyimpan data estimasi ke localStorage.
     */
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
        const hargaBaru = newItem.harga;

        // Sesuaikan untuk juga memeriksa deskripsi untuk item yang sudah ada
        const existingIndex = estimasiItems.findIndex(item =>
            item.kodePart.trim().toUpperCase() === kodeBaru &&
            item.deskripsi.trim() === deskripsiBaru
        );

        if (existingIndex !== -1) {
            if (isIncrement) {
                estimasiItems[existingIndex].qty += qtyBaru;
                showMessageBox(`Qty untuk part '${deskripsiBaru}' ditambahkan jadi ${estimasiItems[existingIndex].qty}x`);
            } else {
                estimasiItems[existingIndex].qty -= qtyBaru;
                if (estimasiItems[existingIndex].qty <= 0) {
                    const removedItem = estimasiItems.splice(existingIndex, 1);
                    showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) dihapus dari keranjang.`);
                } else {
                    showMessageBox(`Qty untuk part '${deskripsiBaru}' dikurangi jadi ${estimasiItems[existingIndex].qty}x`);
                }
            }
        } else if (isIncrement) { // Hanya tambahkan item baru jika ini adalah operasi penambahan
            estimasiItems.push({
                kodePart: kodeBaru,
                deskripsi: deskripsiBaru,
                qty: qtyBaru,
                harga: hargaBaru
            });
            showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) ditambahkan ke keranjang dengan ${qtyBaru}x`);
        } else {
            showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) tidak ditemukan di keranjang.`);
        }

        saveEstimasiToLocalStorage();
        renderEstimasiTable();
    }

    /**
     * Merender ulang tabel estimasi dan memperbarui badge.
     */
    function renderEstimasiTable() {
        const estimasiTableBody = document.getElementById('estimasiTableBody');
        if (!estimasiTableBody) return;

        estimasiTableBody.innerHTML = '';
        let totalBelanja = 0;
        let totalQuantity = 0;

        // Render item yang sudah ada
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
                            <button class="qty-btn-up text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">+</button>
                            <button class="qty-btn-down text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">-</button>
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

        // Tambahkan baris input part baru
        const newPartRow = document.createElement('tr');
        newPartRow.classList.add('estimasi-input-row');
        newPartRow.innerHTML = `
            <td class="text-center text-gray-400">#</td>
            <td><input type="text" id="newPartKodePart" placeholder="Kode Part" /></td>
            <td><input type="text" id="newPartDeskripsi" placeholder="Deskripsi" readonly /></td>
            <td><input type="number" id="newPartQty" placeholder="Qty" value="1" min="1" /></td>
            <td><input type="text" id="newPartHarga" placeholder="Harga" /></td>
            <td class="text-center text-gray-400">Auto</td>
            <td class="text-center">
                <button id="addPartBtn" class="bg-blue-500 hover:bg-blue-600 text-white">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        `;
        estimasiTableBody.appendChild(newPartRow);

        // Tetapkan kembali referensi global ke elemen input baru setelah dirender
        newPartKodePartInput = document.getElementById('newPartKodePart');
        newPartDeskripsiInput = document.getElementById('newPartDeskripsi');
        newPartQtyInput = document.getElementById('newPartQty');
        newPartHargaInput = document.getElementById('newPartHarga');
        addPartBtn = document.getElementById('addPartBtn');

        // Pasang kembali event listener untuk baris input part baru
        if (addPartBtn) {
            addPartBtn.onclick = function() {
                const kodePart = newPartKodePartInput.value.trim();
                const deskripsi = newPartDeskripsiInput.value.trim();
                const qty = parseInt(newPartQtyInput.value, 10);
                const hargaStr = newPartHargaInput.value.replace(/[^0-9]/g, '');
                const harga = parseInt(hargaStr, 10);

                if (kodePart && deskripsi && !isNaN(qty) && qty > 0 && !isNaN(harga) && harga >= 0) {
                    const newItem = {
                        kodePart: kodePart,
                        deskripsi: deskripsi,
                        qty: qty,
                        harga: harga
                    };
                    addEstimasiItem(newItem, true);
                    // Bersihkan kolom input setelah menambahkan
                    newPartKodePartInput.value = '';
                    newPartDeskripsiInput.value = '';
                    newPartQtyInput.value = '1';
                    newPartHargaInput.value = '';
                } else {
                    showMessageBox('Mohon lengkapi semua kolom input part baru dengan benar (Kode Part, Deskripsi, Qty > 0, Harga >= 0).');
                }
            };
        }

        // Event listener untuk newPartKodePartInput untuk mengambil data
        if (newPartKodePartInput) {
            newPartKodePartInput.addEventListener('change', async function() {
                const kodePart = this.value.trim().toUpperCase();
                if (kodePart) {
                    const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 
                    try {
                        const res = await fetch(sheetURL);
                        if (!res.ok) {
                            throw new Error(`Gagal mengambil sheet: ${res.status}`);
                        }
                        const data = await res.json();
                        const foundPart = data.find(row => row.kodepart?.toUpperCase() === kodePart);

                        if (foundPart) {
                            newPartDeskripsiInput.value = foundPart.deskripsi || '';
                            newPartHargaInput.value = `Rp ${parseInt(foundPart.harga || 0, 10).toLocaleString('id-ID')}`;
                            showMessageBox(`Part '${foundPart.deskripsi}' ditemukan.`);
                        } else {
                            newPartDeskripsiInput.value = '';
                            newPartHargaInput.value = '';
                            showMessageBox(`Kode Part '${kodePart}' tidak ditemukan.`);
                        }
                    } catch (error) {
                        console.error("Kesalahan saat mengambil data part:", error);
                        showMessageBox(`Gagal mencari kode part: ${error.message}`);
                    }
                } else {
                    newPartDeskripsiInput.value = '';
                    newPartHargaInput.value = '';
                }
            });
        }

        if (newPartHargaInput) {
            newPartHargaInput.onblur = function() {
                const value = this.value.replace(/[^0-9]/g, '');
                if (value) {
                    this.value = `Rp ${parseInt(value, 10).toLocaleString('id-ID')}`;
                }
            };
            newPartHargaInput.onfocus = function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            };
        }

        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="5" class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Total:</td>
            <td class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
            <td class="py-2 px-4 border-t border-gray-200 text-sm"></td>
        `;
        estimasiTableBody.appendChild(totalRow);

        // Listener untuk input qty (item yang sudah ada)
        document.querySelectorAll('.qty-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newQty = parseInt(e.target.value, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newQty) && newQty > 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty = newQty;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Render ulang untuk memperbarui total dan baris lainnya
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi ${newQty}x`);
                } else {
                    // Jika newQty 0 atau kurang, anggap sebagai penghapusan
                    if (newQty <= 0 && idx >= 0 && idx < estimasiItems.length) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Part '${namaItem}' telah dihapus dari estimasi.`);
                    } else {
                        showMessageBox(`Qty tidak valid. Masukkan angka lebih dari 0.`);
                        // Kembalikan nilai input ke kuantitas valid sebelumnya
                        e.target.value = estimasiItems[idx].qty;
                    }
                }
            });
        });

        // Listener untuk input harga (item yang sudah ada)
        document.querySelectorAll('.price-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newPriceString = e.target.value.replace(/[^0-9]/g, '');
                const newPrice = parseInt(newPriceString, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newPrice) && newPrice >= 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].harga = newPrice;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Render ulang untuk memperbarui total dan baris lainnya
                    showMessageBox(`Harga untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi Rp ${newPrice.toLocaleString('id-ID')}`);
                } else {
                    showMessageBox(`Harga tidak valid. Masukkan angka yang benar.`);
                    // Kembalikan nilai input ke harga valid sebelumnya
                    e.target.value = `Rp ${estimasiItems[idx].harga.toLocaleString('id-ID')}`;
                }
            });
        });

        // Listener untuk tombol hapus (item yang sudah ada)
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
                    showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                }
            });
        });

        // Listener untuk tombol plus (qty-btn-up) (item yang sudah ada)
        document.querySelectorAll('.qty-btn-up').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty++;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' ditambahkan jadi ${estimasiItems[idx].qty}x`);
                }
            });
        });

        // Listener untuk tombol minus (qty-btn-down) (item yang sudah ada)
        document.querySelectorAll('.qty-btn-down').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index);
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty--;
                    if (estimasiItems[idx].qty <= 0) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                    } else {
                        showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' dikurangi jadi ${estimasiItems[idx].qty}x`);
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
     * Menghasilkan PDF dari daftar estimasi.
     */
    function generatePdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const columns = [
            { header: 'No', dataKey: 'no' },
            { header: 'Kode Part', dataKey: 'kodePart' },
            { header: 'Deskripsi', dataKey: 'deskripsi' },
            { header: 'Qty', dataKey: 'qty' },
            { header: 'Harga (Rp)', dataKey: 'harga' },
            { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
        ];

        const data = estimasiItems.map((item, index) => {
            const jumlah = item.qty * item.harga;
            return {
                no: index + 1,
                kodePart: item.kodePart,
                deskripsi: item.deskripsi,
                qty: item.qty,
                harga: item.harga.toLocaleString('id-ID'),
                jumlah: jumlah.toLocaleString('id-ID')
            };
        });

        let totalBelanja = 0;
        estimasiItems.forEach(item => {
            totalBelanja += item.qty * item.harga;
        });

        doc.setFontSize(18);
        doc.text("Daftar Estimasi Sparepart", 105, 20, null, null, "center");

        doc.autoTable({
            startY: 30,
            head: [columns.map(col => col.header)],
            body: data.map(row => columns.map(col => row[col.dataKey])),
            theme: 'striped',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                valign: 'middle',
                halign: 'left'
            },
            headStyles: {
                fillColor: [0, 51, 102],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center', cellWidth: 25 },
                2: { halign: 'left', cellWidth: 60 },
                3: { halign: 'center', cellWidth: 15 },
                4: { halign: 'right', cellWidth: 25 },
                5: { halign: 'right', cellWidth: 30 }
            },
            didDrawPage: function(data) {
                let str = "Halaman " + doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        const finalY = doc.autoTable.previous.finalY;
        doc.setFontSize(10);
        doc.text(`Total Belanja: Rp ${totalBelanja.toLocaleString('id-ID')}`, doc.internal.pageSize.width - doc.internal.pageSize.width / 4, finalY + 10, null, null, "right");

        doc.save('estimasi_belanja.pdf');
        showMessageBox('Daftar estimasi Anda telah diunduh sebagai PDF!');
    }

    /**
     * Mengambil semua data estimasi dari postingan Blogger.
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
                        console.log(`Tidak ditemukan script.data-estimasi di postingan: ${entry.title?.$t}`);
                    }
                } else {
                    console.log(`Konten HTML kosong untuk postingan: ${entry.title?.$t}`);
                }
            }
            console.log(`Pengambilan data estimasi selesai. Total item: ${estimasiGabungan.length}`);
        } catch (error) {
            console.error("Kesalahan saat mengambil data estimasi dari Blogger:", error);
        }
        return estimasiGabungan;
    }

    // Pastikan semua elemen modal ditemukan sebelum memasang event listener
    if (estimasiModal && closeEstimasiModalBtn && estimasiTableBody && estimasiModalContent && headerTableWrapper && bodyTableWrapper && downloadPdfBtn && openKirimEstimasiModalBtn && kirimEstimasiModal && closeKirimEstimasiModalBtn && estimasiForm) {
        console.log('Elemen modal ditemukan. Memasang event listener.');
        
        // Muat data saat halaman pertama kali dimuat
        loadEstimasiFromLocalStorage();
        renderEstimasiTable(); // Panggil ini untuk mengisi badge juga pada awalnya

        // Event listener untuk membuka modal estimasi utama saat tombol "Estimasi" diklik
        openEstimasiModalBtn.addEventListener('click', async function() {
            estimasiModal.classList.remove('hidden');
            document.body.classList.add('modal-open');

            // Hitung tinggi yang tersedia untuk body tabel yang dapat digulir
            // Ini harus dipanggil setelah modal ditampilkan
            const modalContentHeight = estimasiModalContent.offsetHeight;
            const modalTitleHeight = estimasiModalContent.querySelector('h3').offsetHeight;
            const buttonContainerHeight = estimasiModalContent.querySelector('.mt-4.flex.justify-end.gap-2').offsetHeight;
            const gap = 15; // Jarak antar elemen di estimasiModalContent

            // Hitung kembali headerTableHeight setelah modal terlihat dan dirender
            const headerTableHeight = headerTableWrapper.offsetHeight;
            const spaceTaken = modalTitleHeight + headerTableHeight + (3 * gap);

            const availableHeightForBodyTable = modalContentHeight - spaceTaken;
            bodyTableWrapper.style.maxHeight = `${availableHeightForBodyTable}px`;
            bodyTableWrapper.style.height = 'auto';

            // --- SINKRONISASI LEBAR KOLOM DINAMIS ---
            const headerCols = headerTableWrapper.querySelectorAll('col');
            const bodyCols = bodyTableWrapper.querySelectorAll('col');

            headerCols.forEach((col, i) => {
                const width = window.getComputedStyle(col).width;
                if (bodyCols[i]) {
                    bodyCols[i].style.width = width;
                    bodyCols[i].style.minWidth = width;
                    bodyCols[i].style.maxWidth = width;
                }
            });
            // --- AKHIR SINKRONISASI LEBAR KOLOM DINAMIS ---

            // Panggil fungsi untuk mengambil data estimasi dari Blogger
            try {
                const fetchedEstimasi = await ambilSemuaEstimasi();
                if (fetchedEstimasi.length > 0) {
                    const combinedEstimasi = [...estimasiItems];
                    fetchedEstimasi.forEach(fetchedItem => {
                        const existingIndex = combinedEstimasi.findIndex(item => item.kodePart === fetchedItem.kodePart);
                        if (existingIndex > -1) {
                            combinedEstimasi[existingIndex] = { ...combinedEstimasi[existingIndex], ...fetchedItem };
                        } else {
                            combinedEstimasi.push(fetchedItem);
                        }
                    });
                    estimasiItems = combinedEstimasi;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    console.log('Data estimasi berhasil digabungkan dan dirender ulang dari Blogger.');
                } else {
                    console.log('Tidak ada data estimasi baru dari Blogger. Menggunakan data lokal yang sudah ada.');
                    renderEstimasiTable();
                }
            } catch (error) {
                console.error("Gagal mengambil data estimasi dari Blogger:", error);
                renderEstimasiTable();
            }
        });

        // Event listener untuk menutup modal estimasi utama saat tombol tutup (X) diklik
        closeEstimasiModalBtn.addEventListener('click', function() {
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });

        // Event listener untuk menutup modal estimasi utama jika diklik di luar konten modal (di overlay)
        estimasiModal.addEventListener('click', function(e) {
            if (e.target === estimasiModal) {
                estimasiModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });

        // Event listener untuk tombol Download PDF yang baru
        downloadPdfBtn.addEventListener('click', generatePdf);

        // Event listener untuk membuka modal bersarang saat tombol "Kirim Estimasi" diklik
        openKirimEstimasiModalBtn.addEventListener('click', function() {
            if (estimasiItems.length === 0) {
                showMessageBox('Tidak ada item dalam estimasi untuk dikirim.');
                return;
            }
            kirimEstimasiModal.classList.remove('hidden');
        });

        // Event listener untuk menutup modal bersarang saat tombol tutup (X) diklik
        closeKirimEstimasiModalBtn.addEventListener('click', function() {
            kirimEstimasiModal.classList.add('hidden');
        });

        // Event listener untuk menutup modal bersarang jika diklik di luar konten modal (di overlay)
        kirimEstimasiModal.addEventListener('click', function(e) {
            if (e.target === kirimEstimasiModal) {
                kirimEstimasiModal.classList.add('hidden');
            }
        });

        // Event listener untuk pengiriman formulir di dalam modal bersarang
        estimasiForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Mencegah pengiriman formulir default
            const nama = document.getElementById('namaPengirim').value;
            const noHandphone = document.getElementById('noHandphone').value;
            const email = document.getElementById('emailPengirim').value;
            
            showMessageBox(`Estimasi berhasil dikirim oleh ${nama} (${email}, ${noHandphone})!`);
            console.log('Estimasi dikirim:', { items: estimasiItems, nama: nama, noHandphone: noHandphone, email: email });

            kirimEstimasiModal.classList.add('hidden');
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });
    } else {
        console.warn('PERINGATAN: Beberapa elemen modal hilang meskipun tombol pembuka ada. Periksa ID dan struktur HTML.');
    }
} else {
    console.log('INFO: Tombol modal estimasi tidak ditemukan. Fungsionalitas modal tidak akan diinisialisasi di halaman ini.');
}

// Ekspor fungsi yang mungkin perlu diakses secara global oleh skrip lain
window.updateEstimasiBadges = renderEstimasiTable;
window.addEstimasiItem = function(item) {
    addEstimasiItem(item, true); // Default ke penambahan
};
window.getEstimasiItems = function() {
    return [...estimasiItems];
};
window.clearEstimasi = function() {
    estimasiItems = [];
    saveEstimasiToLocalStorage();
    renderEstimasiTable();
};
window.showMessageBox = showMessageBox; // Ekspor showMessageBox agar dapat digunakan oleh skrip lain
