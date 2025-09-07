// File: src/search.js
// Deskripsi: Mengelola semua fungsionalitas pencarian.

import { getProperty } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/utils.js';
import { showSection } from './router.js';

let partMasterList = [];
let hotspotDataMap = {};
let katalogDataMap = {};

export function initializeSearchData(data) {
    partMasterList = data.partMasterList;

    data.hotspotDataList.forEach(item => {
        const kodepart = getProperty(item, ['kodepart', 'Kodepart'])?.toLowerCase();
        const modelKendaraan = getProperty(item, ['modelkendaraan', 'model_kendaraan', 'Model Kendaraan'])?.toLowerCase();
        const figure = getProperty(item, ['figure', 'Figure']);
        if (kodepart) {
            hotspotDataMap[kodepart] = {
                modelKendaraan: modelKendaraan || 'n/a',
                figure: figure || 'N/A'
            };
        }
    });

    data.katalogDataList.forEach(item => {
        const kodepart = getProperty(item, ['kodepart', 'Kodepart'])?.toLowerCase();
        const figureUrl = getProperty(item, ['urlgambar', 'Urlgambar', 'URLGambar']);
        if (kodepart && figureUrl) {
            katalogDataMap[kodepart] = figureUrl;
        }
    });
}

function performSearch(modelSearchTerm, searchTerm) {
    const targetResultsContainer = document.getElementById('searchOnlyContent');
    const noResultsMessageElement = document.getElementById('no-search-results-message');
    const loadingIndicatorElement = document.getElementById('search-loading-indicator');

    targetResultsContainer.innerHTML = '';
    noResultsMessageElement.classList.add('hidden');
    loadingIndicatorElement.classList.remove('hidden');

    if (!searchTerm && !modelSearchTerm) {
        loadingIndicatorElement.classList.add('hidden');
        noResultsMessageElement.textContent = 'Masukkan kata kunci pencarian di atas untuk memulai.';
        noResultsMessageElement.classList.remove('hidden');
        return;
    }

    if (modelSearchTerm && !searchTerm) {
        showSection('figure-gallery', { model: modelSearchTerm });
        window.location.hash = `#figure-gallery?model=${encodeURIComponent(modelSearchTerm)}`;
        loadingIndicatorElement.classList.add('hidden');
        return;
    }

    loadingIndicatorElement.classList.add('hidden');

    const filteredResults = partMasterList.filter(item => {
        const kodepart = getProperty(item, ['kodepart', 'Kodepart'])?.toLowerCase() || '';
        const deskripsi = getProperty(item, ['deskripsi', 'Deskripsi'])?.toLowerCase() || '';
        const harga = getProperty(item, ['harga', 'Harga'])?.toLowerCase() || '';

        let matchesSearchTerm = !searchTerm || kodepart.includes(searchTerm) || deskripsi.includes(searchTerm) || harga.includes(searchTerm);
        let matchesModelSearchTerm = !modelSearchTerm || (hotspotDataMap[kodepart] && hotspotDataMap[kodepart].modelKendaraan.includes(modelSearchTerm));
        
        return matchesSearchTerm && matchesModelSearchTerm;
    });

    if (filteredResults.length > 0) {
        const modelsInResults = new Set();
        filteredResults.forEach(item => {
            const displayKodepart = getProperty(item, ['kodepart', 'Kodepart']) || 'N/A';
            const displayDeskripsi = getProperty(item, ['deskripsi', 'Deskripsi']) || 'N/A';
            let displayHarga = getProperty(item, ['harga', 'Harga']);
            
            if (displayHarga && !isNaN(Number(displayHarga))) {
                displayHarga = Number(displayHarga).toLocaleString('id-ID');
            } else {
                displayHarga = 'N/A';
            }

            const resultDiv = document.createElement('div');
            resultDiv.className = 'bg-white p-6 rounded-lg shadow-md';
            resultDiv.innerHTML = `
                <p class="mb-1"><strong class="text-gray-900">Kodepart :</strong> <span class="text-blue-700">${displayKodepart}</span></p>
                <p class="text-gray-700"><strong class="text-gray-900">Deskripsi :</strong> <span class="text-blue-700">${displayDeskripsi}</span></p>
                <p class="text-gray-900 mb-2"><strong class="text-gray-900">Harga :</strong> <span class="text-blue-700">${displayHarga}</span></p>
            `;

            const kodepartForLookup = String(displayKodepart).toLowerCase();
            if (katalogDataMap[kodepartForLookup] && katalogDataMap[kodepartForLookup].trim() !== '' && katalogDataMap[kodepartForLookup] !== 'N/A') {
                const figureLink = katalogDataMap[kodepartForLookup];
                const figureName = hotspotDataMap[kodepartForLookup]?.figure || 'N/A';
                const modelForLink = hotspotDataMap[kodepartForLookup]?.modelKendaraan || modelSearchTerm;
                const linkElement = document.createElement('p');
                linkElement.className = 'text-gray-900';
                linkElement.innerHTML = `<strong class="text-gray-900">Link Figure (Katalog):</strong> <a href="#figure-viewer?url=${encodeURIComponent(figureLink)}&kodepart=${encodeURIComponent(displayKodepart)}&figureName=${encodeURIComponent(figureName)}&model=${encodeURIComponent(modelForLink)}" class="text-blue-700 hover:underline">Lihat Figure</a>`;
                resultDiv.appendChild(linkElement);
            }

            if (hotspotDataMap[kodepartForLookup]) {
                const hotspotData = hotspotDataMap[kodepartForLookup];
                if (hotspotData.modelKendaraan && hotspotData.modelKendaraan.trim() !== '' && hotspotData.modelKendaraan !== 'n/a') {
                    modelsInResults.add(hotspotData.modelKendaraan);
                }
            }
            targetResultsContainer.appendChild(resultDiv);
        });

        if (modelsInResults.size > 0) {
            modelsInResults.forEach(model => {
                const viewAllFiguresLink = document.createElement('div');
                viewAllFiguresLink.className = 'col-span-full text-center mt-4';
                viewAllFiguresLink.innerHTML = `<a href="#figure-gallery?model=${encodeURIComponent(model)}" class="inline-block bg-purple-600 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300">Lihat Semua Figure untuk ${model.toUpperCase()}</a>`;
                targetResultsContainer.appendChild(viewAllFiguresLink);
            });
        }
    } else {
        noResultsMessageElement.textContent = 'Tidak ada hasil ditemukan untuk pencarian Anda.';
        noResultsMessageElement.classList.remove('hidden');
    }
}

export function initSearch() {
    const searchButton = document.getElementById('search-button');
    const modelSelect = document.getElementById('model-search-select');
    const searchInput = document.getElementById('search-input');

    if (searchButton && modelSelect && searchInput) {
        const searchHandler = () => {
            const model = modelSelect.value.trim().toLowerCase();
            const term = searchInput.value.trim().toLowerCase();
            performSearch(model, term);
        };

        searchButton.addEventListener('click', searchHandler);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchHandler();
            }
        });
        modelSelect.addEventListener('change', searchHandler);
    }
}
