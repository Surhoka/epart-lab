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
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();

        // Wait for resources to load then print
        setTimeout(() => {
            printWindow.print();
            // printWindow.close(); // Keep window open for manual control
        }, 500);
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
                        max-width: ${config.paperSize === '58mm' ? '300px' : '100%'}; 
                        margin: 0 auto; 
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
                        ${config.paperSize === '58mm' ? '' : 'width: auto; margin-bottom: 0;'}
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
                        body { padding: 5px; }
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
        if (config.template === 'formal') {
            return this.renderFormalTemplate(data, config);
        } else if (config.paperSize === '58mm') {
            // List View for Receipt
            return `
                <div class="items">
                    ${(data.items || []).map(item => `
                        <div style="margin-bottom: 8px;">
                            <div class="item-name">${item.name || item.description}</div>
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
                                <th class="${col.align || 'text-left'}">${col.header}</th>
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
            padding: 15mm;
            min-height: 297mm;
            background: white;
        }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
        .company-info h1 { margin: 0; color: #3B82F6; font-size: 24px; font-weight: 700; }
        .company-info p { margin: 4px 0 0 0; color: #4B5563; font-size: 14px; }
        .document-info { text-align: right; }
        .document-info h2 { margin: 0; font-size: 24px; font-weight: 800; color: #6B7280; }
        
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
        .section h3 { font-size: 11px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 4px; }
        .section p { margin: 0; font-size: 14px; color: #111827; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #F9FAFB; text-align: left; padding: 10px; font-size: 11px; font-weight: 700; color: #4B5563; border-bottom: 1px solid #E5E7EB; }
        td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6; color: #1F2937; }
        
        .totals { display: flex; justify-content: flex-end; margin-top: 20px; page-break-inside: avoid; }
        .totals-table { width: auto; min-width: 250px; border-collapse: collapse; }
        .totals-table tr td { padding: 6px 0 6px 20px; font-size: 14px; }
        .totals-table tr.grand-total td { font-weight: 800; color: #3B82F6; font-size: 16px; border-top: 2px solid #E5E7EB; padding-top: 15px; }
        
        .footer { margin-top: 40px; font-size: 11px; color: #9CA3AF; text-align: center; border-top: 1px dashed #E5E7EB; padding-top: 20px; page-break-inside: avoid; }
        
        @page { size: A4; margin: 0; }
        @media print { 
            html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
            .page-container { padding: 20mm; }
            .toolbar { display: none !important; }
        }
        @media screen {
            body { background: #525659; }
            .page-container { margin: 40px auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        }
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${config.title}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
            <style>${styles}</style>
        </head>
        <body>
            <div class="page-container">
                <div class="header">
                    <div class="company-info">
                        <h1>${data.companyName || 'Ezyparts Inventory'}</h1>
                        <p>${data.companySubtitle || 'Sparepart Management System'}</p>
                    </div>
                    <div class="document-info">
                        <h2>${data.documentTitle || 'DOCUMENT'}</h2>
                        <p>#${data.documentId || ''}</p>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="section">
                        ${(data.leftSection || []).map(item => `
                            <h3>${item.label}</h3>
                            <p>${item.value}</p>
                        `).join('')}
                    </div>
                    <div class="section right">
                        ${(data.rightSection || []).map(item => `
                            <h3>${item.label}</h3>
                            <p>${item.value}</p>
                        `).join('')}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            ${(config.columns || []).map(col => `<th>${col.header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${(data.items || []).map((item, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                ${(config.columns || []).map(col => `<td>${item[col.field]}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <table class="totals-table">
                        ${Object.entries(data.totals || {}).map(([label, val], idx, arr) => `
                            <tr class="${idx === arr.length - 1 ? 'grand-total' : ''}">
                                <td>${label}</td>
                                <td>${val}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>

                ${data.notes ? `<div class="section"><h3>Notes</h3><p>${data.notes}</p></div>` : ''}

                <div class="footer">
                    <p>Generated on ${now.toLocaleString('id-ID')} • ${data.footerText || 'Ezyparts Inventory System'}</p>
                </div>
            </div>
        </body>
        </html>
    `;
}
