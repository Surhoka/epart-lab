// Elemen untuk notifikasi toast kustom
const customToast = document.getElementById('customToast');
const toastMessage = document.getElementById('toastMessage');
let toastTimeout; // Variabel untuk menyimpan ID timeout toast

/**
 * Menampilkan notifikasi toast kustom.
 * @param {string} message - Pesan yang akan ditampilkan di toast.
 */
window.showMessageBox = function(message) { // Membuat fungsi ini dapat diakses secara global
    if (customToast && toastMessage) {
        // Hapus timeout yang ada untuk mencegah tumpang tindih toast
        clearTimeout(toastTimeout);

        toastMessage.textContent = message;
        customToast.style.display = 'block'; // Jadikan terlihat
        customToast.classList.add('show'); // Tambahkan kelas 'show' untuk transisi masuk

        // Sembunyikan toast secara otomatis setelah 3 detik
        toastTimeout = setTimeout(() => {
            customToast.classList.remove('show'); // Hapus kelas 'show' untuk transisi keluar
            // Setelah transisi, atur display ke none untuk menghapusnya dari layout
            setTimeout(() => {
                customToast.style.display = 'none';
            }, 400); // Sesuaikan dengan durasi transisi CSS
        }, 3000); // 3 detik
    } else {
        console.warn("Elemen toast tidak ditemukan. Tidak dapat menampilkan kotak pesan.");
    }
};
