// File: src/estimation.js
// Deskripsi: Mengelola modal estimasi dan fungsionalitas terkait.

import { getProperty, getDirectGoogleDriveUrl } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/utils.js';

let estimasiItems = JSON.parse(localStorage.getItem('estimasiItems')) || [];
let partMasterList = [];

export function initializeEstimationData(data) {
    partMasterList = data.partMasterList;
}

function saveEstimasiItems() {
    localStorage.setItem('estimasiItems', JSON.stringify(estimasiItems));
}

function updateEstimasiBadges() {
    let totalQty = 0;
    let totalAmount = 0;

    estimasiItems.forEach(item => {
        totalQty += item.qty;
        totalAmount += (item.qty * item.harga);
    });

    const qtyBadge = document.getElementById('estimasi-qty-badge');
    const totalBadge = document.getElementById('estimasi-total-badge');

    if (qtyBadge) {
        if (totalQty > 0) {
            qtyBadge.textContent = totalQty;
            qtyBadge.classList.remove('hidden');
        } else {
            qtyBadge.classList.add('hidden');
        }
    }

    if (totalBadge) {
        if (totalAmount > 0) {
            totalBadge.textContent = `Rp ${totalAmount.toLocaleString('id-ID')}`;
            totalBadge.classList.remove('hidden');
        } else {
            totalBadge.classList.add('hidden');
        }
    }
}

function addEstimasiItem(item) {
    const existingItemIndex = estimasiItems.findIndex(e => e.kodePart === item.kodePart);
    if (existingItemIndex > -1) {
        estimasiItems[existingItemIndex].qty += item.qty;
    } else {
        estimasiItems.push(item);
    }
    saveEstimasiItems();
    renderEstimasiModal();
    updateEstimasiBadges();
    showToast(`Part '${item.kodePart}' ditambahkan.`);
}

function removeEstimasiItem(kodePart) {
    estimasiItems = estimasiItems.filter(item => item.kodePart !== kodePart);
    saveEstimasiItems();
    renderEstimasiModal();
    updateEstimasiBadges();
}

function updateEstimasiItemQuantity(kodePart, change) {
    const itemIndex = estimasiItems.findIndex(item => item.kodePart === kodePart);
    if (itemIndex > -1) {
        const currentQty = estimasiItems[itemIndex].qty;
        let newQty;
        if (typeof change === 'number') {
            newQty = currentQty + change;
        } else {
            newQty = parseInt(change, 10);
            if (isNaN(newQty)) newQty = 1;
        }

        if (newQty >= 1) {
            estimasiItems[itemIndex].qty = newQty;
        } else if (newQty === 0) {
            removeEstimasiItem(kodePart);
            return;
        }
        saveEstimasiItems();
        renderEstimasiModal();
        updateEstimasiBadges();
    }
}

function renderEstimasiModal() {
    const estimasiTableBody = document.getElementById('estimasiTableBody');
    const totalEstimasiSpan = document.getElementById('totalEstimasi');
    const noEstimasiItemsMessage = document.getElementById('noEstimasiItemsMessage');

    if (!estimasiTableBody || !totalEstimasiSpan || !noEstimasiItemsMessage) return;

    estimasiTableBody.innerHTML = '';
    let total = 0;

    if (estimasiItems.length === 0) {
        noEstimasiItemsMessage.classList.remove('hidden');
        estimasiTableBody.parentElement.classList.add('hidden');
    } else {
        noEstimasiItemsMessage.classList.add('hidden');
        estimasiTableBody.parentElement.classList.remove('hidden');

        estimasiItems.forEach((item, index) => {
            const itemTotal = item.qty * item.harga;
            total += itemTotal;

            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-2 px-4 text-left">${index + 1}</td>
                <td class="py-2 px-4 text-left">${item.kodePart}</td>
                <td class="py-2 px-4 text-left">${item.deskripsi}</td>
                <td class="py-2 px-4 text-center">
                    <div class="flex items-center justify-center space-x-1">
                        <button class="qty-btn" data-action="decrease" data-kodepart="${item.kodePart}">-</button>
                        <input type="number" class="estimasi-qty-input" value="${item.qty}" min="1" data-kodepart="${item.kodePart}">
                        <button class="qty-btn" data-action="increase" data-kodepart="${item.kodePart}">+</button>
                    </div>
                </td>
                <td class="py-2 px-4 text-right">Rp ${item.harga.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-right">Rp ${itemTotal.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-center">
                    <button class="remove-item-btn p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors" data-kodepart="${item.kodePart}">
                        <i class="fas fa-trash-alt text-xs"></i>
                    </button>
                </td>
            `;
            estimasiTableBody.appendChild(row);
        });
    }

    totalEstimasiSpan.textContent = `Rp ${total.toLocaleString('id-ID')}`;

    estimasiTableBody.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => removeEstimasiItem(e.currentTarget.dataset.kodepart));
    });

    estimasiTableBody.querySelectorAll('.qty-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const change = e.currentTarget.dataset.action === 'increase' ? 1 : -1;
            updateEstimasiItemQuantity(e.currentTarget.dataset.kodepart, change);
        });
    });

    estimasiTableBody.querySelectorAll('.estimasi-qty-input').forEach(input => {
        input.addEventListener('change', (e) => updateEstimasiItemQuantity(e.target.dataset.kodepart, e.target.value));
    });
}

function generatePdf() {
    if (estimasiItems.length === 0) {
        showToast('Tidak ada item dalam estimasi.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Estimasi Sparepart", 14, 22);

    const tableColumn = ["No", "Kode Part", "Deskripsi", "Qty", "Harga", "Jumlah"];
    const tableRows = [];
    let total = 0;

    estimasiItems.forEach((item, index) => {
        const itemTotal = item.qty * item.harga;
        total += itemTotal;
        tableRows.push([
            index + 1,
            item.kodePart,
            item.deskripsi,
            item.qty,
            `Rp ${item.harga.toLocaleString('id-ID')}`,
            `Rp ${itemTotal.toLocaleString('id-ID')}`
        ]);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
    });

    const finalY = doc.autoTable.previous.finalY;
    doc.setFontSize(12);
    doc.text(`Total Estimasi: Rp ${total.toLocaleString('id-ID')}`, 14, finalY + 10);

    doc.output('dataurlnewwindow');
}

function addPartByCode() {
    const addPartCodeInput = document.getElementById('addPartCodeInput');
    const addPartQtyInput = document.getElementById('addPartQtyInput');
    
    const partCode = addPartCodeInput.value.trim().toUpperCase();
    const quantity = parseInt(addPartQtyInput.value, 10);

    if (!partCode || isNaN(quantity) || quantity < 1) {
        showToast('Kode part atau kuantitas tidak valid.');
        return;
    }

    const partData = partMasterList.find(p => getProperty(p, ['kodepart', 'Kodepart'])?.toUpperCase() === partCode);

    if (partData) {
        addEstimasiItem({
            kodePart: partCode,
            deskripsi: getProperty(partData, ['deskripsi', 'Deskripsi']) || 'N/A',
            qty: quantity,
            harga: parseInt(getProperty(partData, ['harga', 'Harga']) || '0', 10)
        });
        addPartCodeInput.value = '';
        addPartQtyInput.value = '1';
    } else {
        showToast(`Kode part '${partCode}' tidak ditemukan.`);
    }
}

export function initEstimation() {
    const estimasiModalButton = document.getElementById('estimasi-modal-button');
    const estimasiModal = document.getElementById('estimasiModal');
    const closeEstimasiModalButton = document.getElementById('closeEstimasiModal');
    const previewPdfButton = document.getElementById('previewPdfButton');
    const addPartByCodeButton = document.getElementById('addPartByCodeButton');

    if (estimasiModalButton) {
        estimasiModalButton.addEventListener('click', () => {
            estimasiModal.classList.remove('hidden');
            renderEstimasiModal();
        });
    }

    if (closeEstimasiModalButton) {
        closeEstimasiModalButton.addEventListener('click', () => {
            estimasiModal.classList.add('hidden');
        });
    }

    if (previewPdfButton) {
        previewPdfButton.addEventListener('click', generatePdf);
    }

    if (addPartByCodeButton) {
        addPartByCodeButton.addEventListener('click', addPartByCode);
    }

    // Listen for custom event to add items from other modules
    document.addEventListener('add-to-estimation', (e) => {
        addEstimasiItem(e.detail);
    });

    updateEstimasiBadges(); // Initial call
}

function showToast(message) {
    const toast = document.getElementById('myToast');
    const toastMessage = document.getElementById('toastMessage');
    if (!toast || !toastMessage) return;
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
