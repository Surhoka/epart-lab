// Fungsi untuk memuat konten HTML secara dinamis, mengekstrak dan menjalankan skrip.
// Asumsi: Konten HTML target (misalnya, Address_Engine_FIG.102b.txt) adalah string HTML lengkap.
async function loadDynamicHtmlAndScripts(targetElementId, htmlContentUrl) {
    const container = document.getElementById(targetElementId);
    if (!container) {
        console.error(`Elemen dengan ID '${targetElementId}' tidak ditemukan.`);
        return;
    }

    try {
        // 1. Ambil konten HTML dari URL
        const response = await fetch(htmlContentUrl);
        if (!response.ok) {
            throw new Error(`Gagal memuat konten dari ${htmlContentUrl}: ${response.statusText}`);
        }
        const htmlText = await response.text();

        // 2. Buat elemen DOM sementara untuk mengurai HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        // 3. Ekstrak dan suntikkan gaya (CSS) dari konten yang dimuat
        doc.querySelectorAll('style').forEach(styleTag => {
            const newStyle = document.createElement('style');
            newStyle.textContent = styleTag.textContent;
            document.head.appendChild(newStyle);
        });

        // 4. Ekstrak dan sisipkan konten utama HTML ke container
        // Asumsi konten utama Address_Engine_FIG.102b.txt ada di dalam div#hotspot-container
        const mainContent = doc.getElementById('hotspot-container');
        if (mainContent) {
            container.innerHTML = mainContent.innerHTML; // Sisipkan hanya innerHTML dari div utama
        } else {
            // Fallback: Jika tidak ada ID hotspot-container, sisipkan seluruh body jika ada.
            container.innerHTML = doc.body.innerHTML;
        }

        // 5. Ekstrak dan jalankan skrip dari konten yang dimuat
        // Penting: Skrip harus dieksekusi setelah elemen DOM yang mereka target sudah ada di halaman.
        doc.querySelectorAll('script').forEach(scriptTag => {
            const newScript = document.createElement('script');
            // Salin atribut src jika ada (untuk skrip eksternal)
            if (scriptTag.src) {
                newScript.src = scriptTag.src;
                // Atur agar skrip dieksekusi setelah dimuat
                newScript.onload = () => console.log(`Skrip eksternal '${scriptTag.src}' berhasil dimuat dan dieksekusi.`);
                newScript.onerror = () => console.error(`Gagal memuat skrip eksternal '${scriptTag.src}'.`);
            } else {
                // Untuk skrip inline
                newScript.textContent = scriptTag.textContent;
            }
            // Tambahkan skrip ke DOM, ini akan memicu eksekusinya
            // Lebih baik ditambahkan ke body, terutama untuk skrip yang memanipulasi DOM
            document.body.appendChild(newScript);
        });

        console.log(`Konten dari ${htmlContentUrl} berhasil dimuat dan skripnya dijalankan.`);

    } catch (error) {
        console.error("Kesalahan saat memuat konten dinamis:", error);
        container.innerHTML = `<div style="color: red;">Gagal memuat konten: ${error.message}</div>`;
    }
}

// --- Cara Menggunakan Skrip Ini ---
// Misalnya, Anda ingin memuat Address_Engine_FIG.102b.txt
// ke dalam div dengan id="dynamicContentContainer" saat halaman dimuat atau tombol diklik.

// Contoh 1: Memuat saat halaman dimuat (jika ada event listener pada Template Epart Estimasi1a.txt)
// document.addEventListener('DOMContentLoaded', () => {
//     // Gantilah 'path/to/Address_Engine_FIG.102b.txt' dengan URL yang benar
//     // Asumsi Address_Engine_FIG.102b.txt dapat diakses secara publik (misal di GitHub Pages, Gist, atau server Anda)
//     loadDynamicHtmlAndScripts('dynamicContentContainer', 'URL_KE_ADDRESS_ENGINE_FIG_102b.txt');
// });

// Contoh 2: Memuat saat tombol diklik (Jika Anda punya tombol di Template Epart Estimasi1a.txt)
// const loadButton = document.getElementById('loadAddressEngineButton');
// loadButton?.addEventListener('click', () => {
//     loadDynamicHtmlAndScripts('dynamicContentContainer', 'URL_KE_ADDRESS_ENGINE_FIG_102b.txt');
// });

// Pastikan Anda memiliki elemen div ini di Template Epart Estimasi1a.txt Anda:
// <div id="dynamicContentContainer"></div>