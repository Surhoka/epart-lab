// Hanya lanjutkan dengan inisialisasi modal jika tombol ada di halaman
const openEstimasiModalBtn = document.getElementById('openEstimasiModal');

if (openEstimasiModalBtn) {
    const estimasiModal = document.getElementById('estimasiModal');
    const closeEstimasiModalBtn = document.getElementById('closeEstimasiModal');
    const estimasiTableBody = document.getElementById('estimasiTableBody');
    const estimasiModalContent = document.getElementById('estimasiModalContent');
    const headerTableWrapper = document.querySelector('.header-table-wrapper');
    const bodyTableWrapper = document.querySelector('.body-table-wrapper');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Elemen modal bersarang
    const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
    const kirimEstimasiModal = document.getElementById('kirimEstimasiModal'); // Baris ini telah diperbaiki
    const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
    const estimasiForm = document.getElementById('estimasiForm');

    /**
     * Fungsi inisialisasi untuk modul modal.
     */
    window.initModal = function() {
        // Event listener untuk membuka modal estimasi utama
        openEstimasiModalBtn.addEventListener('click', async function() {
            estimasiModal.classList.remove('hidden');
            document.body.classList.add('modal-open');

            // Hitung tinggi yang tersedia untuk body tabel yang dapat di-scroll
            const modalContentHeight = estimasiModalContent.offsetHeight;
            const modalTitleHeight = estimasiModalContent.querySelector('h3').offsetHeight;
            const buttonContainerHeight = estimasiModalContent.querySelector('.mt-4.flex.justify-end.gap-2').offsetHeight;
            const gap = 15;

            const headerTableHeight = headerTableWrapper.offsetHeight;

            const spaceTaken = modalTitleHeight + headerTableHeight + buttonContainerHeight + (3 * gap);

            const availableHeightForBodyTable = modalContentHeight - spaceTaken;
            bodyTableWrapper.style.maxHeight = `${availableHeightForBodyTable}px`;
            bodyTableWrapper.style.height = 'auto';

            // Sinkronisasi lebar kolom
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

            // Panggil fungsi untuk mengambil data estimasi dari Blogger
            try {
                // Pastikan window.ambilSemuaEstimasi tersedia dari table-scripts.js
                if (typeof window.ambilSemuaEstimasi === 'function') {
                    const fetchedEstimasi = await window.ambilSemuaEstimasi();
                    if (fetchedEstimasi.length > 0) {
                        // Pastikan window.getEstimasiItems dan window.addEstimasiItem tersedia dari table-scripts.js
                        if (typeof window.getEstimasiItems === 'function' && typeof window.addEstimasiItem === 'function') {
                            let currentEstimasiItems = window.getEstimasiItems();
                            fetchedEstimasi.forEach(fetchedItem => {
                                const existingIndex = currentEstimasiItems.findIndex(item => item.kodePart === fetchedItem.kodePart);
                                if (existingIndex > -1) {
                                    // Perbarui item yang ada
                                    currentEstimasiItems[existingIndex] = { ...currentEstimasiItems[existingIndex], ...fetchedItem };
                                } else {
                                    // Tambahkan item baru
                                    currentEstimasiItems.push(fetchedItem);
                                }
                            });
                            // Perbarui data di table-scripts.js melalui fungsi global
                            window.clearEstimasi(); // Kosongkan dulu
                            currentEstimasiItems.forEach(item => window.addEstimasiItem(item, true)); // Tambahkan kembali
                            console.log('Data estimasi berhasil digabungkan dan dirender ulang dari Blogger.');
                        } else {
                            console.error("Fungsi getEstimasiItems atau addEstimasiItem tidak ditemukan di window.");
                            if (typeof window.renderEstimasiTable === 'function') {
                                window.renderEstimasiTable();
                            }
                        }
                    } else {
                        console.log('Tidak ada data estimasi baru dari Blogger. Menggunakan data lokal yang sudah ada.');
                        if (typeof window.renderEstimasiTable === 'function') {
                            window.renderEstimasiTable();
                        }
                    }
                } else {
                    console.error("Fungsi ambilSemuaEstimasi tidak ditemukan di window. Pastikan table-scripts.js dimuat.");
                    if (typeof window.renderEstimasiTable === 'function') {
                        window.renderEstimasiTable();
                    }
                }
            } catch (error) {
                console.error("Gagal mengambil data estimasi dari Blogger:", error);
                if (typeof window.renderEstimasiTable === 'function') {
                    window.renderEstimasiTable();
                }
            }
        });

        // Event listener untuk menutup modal estimasi utama
        closeEstimasiModalBtn.addEventListener('click', function() {
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });

        // Event listener untuk menutup modal estimasi utama jika diklik di luar konten modal (pada overlay)
        estimasiModal.addEventListener('click', function(e) {
            if (e.target === estimasiModal) {
                estimasiModal.classList.add('hidden');
                document.body.classList.remove('modal-open');
            }
        });

        // Event listener untuk tombol Download PDF
        downloadPdfBtn.addEventListener('click', function() {
            // Memanggil fungsi generatePdf dari PDF-scripts.js
            if (typeof window.generatePdf === 'function') {
                window.generatePdf();
            } else {
                console.error("Fungsi generatePdf tidak ditemukan di window. Pastikan PDF-scripts.js dimuat.");
                if (typeof window.showMessageBox === 'function') {
                    window.showMessageBox('Fungsi PDF tidak tersedia. Coba muat ulang halaman.');
                }
            }
        });

        // Event listener untuk membuka modal bersarang "Kirim Estimasi"
        openKirimEstimasiModalBtn.addEventListener('click', function() {
            if (typeof window.getEstimasiItems === 'function') {
                if (window.getEstimasiItems().length === 0) {
                    if (typeof window.showMessageBox === 'function') {
                        window.showMessageBox('Tidak ada item dalam estimasi untuk dikirim.');
                    }
                    return;
                }
            }
            kirimEstimasiModal.classList.remove('hidden');
        });

        // Event listener untuk menutup modal bersarang
        closeKirimEstimasiModalBtn.addEventListener('click', function() {
            kirimEstimasiModal.classList.add('hidden');
        });

        // Event listener untuk menutup modal bersarang jika diklik di luar konten modal (pada overlay)
        kirimEstimasiModal.addEventListener('click', function(e) {
            if (e.target === kirimEstimasiModal) {
                kirimEstimasiModal.classList.add('hidden');
            }
        });

        // Event listener untuk pengiriman formulir di dalam modal bersarang
        estimasiForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nama = document.getElementById('namaPengirim').value;
            const noHandphone = document.getElementById('noHandphone').value;
            const email = document.getElementById('emailPengirim').value;

            if (typeof window.showMessageBox === 'function' && typeof window.getEstimasiItems === 'function') {
                window.showMessageBox(`Estimasi berhasil dikirim oleh ${nama} (${email}, ${noHandphone})!`);
                console.log('Estimasi dikirim:', { items: window.getEstimasiItems(), nama: nama, noHandphone: noHandphone, email: email });
            }

            kirimEstimasiModal.classList.add('hidden');
            estimasiModal.classList.add('hidden');
            document.body.classList.remove('modal-open');
        });
    }; // Akhir dari initModal
} else {
    console.log('INFO: Tombol modal estimasi tidak ditemukan. Fungsionalitas modal tidak akan diinisialisasi di halaman ini.');
}
