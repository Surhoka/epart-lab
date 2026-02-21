/**
 * Print Service for Ezyparts
 * Handles dynamic HTML generation and printing for various report types.
 */
window.PrintService = {
    /**
     * Print a document based on data and options
     * @param {Object} data - The data to print
     * @param {Object} options - Configuration for the print layout
     */
    print(data, options = {}) {
        const content = this.generateHTML(data, options);
        // Gunakan nama window tetap ('EzyPrintWindow') agar tab direuse dan tidak menumpuk
        const printWindow = window.open('', 'EzyPrintWindow');
        printWindow.document.write(content);
        printWindow.document.close();
        if (printWindow) printWindow.focus(); // Pastikan window fokus ke depan

        // Wait for resources to load then print
        setTimeout(() => {
            printWindow.print();
            // printWindow.close(); // Keep window open for manual control
        }, 500);
    },

    /**
     * Factory method untuk mencetak dokumen standar bisnis
     * Mengurangi duplikasi kode di halaman-halaman lain
     */
    printDocument(type, data) {
        let config = {};
        let printData = {};

        // Ambil konfigurasi dinamis dari LocalStorage (Profile)
        const appConfig = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
        const brandingConfig = JSON.parse(localStorage.getItem('publicBrandingData') || '{}');
        const dynamicCompanyName = brandingConfig.companyName || appConfig.dbName || 'Ezyparts Inventory';
        const dynamicSubtitle = brandingConfig.address || 'Sparepart Management System';

        // Helper formatters internal
        const fmtMoney = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
        const fmtDate = (val) => val ? new Date(val).toLocaleDateString('id-ID') : '';
        const toTitle = (str) => (str || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

        switch (type) {
            case 'purchase-order':
                const poItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
                printData = {
                    companyName: dynamicCompanyName,
                    companySubtitle: dynamicSubtitle,
                    documentTitle: 'PURCHASE ORDER',
                    documentId: data.ponumber,
                    leftSection: [
                        { label: 'Supplier', value: data.supplier || '', style: 'font-size: 1.1em; font-weight: bold;', subValue: data.supplieremail || '' }
                    ],
                    rightSection: [
                        { label: 'Order Date', value: fmtDate(data.date) },
                        { label: 'Expected Date', value: fmtDate(data.expecteddate), marginTop: true },
                        { label: 'Status', value: (data.status || '').toUpperCase(), style: 'text-transform: uppercase;', marginTop: true }
                    ],
                    items: poItems.map(item => ({
                        ...item,
                        name: toTitle(item.name),
                        formattedPrice: fmtMoney(item.unitprice),
                        total: fmtMoney((item.quantity || 0) * (item.unitprice || 0))
                    })),
                    totals: { 'Grand Total': fmtMoney(data.total) },
                    notes: data.notes,
                    signatures: [{ label: 'Authorized By' }, { label: 'Created By', name: data.createdby }]
                };
                config = {
                    template: 'formal',
                    title: `Purchase Order - ${data.ponumber}`,
                    columns: [
                        { header: 'Part Number', field: 'partnumber', style: 'font-weight: 600;', width: '25%' },
                        { header: 'Part Name', field: 'name', width: '30%' },
                        { header: 'Qty', field: 'quantity', align: 'text-center', width: '10%' },
                        { header: 'Unit Price', field: 'formattedPrice', align: 'text-right', width: '17.5%' },
                        { header: 'Total', field: 'total', align: 'text-right', width: '17.5%' }
                    ]
                };
                break;

            case 'receiving':
                const rcItems = typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []);
                printData = {
                    companyName: dynamicCompanyName,
                    companySubtitle: dynamicSubtitle,
                    documentTitle: 'RECEIVING',
                    documentId: data.receivingNumber || data.receivingnumber,
                    leftSection: [{ label: 'Supplier', value: data.supplier }],
                    rightSection: [
                        { label: 'Receiving Date', value: fmtDate(data.date) },
                        { label: 'PO Number', value: data.poNumber || data.ponumber, marginTop: true }
                    ],
                    items: rcItems.map(item => ({
                        ...item,
                        name: toTitle(item.name),
                        formattedPrice: fmtMoney(item.unitprice),
                        total: fmtMoney((Number(item.receivingnow || 0)) * (Number(item.unitprice || 0)))
                    })),
                    totals: {
                        'Subtotal': fmtMoney(data.subtotal),
                        'Discount': '-' + fmtMoney((Number(data.subtotal || 0)) - (Number(data.total || 0))),
                        'Grand Total': fmtMoney(data.total)
                    },
                    notes: data.notes,
                    signatures: [
                        { label: 'Authorized By' },
                        { label: 'Received By', name: data.receivedBy || data.receivedby }
                    ]
                };
                config = {
                    template: 'formal',
                    title: `Receiving - ${data.receivingNumber || data.receivingnumber}`,
                    columns: [
                        { header: 'Part Number', field: 'partnumber', style: 'font-weight: 600;', width: '25%' },
                        { header: 'Item Name', field: 'name', width: '30%' },
                        { header: 'Qty', field: 'receivingnow', align: 'text-center', width: '10%' },
                        { header: 'Unit Price', field: 'formattedPrice', align: 'text-right', width: '17.5%' },
                        { header: 'Total', field: 'total', align: 'text-right', width: '17.5%' }
                    ]
                };
                break;

            default:
                console.warn('Unknown document type:', type);
                return;
        }

        this.print(printData, config);
    },

    /**
     * Generate HTML for the print document
     */
    generateHTML(data, options) {
        const defaults = {
            title: 'Receipt',
            paperSize: '58mm', // 58mm or A4
            fontFamily: "'Courier New', monospace",
            fontSize: '12px'
        };

        const config = { ...defaults, ...options };

        if (config.template === 'formal') {
            return this.renderFormalTemplate(data, config);
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${config.title}</title>
                <style>
                    body { 
                        font-family: ${config.fontFamily}; 
                        font-size: ${config.fontSize}; 
                        margin: 0; 
                        padding: 10px; 
                        color: #000;
                    }
                    .receipt { 
                        max-width: ${config.paperSize === '58mm' ? '280px' : '100%'}; 
                        margin: 0 auto; 
                        background: white;
                    }
                    
                    @media screen {
                        body { background: #525659; }
                        .receipt { 
                            padding: 10px; 
                            box-shadow: 0 0 10px rgba(0,0,0,0.5);
                        }
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 1px dashed #000; 
                        padding-bottom: 10px; 
                        margin-bottom: 10px; 
                    }
                    .header h2 { margin: 0 0 5px 0; font-size: 1.2em; }
                    .header p { margin: 2px 0; }
                    
                    .items { margin-bottom: 10px; }
                    .item-row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 5px; 
                    }
                    .item-name { 
                        font-weight: bold; 
                        display: block; 
                        width: 100%; 
                        margin-bottom: 2px; 
                        ${config.paperSize === '58mm' ? 'font-size: 0.95em;' : 'width: auto; margin-bottom: 0;'}
                    }
                    .item-details { display: flex; justify-content: space-between; width: 100%; }
                    
                    /* Table style for A4 */
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
                    th { border-bottom: 2px solid #000; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }

                    .totals { 
                        border-top: 1px dashed #000; 
                        padding-top: 10px; 
                        margin-top: 10px; 
                    }
                    .total-row { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 3px; 
                    }
                    .total-row.final { 
                        font-weight: bold; 
                        font-size: 1.1em; 
                        margin-top: 5px; 
                        border-top: 1px solid #eee;
                        padding-top: 5px;
                    }

                    .footer { 
                        text-align: center; 
                        margin-top: 20px; 
                        font-size: 0.9em; 
                        border-top: 1px dashed #000;
                        padding-top: 10px;
                    }
                    
                    @media print {
                        @page { margin: 0; }
                        body { padding: 5px; background: white; }
                        .receipt { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <!-- Header -->
                    <div class="header">
                        <h2>${data.storeName || 'STORE'}</h2>
                        ${Object.entries(data.headerInfo || {}).map(([key, val]) =>
            val ? `<p>${val}</p>` : ''
        ).join('')}
                    </div>

                    <!-- Content (List or Table) -->
                    ${this.renderContent(data, config)}

                    <!-- Totals -->
                    <div class="totals">
                        ${Object.entries(data.totals || {}).map(([label, val]) => `
                            <div class="total-row ${label.toLowerCase().includes('total') ? 'final' : ''}">
                                <span>${label}:</span>
                                <span>${val}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Footer -->
                    <div class="footer">
                        ${(data.footer || []).map(line => `<p>${line}</p>`).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;
    },

    renderContent(data, config) {
        if (config.paperSize === '58mm') {
            // List View for Receipt
            return `
                <div class="items">
                    ${(data.items || []).map(item => `
                        <div style="margin-bottom: 8px;">
                            <div class="item-name">${item.name || item.description || 'Item'}</div>
                            <div class="item-details">
                                <span>${item.qty || 1} x ${item.price}</span>
                                <span>${item.total}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            // Table View for A4 / Reports (Standard)
            return `
                <table>
                    <thead>
                        <tr>
                            ${(config.columns || []).map(col => `
                                <th class="${col.align || 'text-left'}" style="${col.width ? 'width:' + col.width + ';' : ''}">${col.header}</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map(item => `
                            <tr>
                                ${(config.columns || []).map(col => `
                                    <td class="${col.align || 'text-left'}">${item[col.field]}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    },

    renderFormalTemplate(data, config) {
        const now = new Date();
        const styles = `
            /* Base Layout */
            * { box-sizing: border-box; }
            body { 
                font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif; 
                color: #111827; 
                line-height: 1.5; 
                margin: 0;
                padding: 0;
                background: #fff;
            }
            .page-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 15mm; /* Reduced padding for more space */
                min-height: 297mm;
                background: white;
                display: flex;
                flex-direction: column;
            }
            
            /* Header */
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; gap: 20px; }
            .company-info { min-width: 0; } /* Allow shrinking if needed */
            .company-info h1 { margin: 0; color: #3B82F6; font-size: 24px; font-weight: 700; line-height: 1.2; }
            .company-info p { margin: 4px 0 0 0; color: #4B5563; font-size: 14px; }
            .document-info { text-align: right; min-width: 0; flex-shrink: 0; } /* Keep document info from shrinking too much */
            .document-info h2 { margin: 0; font-size: 24px; font-weight: 800; color: #6B7280; white-space: nowrap; }
            
            /* Info Grid */
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
            .section { min-width: 150px; } /* Ensure sections have min width */
            .section.right { text-align: right; }
            .section h3 { font-size: 11px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em; }
            .section p { margin: 0; font-weight: 500; font-size: 14px; color: #111827; }
            
            /* Table */
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #F9FAFB; text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; text-transform: uppercase; letter-spacing: 0.05em; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6; color: #1F2937; vertical-align: top; }
            
            /* Helpers */
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            /* Totals */
            .totals { display: flex; justify-content: flex-end; margin-top: 20px; page-break-inside: avoid; }
            .totals-table { width: auto; min-width: 250px; border-collapse: collapse; }
            .totals-table tr td { padding: 6px 0 6px 20px; font-size: 14px; }
            .totals-table tr td:first-child { color: #6B7280; font-weight: 500; text-align: right; padding-right: 15px; }
            .totals-table tr td:last-child { font-weight: 600; color: #111827; text-align: right; min-width: 100px; }
            .totals-table tr.grand-total td { font-weight: 800; color: #3B82F6; font-size: 16px; border-top: 2px solid #E5E7EB; padding-top: 15px; margin-top: 5px; }
            
            /* Footer */
            .footer { margin-top: auto; font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px dashed #E5E7EB; padding-top: 20px; page-break-inside: avoid; }
            
            /* Toolbar Styles */
            .toolbar {
                position: sticky; top: 0; left: 0; right: 0;
                background: #f3f4f6; padding: 12px 20px;
                display: flex; justify-content: flex-end; gap: 10px;
                border-bottom: 1px solid #e5e7eb;
                margin-bottom: 20px;
                z-index: 50;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .btn {
                padding: 8px 16px; border-radius: 6px; border: 1px solid #d1d5db;
                cursor: pointer; font-size: 14px; font-weight: 500;
                display: flex; align-items: center; gap: 6px;
                transition: all 0.2s;
            }
            .btn-print { background: #3b82f6; color: white; border-color: #2563eb; }
            .btn-print:hover { background: #2563eb; }
            .btn-close { background: white; color: #374151; }
            .btn-close:hover { background: #f9fafb; border-color: #9ca3af; }
            
            /* Print Specifics */
            @page { size: A4; margin: 0; }
            @media print { 
                html, body { 
                    width: 210mm; 
                    height: 297mm; 
                    margin: 0 !important; 
                    padding: 0 !important; 
                    background: white;
                }
                .page-container { 
                    width: 210mm; 
                    min-height: 297mm; 
                    margin: 0 !important; 
                    padding: 20mm !important; 
                    border: none;
                    box-shadow: none;
                    position: relative;
                }
                .no-print { display: none !important; } 
                .toolbar { display: none !important; }
            }
            
            /* Screen Preview Enhancements */
            @media screen {
                body { background: #525659; }
                .page-container {
                    margin: 40px auto;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
            }

            /* Mobile Responsiveness */
            @media screen and (max-width: 768px) {
                body { padding: 0; }
                .page-container {
                    padding: 20px;
                    margin: 0;
                    width: 100%;
                    max-width: 100%;
                    min-height: auto;
                    border-radius: 0;
                }
                .header { flex-direction: column; gap: 15px; align-items: flex-start; }
                .document-info { text-align: left; align-items: flex-start; width: 100%; margin-top: 10px; }
                .info-grid { flex-direction: column; gap: 20px; }
                .section.right { text-align: left; }
                .totals { justify-content: flex-start; }
                .footer { margin-top: 30px; }
                
                /* Toolbar adjustment */
                .toolbar {
                    position: sticky;
                    padding: 10px;
                    margin: 0 0 20px 0;
                    width: 100%;
                }
            }
        `;

        // Override default styles if template is formal
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${config.title}</title>
                <!-- Preconnect & Fonts -->
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
                <style>${styles}</style>
            </head>
            <body>
                <div class="toolbar no-print">
                    <button onclick="window.print()" class="btn btn-print">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Print
                    </button>
                    <button onclick="window.close()" class="btn btn-close">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        Close
                    </button>
                </div>

                <div class="page-container">
                    <div class="header">
                        <div class="company-info">
                            <h1>${data.companyName || 'Ezyparts Inventory'}</h1>
                            <p>${data.companySubtitle || 'Sparepart Management System'}</p>
                        </div>
                        <div class="document-info">
                            <h2>${data.documentTitle || 'DOCUMENT'}</h2>
                            <p style="font-size: 14px; font-weight: 500; color: #374151;">#${data.documentId || ''}</p>
                        </div>
                    </div>

                    <div class="info-grid">
                        <div class="section">
                            ${(data.leftSection || []).map(item => `
                                <div style="margin-bottom: 15px;">
                                    <h3>${item.label}</h3>
                                    <p style="font-size: 15px; ${item.style || ''}">${item.value}</p>
                                    ${item.subValue ? `<p style="color: #6B7280; font-size: 13px; margin-top: 2px;">${item.subValue}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                        <div class="section right">
                            ${(data.rightSection || []).map(item => `
                                <div style="margin-bottom: 15px;">
                                    <h3>${item.label}</h3>
                                    <p style="font-size: 15px; ${item.style || ''}">${item.value}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th width="40">No</th>
                                ${(config.columns || []).map(col => `
                                    <th class="${col.align || 'text-left'}" style="${col.width ? 'width:' + col.width + ';' : ''}">${col.header}</th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.items || []).map((item, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    ${(config.columns || []).map(col => `
                                        <td class="${col.align || 'text-left'}" style="${col.style || ''}">
                                            ${col.render ? col.render(item[col.field], item) : item[col.field]}
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        <table class="totals-table">
                            ${Object.entries(data.totals || {}).map(([label, val], idx, arr) => {
            const isLast = idx === arr.length - 1;
            return `
                                    <tr class="${isLast ? 'grand-total' : ''}">
                                        <td>${label}</td>
                                        <td>${val}</td>
                                    </tr>
                                `;
        }).join('')}
                        </table>
                    </div>

                    ${data.notes ? `
                        <div class="section" style="margin-top: 30px; background: #F9FAFB; padding: 15px; border-radius: 8px;">
                            <h3>Notes / Instructions</h3>
                            <p style="font-style: italic; font-size: 13px;">${data.notes}</p>
                        </div>
                    ` : ''}

                    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                        ${(data.signatures || []).map(sig => `
                            <div class="section" style="border-top: 1px solid #E5E7EB; width: 200px; padding-top: 10px; text-align: center;">
                                <h3>${sig.label}</h3>
                                <p style="margin-top: ${sig.name ? '10px' : '40px'}; font-weight: 600;">${sig.name || '( _________________ )'}</p>
                            </div>
                        `).join('')}
                    </div>

                    <div class="footer">
                        <p>This is a computer-generated document. No signature is required.</p>
                        ${(data.footer || []).map(line => `<p>${line}</p>`).join('')}
                        <p style="margin-top: 5px; opacity: 0.8;">Generated on ${now.toLocaleString('id-ID')} • ${data.footerText || 'Ezyparts Inventory System'}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        return fullHtml;
    }
};
