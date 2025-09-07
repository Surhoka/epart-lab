// File: src/figure-viewer.js
// Deskripsi: Mengelola tampilan dan interaksi pada halaman penampil figur.

import { getProperty, getDirectGoogleDriveUrl } from './utils.js';

let partMasterList = [];
let hotspotDataList = [];
let katalogDataList = [];

export function initializeFigureViewerData(data) {
    partMasterList = data.partMasterList;
    hotspotDataList = data.hotspotDataList;
    katalogDataList = data.katalogDataList;
}

const FigureContent = `
<div id="hotspot-viewer-content-area" class="text-center font-inter">
  <div class="container-box w-full max-w-4xl mx-auto relative">
    <div class="relative mb-4">
      <div id="gambar-wrapper" class="rounded-lg overflow-hidden border border-gray-200" style="height: 60vh; overflow-y: auto; position: relative; overflow-x: hidden;">
        <img id="figure-image" style="width: 100%; height: auto; display: block; margin: 0 auto;" alt="Figure Image"/>
      </div>
      <div class="scroll-controls">
        <button id="scroll-up-btn">⬆️</button>
        <button id="scroll-down-btn">⬇️</button>
      </div>
    </div>
    <table id="figure-parts-table">
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
    </table>
  </div>
</div>
`;

function createAndPlaceHotspots(img, hotspotData, partMap, scrollArea, rowRefs, figureToDisplay) {
    Array.from(scrollArea.getElementsByClassName('hotspot')).forEach(hs => hs.remove());

    const imgOffsetX = img.offsetLeft;
    const imgOffsetY = img.offsetTop;
    const scale = img.clientWidth / img.naturalWidth;
    const hotspotMap = {};

    hotspotData
        .filter(i => getProperty(i, ['figure', 'Figure'])?.trim() === figureToDisplay)
        .forEach(item => {
            const kode = getProperty(item, ['kodepart', 'Kodepart'])?.trim();
            const koordinatStr = getProperty(item, ['koordinat', 'Koordinat'])?.trim();
            if (!kode || !koordinatStr) return;

            const koordinatList = koordinatStr.split(";").map(pair => {
                const [x, y] = pair.replace(/[\[\]]/g, '').split(",");
                return { x: parseFloat(x), y: parseFloat(y) };
            }).filter(coord => !isNaN(coord.x) && !isNaN(coord.y));

            koordinatList.forEach(({ x, y }, index) => {
                const px = (x * scale) + imgOffsetX;
                const py = (y * scale) + imgOffsetY;

                const hotspot = document.createElement("a");
                hotspot.className = "hotspot";
                hotspot.href = "#";
                hotspot.dataset.kodepart = kode;
                hotspot.style.left = px + "px";
                hotspot.style.top = py + "px";

                const dot = document.createElement("div");
                dot.className = "hotspot-dot";

                const tooltip = document.createElement("div");
                tooltip.className = "tooltip";
                tooltip.textContent = partMap[kode]?.deskripsi || "Info";

                hotspot.appendChild(dot);
                hotspot.appendChild(tooltip);
                scrollArea.appendChild(hotspot);

                if (index === 0) {
                    hotspotMap[kode] = { px, py };
                }

                hotspot.addEventListener("click", e => {
                    e.preventDefault();
                    const row = rowRefs[kode];
                    if (row) {
                        row.scrollIntoView({ behavior: "smooth", block: "center" });
                        document.querySelectorAll('#figure-parts-table tbody tr').forEach(tr => tr.classList.remove('highlighted'));
                        row.classList.add("highlighted");
                        setTimeout(() => row.classList.remove("highlighted"), 1500);
                    }
                });
            });
        });
    return hotspotMap;
};

function runHotspotViewer(figureName) {
    const container = document.getElementById("current-figure-display");
    if (!container) return;
    
    container.innerHTML = FigureContent;

    const scrollArea = container.querySelector("#gambar-wrapper");
    const img = container.querySelector("#figure-image");
    const tbody = container.querySelector("#figure-parts-table tbody");
    const scrollUpBtn = container.querySelector('#scroll-up-btn');
    const scrollDownBtn = container.querySelector('#scroll-down-btn');

    if (!scrollArea || !img || !tbody || !scrollUpBtn || !scrollDownBtn) return;

    const imageItem = katalogDataList.find(item => getProperty(item, ['figure', 'Figure'])?.trim() === figureName);
    let imageSrc = getProperty(imageItem, ['urlgambar', 'Urlgambar', 'URLGambar'])?.trim();

    if (!imageSrc) {
        container.innerHTML = "⚠️ Image for this figure not found in KatalogData.";
        return;
    }
    imageSrc = getDirectGoogleDriveUrl(imageSrc);

    const partMap = {};
    partMasterList.forEach(p => {
        const kode = getProperty(p, ['kodepart', 'Kodepart'])?.trim();
        if (kode) partMap[kode] = {
            deskripsi: getProperty(p, ['deskripsi', 'Deskripsi'])?.trim() || "-",
            harga: parseInt(getProperty(p, ['harga', 'Harga']) || "0", 10)
        };
    });

    img.src = imageSrc;

    scrollUpBtn.addEventListener('click', () => scrollArea.scrollBy({ top: -100, behavior: "smooth" }));
    scrollDownBtn.addEventListener('click', () => scrollArea.scrollBy({ top: 100, behavior: "smooth" }));

    const rowRefs = {};
    let currentHotspotMap = {};

    img.onload = () => {
        const relevantHotspotData = hotspotDataList.filter(i => getProperty(i, ['figure', 'Figure'])?.trim() === figureName);
        currentHotspotMap = createAndPlaceHotspots(img, relevantHotspotData, partMap, scrollArea, rowRefs, figureName);

        tbody.innerHTML = '';

        relevantHotspotData.forEach((item, index) => {
            const kode = getProperty(item, ['kodepart', 'Kodepart'])?.trim();
            if (!kode) return;

            const part = partMap[kode] || {};
            const fullDeskripsi = part.deskripsi || "-";
            const displayDeskripsi = fullDeskripsi.length > 50 ? fullDeskripsi.substring(0, 47) + "..." : fullDeskripsi;
            const harga = parseInt(part.harga || "0", 10);

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

            row.addEventListener("click", (e) => {
                if (e.target.classList.contains('cart-icon') || e.target.classList.contains('qty-input')) return;
                
                const pos = currentHotspotMap[kode];
                if (pos) scrollArea.scrollTo({ top: pos.py - (scrollArea.clientHeight / 2), behavior: "smooth" });
                
                document.querySelectorAll('#figure-parts-table tbody tr').forEach(tr => tr.classList.remove('highlighted'));
                row.classList.add("highlighted");

                document.querySelectorAll('.hotspot').forEach(hs => hs.classList.remove('glow'));
                const hotspotsToGlow = document.querySelectorAll(`.hotspot[data-kodepart="${kode}"]`);
                hotspotsToGlow.forEach(hotspot => {
                    hotspot.classList.add("glow");
                    setTimeout(() => hotspot.classList.remove("glow"), 1000);
                });
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

                    // Dispatch a custom event to add item to estimation
                    document.dispatchEvent(new CustomEvent('add-to-estimation', {
                        detail: {
                            kodePart: partCode,
                            deskripsi: partDescription,
                            qty: quantity,
                            harga: partPrice
                        }
                    }));
                });
            }
        });
    };
}

export function initFigureViewer(params) {
    const figureViewerContainer = document.getElementById('figure-viewer-container');
    const figureViewerTitle = document.getElementById('figure-viewer-title');

    if (!figureViewerContainer || !figureViewerTitle) return;

    const { url, kodepart, figureName, model } = params;

    if (!figureName) {
        figureViewerContainer.innerHTML = '<p class="text-center text-red-600">Nama figur tidak ditemukan.</p>';
        return;
    }

    figureViewerTitle.textContent = ` ${model.toUpperCase()} -  ${figureName || 'N/A'}`;
    
    figureViewerContainer.innerHTML = `
        <div id="current-figure-display" class="w-full text-center mb-4"></div>
    `;

    runHotspotViewer(figureName);
}
