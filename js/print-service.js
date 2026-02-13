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
            printWindow.close();
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
            body { font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif; color: #111827; padding: 40px; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #3B82F6; font-size: 24px; }
            .document-info { text-align: right; }
            .document-info h2 { margin: 0; font-size: 18px; color: #6B7280; }
            .section h3 { font-size: 12px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 8px; }
            .section p { margin: 0; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #F9FAFB; text-align: left; padding: 12px; font-size: 12px; font-weight: bold; color: #4B5563; border-bottom: 1px solid #E5E7EB; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F3F4F6; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-table { width: 250px; }
            .totals-table tr td:first-child { color: #6B7280; }
            .totals-table tr.grand-total td { font-weight: bold; color: #3B82F6; font-size: 16px; border-top: 1px solid #E5E7EB; padding-top: 15px; }
            .footer { margin-top: 50px; font-size: 11px; color: #9CA3AF; text-align: center; }
            @media print { body { padding: 0; } .no-print { display: none; } }
        `;

        // Override default styles if template is formal
        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${config.title}</title>
                <style>${styles}</style>
            </head>
            <body>
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

                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div class="section">
                        ${(data.leftSection || []).map(item => `
                            <h3>${item.label}</h3>
                            <p style="${item.style || ''}">${item.value}</p>
                            ${item.subValue ? `<p style="color: #6B7280; font-size: 0.9em;">${item.subValue}</p>` : ''}
                        `).join('')}
                    </div>
                    <div class="section" style="text-align: right;">
                        ${(data.rightSection || []).map(item => `
                            <h3 style="${item.marginTop ? 'margin-top: 15px;' : ''}">${item.label}</h3>
                            <p style="${item.style || ''}">${item.value}</p>
                        `).join('')}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th width="40">No</th>
                            ${(config.columns || []).map(col => `
                                <th class="${col.align || 'text-left'}">${col.header}</th>
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
                                    <td class="text-right">${val}</td>
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
                            <p style="margin-top: ${sig.name ? '10px' : '40px'};">${sig.name || '( _________________ )'}</p>
                            ${sig.name ? `<p style="margin-top: 30px;">( _________________ )</p>` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="footer">
                    <p>Generated on ${now.toLocaleString('id-ID')} • ${data.footerText || 'Ezyparts Inventory System'}</p>
                </div>
            </body>
            </html>
        `;

        return fullHtml;
    }
};
