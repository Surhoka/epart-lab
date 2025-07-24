document.addEventListener('DOMContentLoaded', function() {
  // Fungsi utilitas untuk menambahkan kelas CSS dengan aman
  function safeAddClass(element, ...classNames) {
      if (element && element.classList) {
          element.classList.add(...classNames);
      }
  }

  // Elemen toast kustom
  const customToast = document.getElementById('customToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout; // Variabel untuk menyimpan ID timeout

  // Fungsi untuk menampilkan toast kustom
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
              // Setelah transisi, atur display ke none untuk menghapusnya dari layout
              setTimeout(() => {
                  customToast.style.display = 'none';
              }, 400); // Sesuaikan dengan durasi transisi CSS
          }, 3000); // 3 detik
      }
  }

  // Inisialisasi window.postMap secara global
  window.postMap = {}; 
  
  // Memuat mapping postMap dari localStorage jika tersedia
  try {
      const cached = localStorage.getItem('cachedPostMap');
      if (cached) {
          window.postMap = JSON.parse(cached);
          console.log("✅ postMap dimuat dari localStorage:", window.postMap);
      }
  } catch (e) {
      console.error("❌ Kesalahan saat memuat postMap dari localStorage:", e);
      window.postMap = {};
  }

  // Fungsi untuk mengisi postMap
  function populatePostMap() {
      return new Promise(resolve => { // Mengembalikan Promise
          const postMappingContainer = document.getElementById('postMappingHidden'); 
          console.log("Memulai fungsi populatePostMap...");
          if (postMappingContainer) {
              // Log innerHTML untuk melihat apakah Blogger merender tautan
              console.log("Konten #postMappingHidden:", postMappingContainer.innerHTML);

              const links = postMappingContainer.querySelectorAll('a');
              console.log(`Ditemukan ${links.length} <a> tag di #postMappingHidden.`);

              links.forEach(link => {
                  const title = link?.textContent?.trim();
                  const url = link?.href;
                  if (title && url) {
                      // Sanitasi judul untuk membuat kunci: huruf kecil, trim, hapus semua spasi
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Gunakan window.postMap
                      // DEBUGGING BARU: Log setiap item yang ditambahkan ke postMap
                      console.log(`✅ Post Terpetakan: Judul Asli dari Blogger: "${title}" -> Kunci Sanitasi: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Melewati tautan karena judul atau URL hilang: TextContent="${link?.textContent}", Href="${link?.href}"`);
                  }
              });
              console.log("Konten window.postMap akhir setelah mengisi dari Blogger:");
              console.table(window.postMap); // Log seluruh peta sebagai tabel
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Simpan ke localStorage
              console.log("✅ postMap disimpan ke localStorage.");
              resolve(); // Selesaikan promise setelah diisi
          } else {
              console.warn("❌ Kontainer #postMappingHidden tidak ditemukan. Widget ini seharusnya ada di halaman indeks.");
              // Fallback: Jika tidak di halaman indeks atau widget PostMappingHidden tidak ada,
              // coba dapatkan URL postingan dari artikel .post yang sedang dirender
              const posts = document.querySelectorAll('.post');
              console.log(`Ditemukan ${posts.length} artikel .post (fallback).`);
              posts.forEach(post => {
                  const titleElement = post.querySelector('h1 a'); 
                  const title = titleElement?.textContent?.trim();
                  const url = titleElement?.href;
                  if (title && url) {
                      // Sanitasi judul untuk membuat kunci: huruf kecil, trim, hapus semua spasi
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Gunakan window.postMap
                      // DEBUGGING BARU: Log setiap item yang ditambahkan ke postMap
                      console.log(`✅ Post Terpetakan (Fallback): Judul Asli dari Blogger: "${title}" -> Kunci Sanitasi: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Melewati postingan fallback karena judul atau URL hilang: TitleElementText="${titleElement?.textContent}", Href="${titleElement?.href}"`);
                  }
              });
              console.log("Konten window.postMap akhir setelah mengisi dari elemen .post yang terlihat (fallback):");
              console.table(window.postMap); // Log seluruh peta sebagai tabel
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Simpan ke localStorage
              console.log("✅ postMap (fallback) disimpan ke localStorage.");
              resolve(); // Selesaikan promise setelah diisi
          }
      });
  }

  // Panggil populatePostMap saat DOM siap, lalu lanjutkan dengan inisialisasi lainnya
  // Menambahkan sedikit delay untuk memastikan semua widget Blogger telah dirender
  setTimeout(() => {
      populatePostMap().then(() => {
          // Fungsi resolusi otomatis URL postingan fig
          function resolveFigLink(item) {
            // Mengubah slug agar menghilangkan semua spasi, bukan menggantinya dengan tanda hubung
            const slug = item.judul_artikel?.toLowerCase().trim().replace(/\s+/g, '');
            if (window.postMap?.[slug]) return window.postMap[slug];
            
            // Fallback default struktur: menghilangkan '/p/' dan menggunakan slug tanpa spasi/tanda hubung
            const currentYear = new Date().getFullYear();
            const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0'); // Dapatkan bulan saat ini (01-12)
            return `/${currentYear}/${currentMonth}/${slug}.html`; 
          }

          // Fungsi untuk mengubah teks menjadi Title Case
          function titleCase(text) {
              if (!text) return '';
              return text.toLowerCase().split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');
          }

          // Render hasil pencarian fig
          function renderFigResult(item) {
            const link = resolveFigLink(item);
            const deskripsi = titleCase(item.deskripsi?.trim() || ''); // Terapkan titleCase di sini
            let html = `
              <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
                <h3 class="font-semibold text-blue-700">
                  <a href="${link}" class="hover:underline spa-link"> <!-- Menambahkan kelas spa-link -->
                    ${item.judul_artikel || 'Judul tidak tersedia'}
                  </a>
                </h3>
                <p><strong>Kode Part:</strong><span class="bg-gray-100 px-2 py-0.5 rounded font-mono">${item.kodepart || 'N/A'}</span></p>`;
            
            // Tambahkan deskripsi hanya jika tidak kosong
            if (deskripsi) {
                html += `<p><strong>Deskripsi:</strong> ${deskripsi}</p>`;
            }

            html += `</div>`;
            return html;
          }

          // Fungsi utama pencarian fig dari sidebar (Dinamai ulang)
          window.jalankanPencarianFigSidebar = function (query) {
            const hasilContainer = document.getElementById("searchOnlyContent");
            if (!hasilContainer) {
              console.warn("❌ Kontainer #searchOnlyContent tidak ditemukan.");
              return;
            }

            hasilContainer.classList.remove("hidden");

            if (!query) {
              hasilContainer.innerHTML = `<p class="text-gray-600 text-center">Masukkan kata kunci pada kolom pencarian untuk mencari kode part.</p>`;
              return;
            }

            hasilContainer.innerHTML = `
              <div class="text-sm text-gray-600 text-center mb-3">⏳ Mencari <strong>${query}</strong>...</div>`;

            // ID Spreadsheet
            const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 

            fetch(sheetURL)
              .then(res => {
                if (!res.ok) {
                  if (res.status === 400) {
                    throw new Error(`Gagal ambil Sheet: ${res.status}. Pastikan Google Sheet Anda diatur untuk "Anyone with the link can view" dan ID Spreadsheet serta nama Sheet sudah benar.`);
                  } else {
                    throw new Error(`Gagal ambil Sheet: ${res.status}`);
                  }
                }
                return res.json();
              })
              .then(data => {
                const hasil = data.filter(row => {
                  const q = query.toUpperCase();
                  const kp = row.kodepart?.toUpperCase() || "";
                  const ja = row.judul_artikel?.toUpperCase() || "";
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
                // Lampirkan kembali listener SPA setelah konten baru dirender
                attachSpaLinkListeners();
              })
              .catch(err => {
                console.error("⚠️ Fetch gagal:", err);
                hasilContainer.innerHTML = `
                  <div class="bg-red-100 border border-400 text-red-700 px-3 py-2 rounded">
                    ⚠️ Gagal memuat data Sheet. (${err.message})
                  </div>`;
              });
          };

          // Pasang listener form pencarian di sidebar (Disesuaikan)
          const sidebarForm = document.getElementById('sidebarSearchForm');
          const sidebarInput = document.getElementById('sidebarSearchInput');
          sidebarForm?.addEventListener('submit', function (e) {
            e.preventDefault();
            const query = sidebarInput?.value?.trim()?.toUpperCase();
            if (query) window.jalankanPencarianFigSidebar(query);
          });

          // --- Fungsionalitas SPA ---
          const mainContentSection = document.getElementById('main-content-section');
          const spaLoadingIndicator = document.getElementById('spa-loading-indicator');

          /**
           * Menampilkan indikator loading.
           */
          function showLoading() {
              if (spaLoadingIndicator) {
                  spaLoadingIndicator.classList.add('show');
                  spaLoadingIndicator.classList.remove('complete');
              }
          }

          /**
           * Menyembunyikan indikator loading.
           */
          function hideLoading() {
              if (spaLoadingIndicator) {
                  spaLoadingIndicator.classList.add('complete');
                  setTimeout(() => {
                      spaLoadingIndicator.classList.remove('show', 'complete');
                  }, 200); // Sesuaikan dengan transisi CSS
              }
          }

          /**
           * Memuat konten halaman melalui AJAX untuk navigasi SPA.
           * @param {string} url - URL yang akan dimuat.
           * @param {boolean} pushState - Apakah akan mendorong status ke riwayat browser.
           */
          async function loadPageContent(url, pushState = true) {
              if (!mainContentSection) {
                  console.error('Bagian konten utama tidak ditemukan untuk SPA.');
                  return;
              }

              showLoading();

              try {
                  const response = await fetch(url);
                  if (!response.ok) {
                      throw new Error(`Kesalahan HTTP! status: ${response.status}`);
                  }
                  const html = await response.text();

                  // Parse HTML yang diambil
                  const parser = new DOMParser();
                  const doc = parser.parseFromString(html, 'text/html');

                  // Ekstrak konten utama baru
                  const newMainContent = doc.getElementById('main-content-section');
                  if (newMainContent) {
                      // Ganti konten utama saat ini
                      mainContentSection.innerHTML = newMainContent.innerHTML;

                      // Perbarui judul halaman
                      const newTitle = doc.querySelector('title')?.textContent || document.title;
                      document.title = newTitle;

                      // Perbarui URL di riwayat browser
                      if (pushState) {
                          history.pushState({ path: url }, newTitle, url);
                      }

                      // Gulir ke atas
                      window.scrollTo(0, 0);

                      // Lampirkan kembali event listener untuk konten yang baru dimuat
                      // Ini penting untuk elemen interaktif di dalam area konten utama
                      attachSpaLinkListeners(); // Lampirkan kembali untuk tautan baru
                      // Inisialisasi ulang skrip spesifik untuk konten utama jika diperlukan
                      // Misalnya, jika ada skrip spesifik untuk konten widget Blog1,
                      // Anda memerlukan cara untuk menjalankannya kembali di sini. Untuk saat ini, asumsikan skrip utama bersifat global.

                      // Inisialisasi ulang dropdown kategori kendaraan karena kontennya mungkin berubah
                      populateVehicleCategoryDropdown();

                      // Jalankan kembali populasi peta postingan awal jika postingan baru dimuat
                      // Ini penting agar fungsionalitas pencarian dapat menyelesaikan tautan dengan benar
                      populatePostMap();

                      console.log(`SPA: Konten dimuat untuk ${url}`);
                  } else {
                      console.error(`SPA: Tidak dapat menemukan #main-content-section di konten yang diambil dari ${url}`);
                  }
              } catch (error) {
                  console.error('SPA: Gagal memuat konten halaman:', error);
                  showMessageBox(`Gagal memuat halaman: ${error.message}.`);
                  // Secara opsional kembalikan URL atau tampilkan halaman kesalahan
              } finally {
                  hideLoading();
              }
          }

          /**
           * Melampirkan listener klik ke semua tautan internal untuk navigasi SPA.
           * Fungsi ini harus dipanggil pada awalnya dan setelah konten baru dimuat.
           */
          function attachSpaLinkListeners() {
              document.querySelectorAll('a').forEach(link => {
                  // Hapus listener yang ada untuk mencegah duplikasi
                  link.removeEventListener('click', handleSpaLinkClick);
                  
                  // Hanya lampirkan listener jika itu tautan internal dan bukan tautan khusus
                  const href = link.getAttribute('href');
                  if (href && 
                      !href.startsWith('#') && // Tautan jangkar
                      !href.startsWith('mailto:') && // Tautan email
                      !href.startsWith('tel:') && // Tautan telepon
                      !link.target && // Tidak membuka di tab baru
                      !link.classList.contains('no-spa') && // Secara eksplisit memilih keluar
                      link.hostname === window.location.hostname // Domain yang sama
                  ) {
                      link.addEventListener('click', handleSpaLinkClick);
                  }
              });
          }

          /**
           * Event handler untuk klik tautan SPA.
           * @param {Event} e - Event klik.
           */
          function handleSpaLinkClick(e) {
              const link = e.currentTarget;
              const href = link.getAttribute('href');

              // Mencegah navigasi default
              e.preventDefault();

              // Muat konten menggunakan logika SPA
              loadPageContent(href);
          }

          // Lampiran awal listener tautan SPA
          attachSpaLinkListeners();

          // Tangani tombol kembali/maju browser
          window.addEventListener('popstate', (e) => {
              loadPageContent(window.location.href, false); // Jangan dorong status lagi
          });
      });
  }, 100); // Penundaan 100ms
});
