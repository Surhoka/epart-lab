/**
 * Fungsi untuk menghasilkan PDF dari data estimasi.
 * Memuat jsPDF secara dinamis jika belum dimuat.
 */
window.generatePdf = function() {
    // Memuat jsPDF secara dinamis jika belum dimuat
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.AcroForm === 'undefined') {
        console.log('PDF-scripts: jsPDF belum dimuat, memuat sekarang...');
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
            script2.onload = () => {
                console.log('PDF-scripts: jsPDF dan AutoTable berhasil dimuat. Melanjutkan generate PDF.');
                _generatePdfContent(); // Panggil fungsi internal setelah dimuat
            };
            document.head.appendChild(script2);
        };
        document.head.appendChild(script1);
    } else {
        console.log('PDF-scripts: jsPDF sudah dimuat. Melanjutkan generate PDF.');
        _generatePdfContent();
    }
};

/**
 * Fungsi internal untuk menghasilkan konten PDF.
 * Membutuhkan data estimasi dari window.getEstimasiItems().
 */
function _generatePdfContent() {
    // Pastikan window.getEstimasiItems tersedia dari table-scripts.js
    if (typeof window.getEstimasiItems !== 'function') {
        console.error("PDF-scripts: window.getEstimasiItems tidak ditemukan. Tidak dapat membuat PDF.");
        if (typeof window.showMessageBox === 'function') {
            window.showMessageBox('Gagal membuat PDF: Data estimasi tidak tersedia.');
        }
        return;
    }

    const estimasiItems = window.getEstimasiItems();

    if (estimasiItems.length === 0) {
        if (typeof window.showMessageBox === 'function') {
            window.showMessageBox('Tidak ada item dalam estimasi untuk membuat PDF.');
        }
        return;
    }

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
    if (typeof window.showMessageBox === 'function') {
        window.showMessageBox('Daftar estimasi Anda telah diunduh sebagai PDF!');
    }
}

/**
 * Fungsi inisialisasi untuk modul PDF.
 * Tidak ada inisialisasi DOM langsung di sini karena fungsi generatePdf dipanggil
 * secara eksplisit oleh modul lain (modal-scripts.js).
 */
window.initPdf = function() {
    console.log("PDF-scripts: Modul PDF diinisialisasi (fungsi generatePdf tersedia).");
};