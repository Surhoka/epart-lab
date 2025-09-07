// File: src/utils.js
// Deskripsi: Kumpulan fungsi utilitas yang dapat digunakan kembali.

/**
 * Menampilkan pesan toast notifikasi.
 * @param {string} message - Pesan yang akan ditampilkan.
 */
export function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

/**
 * Memformat tanggal ke format yang lebih mudah dibaca.
 * @param {string} dateString - String tanggal dalam format ISO.
 * @returns {string} Tanggal yang sudah diformat.
 */
export function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

/**
 * Membersihkan string HTML dari tag dan entitas.
 * @param {string} htmlString - String yang mengandung HTML.
 * @returns {string} Teks bersih tanpa HTML.
 */
export function stripHtml(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, 'text/html');
    return doc.body.textContent || "";
}
