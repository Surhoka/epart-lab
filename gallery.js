// File: src/gallery.js
// Deskripsi: Mengelola fungsionalitas galeri figur.

import { getDirectGoogleDriveUrl } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/utils.js';

let hotspotDataMap = {};
let katalogDataList = [];
let modelKendaraanList = [];

export function initializeGalleryData(data) {
    katalogDataList = data.katalogDataList;
    modelKendaraanList = data.modelKendaraanList;
    
    hotspotDataMap = {};
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
}

function renderGallery(selectedModel, selectedCategory) {
    const figureGalleryContainer = document.getElementById('figure-gallery-container');
    const noFiguresMessage = document.getElementById('no-figures-message');
    const galleryTitle = document.getElementById('gallery-title');

    figureGalleryContainer.innerHTML = '';
    noFiguresMessage.classList.add('hidden');

    if (!selectedModel) {
        galleryTitle.textContent = 'Pilih Model Kendaraan untuk Melihat Figur';
        noFiguresMessage.textContent = 'Silakan pilih model kendaraan dari hasil pencarian untuk melihat galeri figur.';
        noFiguresMessage.classList.remove('hidden');
        return;
    }

    galleryTitle.textContent = `Model: ${selectedModel.toUpperCase()}`;

    const uniqueFigureNamesForModel = new Set();
    for (const kodepart in hotspotDataMap) {
        const hotspotItem = hotspotDataMap[kodepart];
        if (hotspotItem.modelKendaraan === selectedModel && hotspotItem.figure && hotspotItem.figure !== 'N/A') {
            uniqueFigureNamesForModel.add(hotspotItem.figure);
        }
    }

    let figuresToDisplay = [];
    uniqueFigureNamesForModel.forEach(figureName => {
        const katalogItem = katalogDataList.find(item => 
            getProperty(item, ['figure', 'Figure'])?.trim() === figureName
        );

        if (katalogItem) {
            const figureUrl = getProperty(katalogItem, ['urlgambar', 'Urlgambar', 'URLGambar']);
            const kodepart = getProperty(katalogItem, ['kodepart', 'Kodepart']) || '';
            const description = getProperty(katalogItem, ['deskripsi', 'Deskripsi']) || '';
            const category = getProperty(katalogItem, ['kategori', 'Kategori']) || '';

            if (figureUrl) {
                figuresToDisplay.push({
                    url: figureUrl,
                    kodepart: kodepart,
                    figureName: figureName,
                    description: description,
                    category: category.trim().toLowerCase()
                });
            }
        }
    });

    if (selectedCategory && selectedCategory !== 'all') {
        figuresToDisplay = figuresToDisplay.filter(fig => fig.category === selectedCategory);
    }

    if (figuresToDisplay.length > 0) {
        figuresToDisplay.sort((a, b) => a.figureName.localeCompare(b.figureName));

        figuresToDisplay.forEach((fig, index) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-xl card-slide-up';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const link = document.createElement('a');
            link.href = `#figure-viewer?url=${encodeURIComponent(fig.url)}&kodepart=${encodeURIComponent(fig.kodepart)}&figureName=${encodeURIComponent(fig.figureName)}&model=${encodeURIComponent(selectedModel)}`;
            link.className = 'block w-full h-full';

            const img = document.createElement('img');
            img.src = getDirectGoogleDriveUrl(fig.url);
            img.alt = fig.figureName || 'Miniatur Figur';
            img.className = 'w-full h-48 object-cover';
            img.onerror = () => {
                img.src = 'https://i.ibb.co/gS15Pz9/404-notfound.png'; // Fallback image
            };

            const contentDiv = document.createElement('div');
            contentDiv.className = 'p-4 bg-blue-600 text-white text-left';
            
            const titleElement = document.createElement('h3');
            titleElement.className = 'font-semibold text-lg';
            titleElement.textContent = fig.figureName;

            const descriptionElement = document.createElement('p');
            descriptionElement.className = 'text-xs opacity-90';
            descriptionElement.textContent = fig.description;

            contentDiv.appendChild(titleElement);
            contentDiv.appendChild(descriptionElement);

            link.appendChild(img);
            link.appendChild(contentDiv);
            card.appendChild(link);
            figureGalleryContainer.appendChild(card);
        });
    } else {
        noFiguresMessage.textContent = `Tidak ada figur yang ditemukan untuk model dan kategori ini.`;
        noFiguresMessage.classList.remove('hidden');
    }
}

export function initGallery(params) {
    const modelGallerySelect = document.getElementById('model-gallery-select');
    const categoryFilter = document.getElementById('category-filter');

    const update = () => {
        const model = modelGallerySelect.value.trim().toLowerCase();
        const category = categoryFilter.value;
        renderGallery(model, category);
    };

    if (modelGallerySelect) {
        modelGallerySelect.addEventListener('change', update);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', update);
    }

    // Initial render
    if (params.model) {
        modelGallerySelect.value = params.model;
    }
    renderGallery(modelGallerySelect.value, categoryFilter.value);
}

export function populateModelDropdown() {
    const selects = [
        document.getElementById('model-search-select'),
        document.getElementById('model-gallery-select')
    ].filter(Boolean);

    const uniqueModels = new Set();
    for (const kodepart in hotspotDataMap) {
        const model = hotspotDataMap[kodepart].modelKendaraan;
        if (model && model !== 'n/a') {
            uniqueModels.add(model);
        }
    }
    const sortedModels = Array.from(uniqueModels).sort();

    selects.forEach(selectElement => {
        while (selectElement.options.length > 1) {
            selectElement.remove(1);
        }
        sortedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model.toUpperCase();
            selectElement.appendChild(option);
        });
    });
}

export function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

    const uniqueCategories = new Set();
    modelKendaraanList.forEach(item => {
        const category = getProperty(item, ['kategori', 'Kategori']);
        if (category && category.trim() !== '') {
            uniqueCategories.add(category.trim());
        }
    });

    const sortedCategories = Array.from(uniqueCategories).sort();

    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}
