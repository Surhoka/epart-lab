// Fungsi untuk menggulir kontainer gambar
window.scrollGambar = function(offset) {
  const container = document.getElementById("gambar-wrapper");
  if (container) container.scrollBy({
    top: offset,
    behavior: "smooth"
  });
};

// Fungsi untuk mengonversi string ke Title Case
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
  const imgOffsetX = imgRect.left - scrollAreaRect.left;
  const imgOffsetY = imgRect.top - scrollAreaRect.top;

  const scale = img.clientWidth / img.naturalWidth;
  const hotspotMap = {};

  // Saring data hotspot untuk figure saat ini dan buat hotspot
  hotspotData.filter(i => i.figure?.trim().toUpperCase() === figure).forEach(item => { // Pastikan perbandingan figure tidak peka huruf besar/kecil
    const kode = item.kodepart?.trim();
    const x = parseFloat(item.x);
    const y = parseFloat(item.y);
    if (!kode || isNaN(x) || isNaN(y)) return;

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
    tooltip.textContent = toTitleCase(partMap[kode]?.deskripsi || "Info");

    hotspot.appendChild(dot);
    hotspot.appendChild(tooltip);
    scrollArea.appendChild(hotspot);
    hotspotRefs[kode] = hotspot;

    hotspot.addEventListener("click", e => {
      e.preventDefault();
      const row = rowRefs[kode];
      if (row) {
        row.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        row.classList.add("highlighted");
        setTimeout(() => row.classList.remove("highlighted"), 1500);
      }
    });
  });
  return hotspotMap;
};

// Fungsi utama untuk menginisialisasi halaman figure dengan ID tertentu
function initializeFigurePageWithId(figureId) {
  const container = document.getElementById("hotspot-container");
  // URL untuk data Google Sheets
  const engineURL = "https://opensheet.elk.sh/1ceai6m0DaFy6R09su_bToetXMFdaVx9fRcX2k3DVvgU/Engine";
  const hotspotURL = "https://opensheet.elk.sh/1ceai6m0DaFy6R09su_bToetXMFdaVx9fRcX2k3DVvgU/HotspotData";
  const partMasterURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster";
  const figure = figureId; // Gunakan figureId yang dilewatkan

  // Tampilkan indikator pemuatan
  container.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div> Memuat konten...
    </div>
  `;
  container.classList.remove('single-post-view'); // Pastikan tata letak default aktif

  // Ambil semua data secara bersamaan
  Promise.all([
      fetch(engineURL).then(res => res.json()),
      fetch(hotspotURL).then(res => res.json()),
      fetch(partMasterURL).then(res => res.json())
    ])
    .then(([imageData, hotspotData, partData]) => {
      // Temukan gambar spesifik untuk figure saat ini
      const currentFigureImage = imageData.find(imgItem => imgItem.figure?.trim().toUpperCase() === figure);
      const imageSrc = currentFigureImage?.urlgambar?.trim();
      if (!imageSrc) {
          container.textContent = `⚠️ Gambar untuk FIG ${figure} tidak ditemukan.`;
          return;
      }

      // Buat peta untuk pencarian data part cepat
      const partMap = {};
      partData.forEach(p => {
        const kode = p.kodepart?.trim();
        if (kode) partMap[kode] = {
          deskripsi: p.deskripsi?.trim() || "-",
          harga: parseInt(p.harga || "0", 10)
        };
      });

      // Hapus konten sebelumnya
      container.innerHTML = '';

      // Buat kontainer utama untuk gambar dan kontrol
      const containerBox = document.createElement("div");
      containerBox.style.position = "relative";
      containerBox.style.display = "inline-block";
      containerBox.className = "w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-4 mb-8";

      // Buat area yang dapat digulir untuk gambar
      const scrollArea = document.createElement("div");
      scrollArea.id = "gambar-wrapper";
      scrollArea.style.height = "60vh";
      scrollArea.style.overflowY = "auto";
      scrollArea.style.position = "relative";
      scrollArea.style.overflowX = "hidden";
      scrollArea.className = "rounded-lg overflow-hidden border border-gray-200";

      // Buat elemen gambar
      const img = new Image();
      img.dataset.src = imageSrc;
      img.style.width = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.classList.add('lazyload');

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

      const hotspotRefs = {};
      const rowRefs = {};
      let currentHotspotMap = {};

      // Intersection Observer untuk pemuatan malas (lazy loading)
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const lazyImage = entry.target;
              lazyImage.src = lazyImage.dataset.src;
              lazyImage.onload = () => {
                currentHotspotMap = createAndPlaceHotspots(lazyImage, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);

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

                hotspotData.filter(i => i.figure?.trim().toUpperCase() === figure).forEach((item, index) => {
                  const kode = item.kodepart?.trim();
                  if (!kode) return;

                  const part = partMap[kode] || {};
                  const fullDeskripsi = toTitleCase(part.deskripsi || "-");
                  const displayDeskripsi = fullDeskripsi.length > 50 ? fullDeskripsi.substring(0, 47) + "..." : fullDeskripsi;
                  const harga = part.harga || 0;

                  const row = document.createElement("tr");
                  row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${kode}</td>
                    <td title="${fullDeskripsi}">${displayDeskripsi}</td>
                    <td>Rp ${harga.toLocaleString("id-ID")}</td>
                    <td>
                      <input type="number" class="qty-input" value="1" min="1" data-kodepart="${kode}">
                      <i class="fas fa-shopping-cart cart-icon" data-kodepart="${kode}"></i>
                    </td>
                  `;
                  tbody.appendChild(row);
                  rowRefs[kode] = row;

                  row.style.cursor = "pointer";
                  row.addEventListener("click", (e) => {
                    if (!e.target.classList.contains('cart-icon') && !e.target.classList.contains('qty-input')) {
                      const pos = currentHotspotMap[kode];
                      const hotspot = hotspotRefs[kode];

                      if (pos) scrollArea.scrollTo({
                        top: pos.py - 100,
                        behavior: "smooth"
                      });

                      tbody.querySelectorAll("tr").forEach(tr => tr.classList.remove("highlighted"));
                      row.classList.add("highlighted");

                      if (hotspot) {
                        hotspot.classList.add("glow");
                        setTimeout(() => hotspot.classList.remove("glow"), 1000);
                      }
                    }
                  });

                  const cartIcon = row.querySelector('.cart-icon');
                  if (cartIcon) {
                    cartIcon.addEventListener('click', (e) => {
                      e.stopPropagation();
                      const partCode = e.target.dataset.kodepart;
                      const qtyInput = row.querySelector(`.qty-input[data-kodepart="${partCode}"]`);
                      const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;

                      const partDescription = partMap[partCode]?.deskripsi || "N/A";
                      const partPrice = partMap[partCode]?.harga || 0;

                      // Panggil fungsi global window.addEstimasiItem jika tersedia
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
              observer.unobserve(lazyImage);
            }
          });
        });
        observer.observe(img);
      } else {
        // Fallback untuk browser yang tidak mendukung Intersection Observer
        img.src = img.dataset.src;
        img.onload = () => {
          currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);

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

          hotspotData.filter(i => i.figure?.trim().toUpperCase() === figure).forEach((item, index) => {
            const kode = item.kodepart?.trim();
            if (!kode) return;

            const part = partMap[kode] || {};
            const fullDeskripsi = toTitleCase(part.deskripsi || "-");
            const displayDeskripsi = fullDeskripsi.length > 50 ? fullDeskripsi.substring(0, 47) + "..." : fullDeskripsi;
            const harga = part.harga || 0;

            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${index + 1}</td>
              <td>${kode}</td>
              <td title="${fullDeskripsi}">${displayDeskripsi}</td>
              <td>Rp ${harga.toLocaleString("id-ID")}</td>
              <td>
                <input type="number" class="qty-input" value="1" min="1" data-kodepart="${kode}">
                <i class="fas fa-shopping-cart cart-icon" data-kodepart="${kode}"></i>
              </td>
            `;
            tbody.appendChild(row);
            rowRefs[kode] = row;

            row.style.cursor = "pointer";
            row.addEventListener("click", (e) => {
              if (!e.target.classList.contains('cart-icon') && !e.target.classList.contains('qty-input')) {
                const pos = currentHotspotMap[kode];
                const hotspot = hotspotRefs[kode];

                if (pos) scrollArea.scrollTo({
                  top: pos.py - 100,
                  behavior: "smooth"
                });

                tbody.querySelectorAll("tr").forEach(tr => tr.classList.remove("highlighted"));
                row.classList.add("highlighted");

                if (hotspot) {
                  hotspot.classList.add("glow");
                  setTimeout(() => hotspot.classList.remove("glow"), 1000);
                }
              }
            });

            const cartIcon = row.querySelector('.cart-icon');
            if (cartIcon) {
              cartIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const partCode = e.target.dataset.kodepart;
                const qtyInput = row.querySelector(`.qty-input[data-kodepart="${partCode}"]`);
                const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;

                const partDescription = partMap[partCode]?.deskripsi || "N/A";
                const partPrice = partMap[partCode]?.harga || 0;

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

      let resizeTimeout;

      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            if (entry.target === img) {
              clearTimeout(resizeTimeout);
              resizeTimeout = setTimeout(() => {
                currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);
              }, 100);
            }
          }
        });
        resizeObserver.observe(img);
      } else {
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(() => {
            currentHotspotMap = createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, hotspotRefs, rowRefs, figure);
          }, 100);
        });
      }

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

    })
    .catch(err => {
      container.textContent = "⚠️ Gagal memuat data. Pastikan URL Google Sheet benar dan dapat diakses.";
      console.error(err);
    });
}

// Logika pemuatan awal:
// Jika halaman ini dimuat langsung (bukan melalui navigasi SPA),
// itu harus mengekstrak ID figure dari URL dan menginisialisasi dirinya sendiri.
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  let figureId = null;

  // Contoh: /p/fig102a.html -> fig102a
  const postMatch = path.match(/\/p\/([^\/]+)\.html$/);
  if (postMatch && postMatch[1]) {
      figureId = postMatch[1].toUpperCase();
  }
  // Contoh: /search/label/FIG.102A -> FIG.102A
  const labelMatch = path.match(/\/search\/label\/([^\/]+)$/);
  if (labelMatch && labelMatch[1]) {
      figureId = labelMatch[1].toUpperCase();
  }

  if (figureId) {
      console.log(`ID figure terdeteksi dari URL: ${figureId}. Menginisialisasi halaman untuk figure ini.`);
      initializeFigurePageWithId(figureId);
  } else {
      console.log("Tidak ada ID figure spesifik yang terdeteksi di URL. Mengasumsikan pemuatan awal halaman figure generik atau fallback.");
      // Fallback atau perilaku default jika tidak ada ID figure yang ditemukan di URL.
      // Untuk template ini, kami meng-hardcode FIG.102A sebagai default jika tidak ada ID yang ditemukan.
      initializeFigurePageWithId("FIG.102A");
  }
});
