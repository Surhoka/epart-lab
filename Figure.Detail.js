// Fungsi untuk menggulir kontainer gambar
function scrollGambar(offset) {
  const container = document.getElementById("gambar-wrapper");
  if (container) container.scrollBy({
    top: offset,
    behavior: "smooth"
  });
}

// Data estimasi akan disimpan di sini
let estimasiItems = [];

// Fungsi untuk memuat data dari localStorage
function loadEstimasiFromLocalStorage() {
  const storedData = localStorage.getItem('estimasiData');
  if (storedData) {
    try {
      estimasiItems = JSON.parse(storedData);
    } catch (e) {
      console.error("Error parsing estimasi data from localStorage:", e);
      estimasiItems = []; // Reset jika terjadi kesalahan parsing
    }
  }
}

// Fungsi untuk menyimpan data ke localStorage
function saveEstimasiToLocalStorage() {
  localStorage.setItem('estimasiData', JSON.stringify(estimasiItems));
}

// Fungsi untuk merender ulang tabel estimasi (placeholder untuk modal di template Median UI5a)
function renderEstimasiTable() {
  const estimasiTableBody = document.getElementById('estimasiTableBody');
  if (!estimasiTableBody) {
    console.warn("Element dengan ID 'estimasiTableBody' tidak ditemukan. Tidak dapat merender tabel estimasi.");
    return;
  }

  estimasiTableBody.innerHTML = ''; // Hapus konten tabel sebelumnya
  let totalBelanja = 0;

  if (estimasiItems.length === 0) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="7" class="py-2 px-4 border-b border-gray-200 text-sm text-center text-gray-500">Tidak ada item dalam estimasi.</td>`;
    estimasiTableBody.appendChild(noDataRow);
  } else {
    estimasiItems.forEach((item, index) => {
      const row = document.createElement('tr');
      const jumlah = item.qty * item.harga;
      totalBelanja += jumlah;

      row.innerHTML = `
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-center">${index + 1}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-center">${item.kodePart}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm">${item.deskripsi}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-center">${item.qty}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-right">Rp ${item.harga.toLocaleString('id-ID')}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-right">Rp ${jumlah.toLocaleString('id-ID')}</td>
        <td class="py-2 px-4 border-b border-gray-200 text-sm text-center">
            <button class="text-gray-500 hover:text-red-600 transition duration-200 delete-item-btn" title="Hapus" data-index="${index}">
                <i class="fas fa-trash-alt text-lg"></i>
            </button>
        </td>
      `;
      estimasiTableBody.appendChild(row);
    });
  }

  // Tambahkan baris total
  const totalRow = document.createElement('tr');
  totalRow.innerHTML = `
    <td colspan="5" class="py-2 px-4 border-b border-gray-200 text-right font-semibold">Total:</td>
    <td class="py-2 px-4 border-b border-gray-200 text-sm font-semibold text-right">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
    <td class="py-2 px-4 border-b border-gray-200 text-sm"></td>
  `;
  estimasiTableBody.appendChild(totalRow);

  // Tambahkan event listener untuk tombol hapus setelah tabel dirender
  estimasiTableBody.querySelectorAll('.delete-item-btn').forEach(button => {
    button.addEventListener('click', function() {
      const indexToDelete = parseInt(this.dataset.index);
      deleteEstimasiItem(indexToDelete);
    });
  });
}

// Fungsi untuk menghapus item dari estimasi
function deleteEstimasiItem(index) {
  if (index > -1 && index < estimasiItems.length) {
    estimasiItems.splice(index, 1); // Hapus item dari array
    saveEstimasiToLocalStorage(); // Simpan perubahan ke localStorage
    renderEstimasiTable(); // Render ulang tabel
  }
}


document.addEventListener("DOMContentLoaded", () => {
  loadEstimasiFromLocalStorage(); // Muat data saat DOM siap

  // ** START of new code integration (from previous turn, adjusted to use window.addEstimasiItem) **
  const dataScript = document.querySelector('.data-estimasi');
  if (dataScript) {
    try {
      const items = JSON.parse(dataScript.textContent);
      // Pastikan window.addEstimasiItem dan window.updateEstimasiBadges tersedia
      if (Array.isArray(items) && typeof window.addEstimasiItem === 'function' && typeof window.updateEstimasiBadges === 'function') {
        items.forEach(i => {
          // Panggil fungsi global yang diekspos oleh Template Median UI5a
          window.addEstimasiItem({kodePart: i.kodePart, deskripsi: i.deskripsi, qty: i.qty, harga: i.harga});
        });
        // Setelah semua item ditambahkan, panggil update badge
        window.updateEstimasiBadges();
      }
    } catch (err) {
      console.warn("Gagal parsing data estimasi dari .data-estimasi script:", err);
    }
  }
  // ** END of new code integration **


  const container = document.getElementById("hotspot-container");
  // URL untuk data Google Sheets
  const engineURL = "https://opensheet.elk.sh/1ceai6m0DaFy6R09su_bToetXMFdaVx9fRcX2k3DVvgU/Engine";
  const hotspotURL = "https://opensheet.elk.sh/1ceai6m0DaFy6R09su_bToetXMFdaVx9fRcX2k3DVvgU/HotspotData";
  const partMasterURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster";
  const figure = "FIG.102A"; // Gambar yang akan ditampilkan

  // Fungsi untuk mengubah string menjadi Title Case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  };

  // Fungsi untuk membuat dan menempatkan hotspot
  const createAndPlaceHotspots = (img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure) => {
    // Hapus hotspot yang ada sebelum membuat yang baru
    Array.from(scrollArea.getElementsByClassName('hotspot')).forEach(hs => hs.remove());

    // Dapatkan posisi gambar relatif terhadap viewport
    const imgRect = img.getBoundingClientRect();
    // Dapatkan posisi area gulir relatif terhadap viewport
    const scrollAreaRect = scrollArea.getBoundingClientRect();

    // Hitung offset gambar di dalam area gulir
    // Ini penting jika ada padding atau margin di scrollArea yang menggeser gambar
    const imgOffsetX = imgRect.left - scrollAreaRect.left;
    const imgOffsetY = imgRect.top - scrollAreaRect.top;

    const scale = img.clientWidth / img.naturalWidth;
    const hotspotMap = {};

    // Filter data hotspot untuk gambar saat ini dan buat hotspot
    hotspotData.filter(i => i.figure?.trim() === figure).forEach(item => {
      const kode = item.kodepart?.trim();
      const x = parseFloat(item.x);
      const y = parseFloat(item.y);
      if (!kode || isNaN(x) || isNaN(y)) return; // Lewati jika data tidak valid

      // Hitung posisi hotspot berdasarkan skala dan tambahkan offset gambar
      const px = (x * scale) + imgOffsetX;
      const py = (y * scale) + imgOffsetY;
      hotspotMap[kode] = {
        px,
        py
      };

      const hotspot = document.createElement("a");
      hotspot.className = "hotspot";
      hotspot.href = "#";
      hotspot.style.left = `${px}px`;
      hotspot.style.top = `${py}px`;

      const dot = document.createElement("div");
      dot.className = "hotspot-dot";

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      // Terapkan Title Case pada deskripsi di tooltip
      tooltip.textContent = toTitleCase(partMap[kode]?.deskripsi || "Info"); // Tampilkan deskripsi bagian di tooltip

      hotspot.appendChild(dot);
      hotspot.appendChild(tooltip);
      scrollArea.appendChild(hotspot);
      hotspotRefs[kode] = hotspot;

      // Klik hotspot -> gulir ke baris tabel
      hotspot.addEventListener("click", e => {
        e.preventDefault();
        const row = rowRefs[kode];
        if (row) {
          row.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
          row.classList.add("highlighted");
          setTimeout(() => row.classList.remove("highlighted"), 1500); // Hapus highlight setelah 1.5 detik
        }
      });
    });
    return hotspotMap;
  };

  // Ambil semua data secara bersamaan
  Promise.all([
      fetch(engineURL).then(res => res.json()),
      fetch(hotspotURL).then(res => res.json()),
      fetch(partMasterURL).then(res => res.json())
    ])
    .then(([imageDataRaw, hotspotData, partData]) => {
      // Pastikan imageData selalu menjadi array.
      // Layanan opensheet.elk.sh mungkin mengembalikan objek tunggal alih-alih array
      // jika hanya ada satu baris data di lembar.
      const imageData = Array.isArray(imageDataRaw) ? imageDataRaw : [imageDataRaw];

      const imageSrc = imageData[0]?.urlgambar?.trim();
      if (!imageSrc) throw new Error("Gambar tidak ditemukan");

      // Buat peta untuk pencarian data bagian cepat
      const partMap = {};
      partData.forEach(p => {
        const kode = p.kodepart?.trim();
        if (kode) partMap[kode] = {
          deskripsi: p.deskripsi?.trim() || "-",
          harga: parseInt(p.harga || "0", 10) // Parse harga sebagai integer
        };
      });

      // Buat kontainer utama untuk gambar dan kontrol
      const containerBox = document.createElement("div");
      containerBox.style.position = "relative";
      containerBox.style.display = "inline-block"; // Penting untuk membungkus gambar dengan benar
      containerBox.className = "w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-4 mb-8"; // Kelas Tailwind

      // Buat area yang dapat digulir untuk gambar
      const scrollArea = document.createElement("div");
      scrollArea.id = "gambar-wrapper";
      scrollArea.style.height = "60vh";
      scrollArea.style.overflowY = "auto";
      scrollArea.style.position = "relative";
      scrollArea.style.overflowX = "hidden";
      scrollArea.className = "rounded-lg overflow-hidden border border-gray-200"; // Kelas Tailwind

      // Buat elemen gambar
      const img = new Image();
      // Atur data-src untuk lazy loading daripada src
      img.dataset.src = imageSrc;
      img.style.width = "100%"; // Pastikan gambar mengisi lebar kontainer
      img.style.height = "auto"; // Pertahankan rasio aspek
      img.style.display = "block";
      img.classList.add('lazyload'); // Tambahkan kelas lazyload

      scrollArea.appendChild(img);
      containerBox.appendChild(scrollArea);

      // Buat kontrol gulir
      const controls = document.createElement("div");
      controls.className = "scroll-controls";
      controls.innerHTML = `
        <button onclick="scrollGambar(-100)">⬆️</button>
        <button onclick="scrollGambar(100)">⬇️</button>
      `;
      containerBox.appendChild(controls);
      container.appendChild(containerBox);

      const hotspotRefs = {}; // Simpan referensi ke elemen hotspot
      const rowRefs = {}; // Simpan referensi ke elemen baris tabel
      let currentHotspotMap = {}; // Untuk menyimpan hotspotMap terbaru

      // Intersection Observer untuk lazy loading
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.onload = () => {
                // Setelah gambar dimuat, buat hotspot dan tabel
                currentHotspotMap = createAndPlaceHotspots(lazyImage, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);

                // 🟢 Tabel Bagian - Buat tabel hanya sekali
                const table = document.createElement("table");
                table.innerHTML = `
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode Part</th>
                      <th>Deskripsi</th>
                      <th>Harga</th>
                      <th>Estimasi</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                `;
                const tbody = table.querySelector("tbody");

                // Isi baris tabel dengan data bagian
                hotspotData.filter(i => i.figure?.trim() === figure).forEach((item, index) => {
                  const kode = item.kodepart?.trim();
                  if (!kode) return;

                  const part = partMap[kode] || {};
                  // Terapkan Title Case di sini
                  const fullDeskripsi = toTitleCase(part.deskripsi || "-");
                  // Potong deskripsi untuk tampilan, simpan deskripsi lengkap di atribut title
                  const displayDeskripsi = fullDeskripsi.length > 50 ? fullDeskripsi.substring(0, 47) + "..." : fullDeskripsi;
                  const harga = part.harga || 0; // Gunakan harga integer yang di-parse

                  const row = document.createElement("tr");
                  row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${kode}</td>
                    <td title="${fullDeskripsi}">${displayDeskripsi}</td>
                    <td>Rp ${harga.toLocaleString("id-ID")}</td> <!-- Tampilkan harga dengan awalan 'Rp' -->
                    <td>
                      <input type="number" class="qty-input" value="1" min="1" data-kodepart="${kode}">
                      <i class="fas fa-shopping-cart cart-icon" data-kodepart="${kode}"></i>
                    </td>
                  `;
                  tbody.appendChild(row);
                  rowRefs[kode] = row; // Simpan referensi baris

                  row.style.cursor = "pointer";
                  row.addEventListener("click", (e) => {
                    // Hanya jika klik bukan pada ikon keranjang atau input kuantitas
                    if (!e.target.classList.contains('cart-icon') && !e.target.classList.contains('qty-input')) {
                      const pos = currentHotspotMap[kode]; // Gunakan hotspotMap terbaru
                      const hotspot = hotspotRefs[kode];

                      if (pos) scrollArea.scrollTo({
                        top: pos.py - 100,
                        behavior: "smooth"
                      }); // Gulir ke posisi hotspot

                      tbody.querySelectorAll("tr").forEach(tr => tr.classList.remove("highlighted"));
                      row.classList.add("highlighted");

                      if (hotspot) {
                        hotspot.classList.add("glow");
                        setTimeout(() => hotspot.classList.remove("glow"), 1000); // Hapus glow setelah 1 detik
                      }
                    }
                  });

                  // Tambahkan event listener untuk ikon keranjang
                  const cartIcon = row.querySelector('.cart-icon');
                  if (cartIcon) {
                    cartIcon.addEventListener('click', (e) => {
                      e.stopPropagation(); // Cegah event klik baris agar tidak terpicu
                      const partCode = e.target.dataset.kodepart;
                      const qtyInput = row.querySelector(`.qty-input[data-kodepart="${partCode}"]`);
                      const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1; // Dapatkan nilai kuantitas

                      const partDescription = partMap[partCode]?.deskripsi || "N/A";
                      const partPrice = partMap[partCode]?.harga || 0;

                      // ** Panggil fungsi global window.addEstimasiItem dari Template Median UI5a.txt **
                      if (typeof window.addEstimasiItem === 'function') {
                          window.addEstimasiItem({
                              kodePart: partCode,
                              deskripsi: partDescription,
                              qty: quantity,
                              harga: partPrice
                          });
                          console.log(`Menambahkan part dengan kode: ${partCode}, deskripsi: ${partDescription}, quantity: ${quantity}, harga: ${partPrice} ke keranjang.`);
                      } else {
                          console.warn("window.addEstimasiItem tidak ditemukan. Badge mungkin tidak diperbarui.");
                      }
                    });
                  }
                });

                container.appendChild(table);
              };
              observer.unobserve(lazyImage); // Berhenti mengamati setelah dimuat
            }
          });
        });
        observer.observe(img); // Mulai mengamati gambar
      } else {
        // Fallback untuk browser yang tidak mendukung Intersection Observer
        img.src = img.dataset.src;
        img.onload = () => {
          currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);

          // 🟢 Tabel Bagian - Buat tabel hanya sekali
          const table = document.createElement("table");
          table.innerHTML = `
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Part</th>
                <th>Deskripsi</th>
                <th>Harga</th>
                <th>Estimasi</th>
              </tr>
            </thead>
            <tbody></tbody>
          `;
          const tbody = table.querySelector("tbody");

          // Isi baris tabel dengan data bagian
          hotspotData.filter(i => i.figure?.trim() === figure).forEach((item, index) => {
            const kode = item.kodepart?.trim();
            if (!kode) return;

            const part = partMap[kode] || {};
            // Terapkan Title Case di sini
            const fullDeskripsi = toTitleCase(part.deskripsi || "-");
            // Potong deskripsi untuk tampilan, simpan deskripsi lengkap di atribut title
            const displayDeskripsi = fullDeskripsi.length > 50 ? fullDeskripsi.substring(0, 47) + "..." : fullDeskripsi;
            const harga = part.harga || 0; // Gunakan harga integer yang di-parse

            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${index + 1}</td>
              <td>${kode}</td>
              <td title="${fullDeskripsi}">${displayDeskripsi}</td>
              <td>Rp ${harga.toLocaleString("id-ID")}</td> <!-- Tampilkan harga dengan awalan 'Rp' -->
              <td>
                <input type="number" class="qty-input" value="1" min="1" data-kodepart="${kode}">
                <i class="fas fa-shopping-cart cart-icon" data-kodepart="${kode}"></i>
              </td>
            `;
            tbody.appendChild(row);
            rowRefs[kode] = row; // Simpan referensi baris

            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
              // Hanya jika klik bukan pada ikon keranjang atau input kuantitas
              if (!e.target.classList.contains('cart-icon') && !e.target.classList.contains('qty-input')) {
                const pos = currentHotspotMap[kode]; // Gunakan hotspotMap terbaru
                const hotspot = hotspotRefs[kode];

                if (pos) scrollArea.scrollTo({
                  top: pos.py - 100,
                  behavior: "smooth"
                }); // Gulir ke posisi hotspot

                tbody.querySelectorAll("tr").forEach(tr => tr.classList.remove("highlighted"));
                row.classList.add("highlighted");

                if (hotspot) {
                  hotspot.classList.add("glow");
                  setTimeout(() => hotspot.classList.remove("glow"), 1000); // Hapus glow setelah 1 detik
                }
              }
            });

            // Tambahkan event listener untuk ikon keranjang
            const cartIcon = row.querySelector('.cart-icon');
            if (cartIcon) {
              cartIcon.addEventListener('click', (e) => {
                e.stopPropagation(); // Cegah event klik baris agar tidak terpicu
                const partCode = e.target.dataset.kodepart;
                const qtyInput = row.querySelector(`.qty-input[data-kodepart="${partCode}"]`);
                const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1; // Dapatkan nilai kuantitas

                const partDescription = partMap[partCode]?.deskripsi || "N/A";
                const partPrice = partMap[partCode]?.harga || 0;

                // ** Panggil fungsi global window.addEstimasiItem **
                if (typeof window.addEstimasiItem === 'function') {
                    window.addEstimasiItem({
                        kodePart: partCode,
                        deskripsi: partDescription,
                        qty: quantity,
                        harga: partPrice
                    });
                    console.log(`Menambahkan part dengan kode: ${partCode}, deskripsi: ${partDescription}, quantity: ${quantity}, harga: ${partPrice} ke keranjang.`);
                } else {
                    console.warn("window.addEstimasiItem tidak ditemukan. Badge mungkin tidak diperbarui.");
                }
              });
            }
          });

          container.appendChild(table);
        };
      }

      // Variabel untuk menahan timeout debounce
      let resizeTimeout;

      // Tambahkan ResizeObserver untuk memperbarui hotspot saat gambar diubah ukurannya
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            if (entry.target === img) {
              // Hapus timeout yang ada untuk mencegah beberapa panggilan
              clearTimeout(resizeTimeout);
              // Setel timeout baru
              resizeTimeout = setTimeout(() => {
                // Gambar telah diubah ukurannya, perbarui posisi hotspot
                currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);
              }, 100); // Debounce 100ms
            }
          }
        });
        resizeObserver.observe(img);
      } else {
        // Fallback untuk browser lama: tambahkan event listener resize window
        // Terapkan debounce ke resize window juga
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);
          }, 100); // Debounce 100ms
        });
      }

      // --- START: Kode baru untuk membuat div tersembunyi dengan kode bagian ---
      const kodeList = partData
        .filter(row => row.fig_id?.trim().toUpperCase() === figure)
        .map(row => row.kodepart?.trim())
        .filter(Boolean);

      if (kodeList.length > 0) {
        const hiddenDiv = document.createElement("div");
        hiddenDiv.style.display = "none";
        hiddenDiv.className = "kode-indeks-auto";
        hiddenDiv.textContent = "Kode Part: " + kodeList.join(", ");
        document.body.appendChild(hiddenDiv);
        console.log("Div tersembunyi 'kode-indeks-auto' dibuat dengan konten:", hiddenDiv.textContent);
      }
      // --- END: Kode baru ---

    })
    .catch(err => {
      container.textContent = "⚠️ Gagal memuat data. Pastikan URL Google Sheet benar dan dapat diakses.";
      console.error(err);
    });
});
