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
        if (config.paperSize === '58mm') {
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
            // Table View for A4 / Reports
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
    }
};
