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

/**
 * Mengonversi berbagai format URL Google Drive menjadi tautan gambar langsung.
 * @param {string} urlOrId - URL atau ID file Google Drive.
 * @returns {string} URL gambar langsung atau string kosong jika tidak valid.
 */
export function getDirectGoogleDriveUrl(urlOrId) {
    if (typeof urlOrId !== 'string' || !urlOrId || urlOrId.trim().toLowerCase() === 'n/a') {
        return ''; // Return empty for invalid input
    }

    // Check if it's already a usable direct image link
    if (urlOrId.match(/\.(jpeg|jpg|gif|png|webp)$/i) || urlOrId.includes('googleusercontent.com')) {
        return urlOrId;
    }

    let fileId = null;

    // Regex to find Google Drive ID from various URL patterns
    const patterns = [
        /drive\.google\.com\/file\/d\/([\w-]+)/,    // /file/d/ID
        /id=([\w-]+)/,                           // uc?id=ID or export=view&id=ID
        /\/d\/([\w-]+)/                           // /d/ID/view
    ];

    for (const pattern of patterns) {
        const match = urlOrId.match(pattern);
        if (match && match[1]) {
            fileId = match[1];
            break;
        }
    }

    // If no ID was found in a URL, check if the string itself is an ID
    if (!fileId && /^[\w-]{28,}$/.test(urlOrId.trim())) {
        fileId = urlOrId.trim();
    }

    if (fileId) {
        // Use the robust lh3.googleusercontent.com domain for direct embedding
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // If no ID can be extracted, return the original URL and log a warning
    console.warn('Tidak dapat mengekstrak ID file Google Drive. Mengembalikan URL asli:', urlOrId);
    return urlOrId;
}
