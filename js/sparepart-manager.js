/**
 * @fileoverview Frontend logic for Sparepart Management with POS Integration
 * Manages state for Inventory, Dashboard, POS Cashier, Transactions, and Reports views.
 */

const registerSparepartManager = () => {
    window.Alpine.data('sparepartManager', () => ({
        spareparts: [],
        isLoading: false,
        isUploading: false,
        filter: {
            search: '',
            category: 'All'
        },
        stats: {
            totalItems: 0,
            totalStock: 0,
            totalValue: 0,
            lowStockCount: 0
        },
        categories: ['All'],

        // Modal & Form State
        showModal: false,
        isEditing: false,
        editingItem: {},

        async init() {
            console.log('Sparepart Manager Initialized');
            await this.fetchSpareparts();
        },

        async fetchSpareparts() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSpareparts', {}, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.spareparts = response;
                this.calculateStats();
                this.extractCategories();
            } catch (err) {
                console.error('Failed to fetch spareparts:', err);
                window.showToast?.('Gagal mengambil data sparepart: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        calculateStats() {
            this.stats.totalItems = this.spareparts.length;
            this.stats.totalStock = this.spareparts.reduce((sum, item) => sum + Number(item.stock || 0), 0);
            this.stats.totalValue = this.spareparts.reduce((sum, item) => sum + (Number(item.stock || 0) * Number(item.price || 0)), 0);
            this.stats.lowStockCount = this.spareparts.filter(item => Number(item.stock || 0) <= 5).length;
        },

        extractCategories() {
            const cats = new Set(['All']);
            this.spareparts.forEach(item => {
                if (item.category) cats.add(item.category);
            });
            this.categories = Array.from(cats);
        },

        get filteredSpareparts() {
            return this.spareparts.filter(item => {
                const matchesSearch = !this.filter.search ||
                    (item.name || '').toLowerCase().includes(this.filter.search.toLowerCase()) ||
                    (item.partnumber || '').toLowerCase().includes(this.filter.search.toLowerCase());

                const matchesCategory = this.filter.category === 'All' || item.category === this.filter.category;

                return matchesSearch && matchesCategory;
            });
        },

        // CRUD Operations
        openAddModal() {
            this.isEditing = false;
            this.editingItem = {
                partnumber: '',
                name: '',
                category: '',
                stock: 0,
                price: 0,
                supplier: '',
                location: '',
                imageurl: ''
            };
            this.showModal = true;
        },

        editSparepart(item) {
            this.isEditing = true;
            this.editingItem = { ...item };
            this.showModal = true;
        },

        async saveSparepart() {
            const btn = document.getElementById('save-sparepart-btn');
            window.setButtonLoading?.(btn, true);

            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('saveSparepart', this.editingItem, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message);
                this.showModal = false;
                await this.fetchSpareparts();
            } catch (err) {
                window.showToast?.('Gagal menyimpan: ' + err, 'error');
            } finally {
                window.setButtonLoading?.(btn, false);
            }
        },

        async deleteItem(id) {
            if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;

            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('deleteSparepart', { id }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message);
                await this.fetchSpareparts();
            } catch (err) {
                window.showToast?.('Gagal menghapus: ' + err, 'error');
            }
        },

        async adjustStock(id, amount) {
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('adjustStock', { id, amount }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message);
                await this.fetchSpareparts();
            } catch (err) {
                window.showToast?.('Gagal menyesuaikan stok: ' + err, 'error');
            }
        },

        async handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            this.isUploading = true;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Data = e.target.result.split(',')[1];
                const mimeType = file.type;
                const fileName = file.name;

                try {
                    const response = await new Promise((resolve, reject) => {
                        window.sendDataToGoogle('uploadImageAndGetUrl', {
                            fileData: base64Data,
                            mimeType: mimeType,
                            fileName: fileName,
                            folderName: 'Spareparts'
                        }, (res) => {
                            if (res.status === 'success') resolve(res);
                            else reject(res.message);
                        }, (err) => reject(err));
                    });

                    this.editingItem.imageurl = response.url;
                    window.showToast?.('Foto berhasil diupload');
                } catch (err) {
                    console.error('Upload failed:', err);
                    window.showToast?.('Gagal upload foto: ' + err, 'error');
                } finally {
                    this.isUploading = false;
                    event.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);
        }
    }));
};

// ===== POS MANAGER COMPONENT =====

const registerPosManager = () => {
    window.Alpine.data('posManager', () => ({
        // Product Management
        products: [],
        filteredProducts: [],
        searchQuery: '',
        isLoading: false,

        // Cart Management
        cart: {
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0
        },

        // Customer & Payment
        customerInfo: {
            name: '',
            phone: ''
        },
        paymentMethod: 'Cash',
        paymentAmount: 0,

        // Transaction Processing
        isProcessing: false,
        showSuccessModal: false,
        lastTransaction: {},

        async init() {
            console.log('POS Manager Initialized');
            await this.loadProducts();
            this.calculateCartTotals();

            // Watch for cart changes
            this.$watch('cart.items', () => {
                this.calculateCartTotals();
            });

            // Watch for payment amount changes
            this.$watch('paymentAmount', (value) => {
                if (this.paymentMethod !== 'Cash') {
                    this.paymentAmount = this.cart.total;
                }
            });

            // Watch for payment method changes
            this.$watch('paymentMethod', (value) => {
                if (value === 'Cash') {
                    this.paymentAmount = this.cart.total;
                } else {
                    this.paymentAmount = this.cart.total;
                }
            });
        },

        async loadProducts() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSpareparts', {}, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                // Filter only products with stock > 0
                this.products = response.filter(product => Number(product.stock || 0) > 0);
                this.filteredProducts = [...this.products];

            } catch (err) {
                console.error('Failed to load products:', err);
                window.showToast?.('Failed to load products: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async refreshProducts() {
            await this.loadProducts();
            window.showToast?.('Products refreshed');
        },

        searchProducts() {
            if (!this.searchQuery.trim()) {
                this.filteredProducts = [...this.products];
                return;
            }

            const query = this.searchQuery.toLowerCase();
            this.filteredProducts = this.products.filter(product =>
                (product.name || '').toLowerCase().includes(query) ||
                (product.partnumber || '').toLowerCase().includes(query) ||
                (product.category || '').toLowerCase().includes(query)
            );
        },

        handleBarcodeInput(event) {
            const barcode = event.target.value.trim();
            if (!barcode) return;

            // Find product by part number (assuming barcode = part number)
            const product = this.products.find(p =>
                (p.partnumber || '').toLowerCase() === barcode.toLowerCase()
            );

            if (product) {
                this.addToCart(product);
                this.searchQuery = '';
                this.filteredProducts = [...this.products];
                window.showToast?.(`Added ${product.name} to cart`);
            } else {
                window.showToast?.('Product not found', 'error');
            }
        },

        addToCart(product) {
            // Check if product already in cart
            const existingItem = this.cart.items.find(item => item.id === product.id);

            if (existingItem) {
                // Check stock availability
                if (existingItem.quantity >= Number(product.stock)) {
                    window.showToast?.('Insufficient stock available', 'error');
                    return;
                }
                existingItem.quantity += 1;
            } else {
                // Add new item to cart
                this.cart.items.push({
                    id: product.id,
                    partnumber: product.partnumber,
                    name: product.name,
                    price: Number(product.price || 0),
                    quantity: 1,
                    stock: Number(product.stock || 0),
                    imageurl: product.imageurl
                });
            }

            this.calculateCartTotals();
        },

        removeFromCart(productId) {
            this.cart.items = this.cart.items.filter(item => item.id !== productId);
            this.calculateCartTotals();
        },

        updateCartItemQuantity(productId, newQuantity) {
            if (newQuantity <= 0) {
                this.removeFromCart(productId);
                return;
            }

            const item = this.cart.items.find(item => item.id === productId);
            if (item) {
                // Check stock availability
                if (newQuantity > item.stock) {
                    window.showToast?.('Insufficient stock available', 'error');
                    return;
                }
                item.quantity = newQuantity;
                this.calculateCartTotals();
            }
        },

        clearCart() {
            if (this.cart.items.length === 0) return;

            if (confirm('Are you sure you want to clear the cart?')) {
                this.cart.items = [];
                this.calculateCartTotals();
                this.resetCustomerInfo();
            }
        },

        calculateCartTotals() {
            this.cart.subtotal = this.cart.items.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );

            // Calculate tax (10% for example, can be configurable)
            this.cart.tax = Math.round(this.cart.subtotal * 0.1);

            // Discount can be applied here (for now, set to 0)
            this.cart.discount = 0;

            this.cart.total = this.cart.subtotal + this.cart.tax - this.cart.discount;

            // Update payment amount if not cash or if cash and amount is less than total
            if (this.paymentMethod !== 'Cash' || this.paymentAmount < this.cart.total) {
                this.paymentAmount = this.cart.total;
            }
        },

        async processCheckout() {
            if (this.cart.items.length === 0) {
                window.showToast?.('Cart is empty', 'error');
                return;
            }

            if (this.paymentMethod === 'Cash' && this.paymentAmount < this.cart.total) {
                window.showToast?.('Payment amount is insufficient', 'error');
                return;
            }

            this.isProcessing = true;

            try {
                const transactionData = {
                    items: this.cart.items,
                    subtotal: this.cart.subtotal,
                    tax: this.cart.tax,
                    discount: this.cart.discount,
                    total: this.cart.total,
                    paymentMethod: this.paymentMethod,
                    paymentAmount: this.paymentAmount,
                    customerName: this.customerInfo.name,
                    customerPhone: this.customerInfo.phone,
                    cashier: this.getCurrentUser()
                };

                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('createTransaction', transactionData, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                // Store transaction details for receipt
                this.lastTransaction = {
                    transactionNumber: response.data.transactionNumber,
                    total: response.data.total,
                    change: response.data.change
                };

                // Show success modal
                this.showSuccessModal = true;

                // Clear cart and reset form
                this.cart.items = [];
                this.calculateCartTotals();
                this.resetCustomerInfo();

                window.showToast?.('Transaction completed successfully!', 'success');

            } catch (err) {
                console.error('Transaction failed:', err);
                window.showToast?.('Transaction failed: ' + err, 'error');
            } finally {
                this.isProcessing = false;
            }
        },

        closeSuccessModal() {
            this.showSuccessModal = false;
            this.lastTransaction = {};
        },

        printReceipt() {
            // Generate receipt content
            const receiptContent = this.generateReceiptHTML();

            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptContent);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        },

        generateReceiptHTML() {
            const now = new Date();
            const transaction = this.lastTransaction;

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receipt - ${transaction.transactionNumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
                        .receipt { max-width: 300px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <h2>SPAREPART STORE</h2>
                            <p>Transaction: ${transaction.transactionNumber}</p>
                            <p>Date: ${now.toLocaleString()}</p>
                            <p>Cashier: ${this.getCurrentUser()}</p>
                        </div>
                        
                        <div class="items">
                            ${this.cart.items.map(item => `
                                <div class="item">
                                    <span>${item.name}</span>
                                </div>
                                <div class="item">
                                    <span>${item.quantity} x ${this.formatPrice(item.price)}</span>
                                    <span>${this.formatPrice(item.quantity * item.price)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="total">
                            <div class="item">
                                <span>Subtotal:</span>
                                <span>${this.formatPrice(this.cart.subtotal)}</span>
                            </div>
                            <div class="item">
                                <span>Tax:</span>
                                <span>${this.formatPrice(this.cart.tax)}</span>
                            </div>
                            <div class="item">
                                <span>Total:</span>
                                <span>${this.formatPrice(transaction.total)}</span>
                            </div>
                            <div class="item">
                                <span>Payment (${this.paymentMethod}):</span>
                                <span>${this.formatPrice(this.paymentAmount)}</span>
                            </div>
                            ${transaction.change > 0 ? `
                                <div class="item">
                                    <span>Change:</span>
                                    <span>${this.formatPrice(transaction.change)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your purchase!</p>
                            <p>Please keep this receipt for your records</p>
                        </div>
                    </div>
                </body>
                </html>
            `;
        },

        resetCustomerInfo() {
            this.customerInfo = {
                name: '',
                phone: ''
            };
            this.paymentMethod = 'Cash';
            this.paymentAmount = 0;
        },

        getCurrentUser() {
            // Get current user from localStorage or return default
            try {
                const user = JSON.parse(localStorage.getItem('signedInUser') || '{}');
                return user.firstName || 'Cashier';
            } catch (e) {
                return 'Cashier';
            }
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(price || 0);
        }
    }));
};

// ===== POS TRANSACTIONS COMPONENT =====

const registerPosTransactions = () => {
    window.Alpine.data('posTransactions', () => ({
        // Data Management
        transactions: [],
        filteredTransactions: [],
        isLoading: false,

        // Filters
        filters: {
            dateFrom: '',
            dateTo: '',
            status: '',
            search: ''
        },

        // Statistics
        stats: {
            totalTransactions: 0,
            totalSales: 0,
            averageTransaction: 0,
            todaySales: 0
        },

        // Modal Management
        showDetailsModal: false,
        selectedTransaction: null,

        async init() {
            console.log('POS Transactions Initialized');

            // Set default date filters (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

            this.filters.dateTo = today.toISOString().split('T')[0];
            this.filters.dateFrom = thirtyDaysAgo.toISOString().split('T')[0];

            await this.loadTransactions();
        },

        async loadTransactions() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getTransactions', this.filters, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.transactions = response || [];
                this.applyFilters();
                this.calculateStats();

            } catch (err) {
                console.error('Failed to load transactions:', err);
                window.showToast?.('Failed to load transactions: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async refreshTransactions() {
            await this.loadTransactions();
            window.showToast?.('Transactions refreshed');
        },

        applyFilters() {
            let filtered = [...this.transactions];

            // Apply search filter
            if (this.filters.search.trim()) {
                const search = this.filters.search.toLowerCase();
                filtered = filtered.filter(t =>
                    (t.transactionnumber || '').toLowerCase().includes(search) ||
                    (t.customername || '').toLowerCase().includes(search) ||
                    (t.customerphone || '').toLowerCase().includes(search)
                );
            }

            // Apply status filter
            if (this.filters.status) {
                filtered = filtered.filter(t => t.status === this.filters.status);
            }

            // Apply date filters
            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                filtered = filtered.filter(t => new Date(t.date) >= fromDate);
            }

            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo + 'T23:59:59');
                filtered = filtered.filter(t => new Date(t.date) <= toDate);
            }

            // Sort by date descending
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.filteredTransactions = filtered;
        },

        calculateStats() {
            const completedTransactions = this.transactions.filter(t => t.status === 'completed');

            this.stats.totalTransactions = completedTransactions.length;
            this.stats.totalSales = completedTransactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
            this.stats.averageTransaction = this.stats.totalTransactions > 0 ?
                this.stats.totalSales / this.stats.totalTransactions : 0;

            // Calculate today's sales
            const today = new Date().toDateString();
            const todayTransactions = completedTransactions.filter(t =>
                new Date(t.date).toDateString() === today
            );
            this.stats.todaySales = todayTransactions.reduce((sum, t) => sum + Number(t.total || 0), 0);
        },

        viewTransactionDetails(transaction) {
            this.selectedTransaction = transaction;
            this.showDetailsModal = true;
        },

        closeDetailsModal() {
            this.showDetailsModal = false;
            this.selectedTransaction = null;
        },

        async voidTransaction(transaction) {
            if (!confirm(`Are you sure you want to void transaction ${transaction.transactionnumber}? This action cannot be undone and will restore the stock levels.`)) {
                return;
            }

            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('voidTransaction', {
                        transactionId: transaction.transactionid
                    }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.('Transaction voided successfully', 'success');
                await this.loadTransactions();

            } catch (err) {
                console.error('Failed to void transaction:', err);
                window.showToast?.('Failed to void transaction: ' + err, 'error');
            }
        },

        printTransactionReceipt(transaction) {
            const receiptContent = this.generateTransactionReceiptHTML(transaction);

            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptContent);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        },

        generateTransactionReceiptHTML(transaction) {
            const items = this.getTransactionItems(transaction);

            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receipt - ${transaction.transactionnumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
                        .receipt { max-width: 300px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                        .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-weight: bold; }
                        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
                    </style>
                </head>
                <body>
                    <div class="receipt">
                        <div class="header">
                            <h2>SPAREPART STORE</h2>
                            <p>Transaction: ${transaction.transactionnumber}</p>
                            <p>Date: ${this.formatDateTime(transaction.date)}</p>
                            <p>Cashier: ${transaction.cashier || 'System'}</p>
                            ${transaction.customername ? `<p>Customer: ${transaction.customername}</p>` : ''}
                        </div>
                        
                        <div class="items">
                            ${items.map(item => `
                                <div class="item">
                                    <span>${item.name}</span>
                                </div>
                                <div class="item">
                                    <span>${item.quantity} x ${this.formatPrice(item.price)}</span>
                                    <span>${this.formatPrice(item.quantity * item.price)}</span>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="total">
                            <div class="item">
                                <span>Subtotal:</span>
                                <span>${this.formatPrice(transaction.subtotal)}</span>
                            </div>
                            <div class="item">
                                <span>Tax:</span>
                                <span>${this.formatPrice(transaction.tax)}</span>
                            </div>
                            ${transaction.discount > 0 ? `
                                <div class="item">
                                    <span>Discount:</span>
                                    <span>-${this.formatPrice(transaction.discount)}</span>
                                </div>
                            ` : ''}
                            <div class="item">
                                <span>Total:</span>
                                <span>${this.formatPrice(transaction.total)}</span>
                            </div>
                            <div class="item">
                                <span>Payment (${transaction.paymentmethod}):</span>
                                <span>${this.formatPrice(transaction.paymentamount)}</span>
                            </div>
                            ${transaction.change > 0 ? `
                                <div class="item">
                                    <span>Change:</span>
                                    <span>${this.formatPrice(transaction.change)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your purchase!</p>
                            <p>Please keep this receipt for your records</p>
                            ${transaction.status === 'voided' ? '<p><strong>*** VOIDED TRANSACTION ***</strong></p>' : ''}
                        </div>
                    </div>
                </body>
                </html>
            `;
        },

        getTransactionItems(transaction) {
            if (!transaction || !transaction.items) return [];

            try {
                if (typeof transaction.items === 'string') {
                    return JSON.parse(transaction.items);
                }
                return Array.isArray(transaction.items) ? transaction.items : [];
            } catch (e) {
                console.error('Failed to parse transaction items:', e);
                return [];
            }
        },

        getItemCount(items) {
            const parsedItems = this.getTransactionItems({ items });
            return parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        },

        getItemSummary(items) {
            const parsedItems = this.getTransactionItems({ items });
            if (parsedItems.length === 0) return 'No items';

            const firstItem = parsedItems[0];
            if (parsedItems.length === 1) {
                return `${firstItem.quantity}x ${firstItem.name}`;
            }

            return `${firstItem.name} +${parsedItems.length - 1} more`;
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(price || 0);
        },

        formatDate(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('id-ID');
        },

        formatTime(date) {
            if (!date) return '';
            return new Date(date).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatDateTime(date) {
            if (!date) return '';
            return new Date(date).toLocaleString('id-ID');
        }
    }));
};

// ===== POS REPORTS COMPONENT =====

const registerPosReports = () => {
    window.Alpine.data('posReports', () => ({
        // Data
        reportData: null,
        isLoading: false,

        // Date Range
        dateRange: {
            from: '',
            to: ''
        },

        // Charts
        dailySalesChart: null,
        paymentMethodsChart: null,

        // Computed Properties
        get summary() {
            return this.reportData?.summary || {
                totalSales: 0,
                totalTransactions: 0,
                averageTransaction: 0
            };
        },

        get topItems() {
            return this.reportData?.topItems || [];
        },

        get recentTransactions() {
            return this.reportData?.transactions || [];
        },

        get totalItemsSold() {
            return this.topItems.reduce((sum, item) => sum + item.quantity, 0);
        },

        async init() {
            console.log('POS Reports Initialized');

            // Set default date range (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

            this.dateRange.to = today.toISOString().split('T')[0];
            this.dateRange.from = thirtyDaysAgo.toISOString().split('T')[0];

            await this.loadReports();
        },

        async loadReports() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSalesReport', {
                        dateFrom: this.dateRange.from,
                        dateTo: this.dateRange.to
                    }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.reportData = response;

                // Update charts
                this.$nextTick(() => {
                    this.updateCharts();
                });

            } catch (err) {
                console.error('Failed to load reports:', err);
                window.showToast?.('Failed to load reports: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async refreshReports() {
            await this.loadReports();
            window.showToast?.('Reports refreshed');
        },

        setDateRange(period) {
            const today = new Date();
            let fromDate;

            switch (period) {
                case 'today':
                    fromDate = new Date(today);
                    break;
                case 'week':
                    fromDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case 'month':
                    fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    break;
                default:
                    return;
            }

            this.dateRange.from = fromDate.toISOString().split('T')[0];
            this.dateRange.to = today.toISOString().split('T')[0];

            this.loadReports();
        },

        updateCharts() {
            this.updateDailySalesChart();
            this.updatePaymentMethodsChart();
        },

        updateDailySalesChart() {
            if (!this.reportData?.dailySales) return;

            const ctx = this.$refs.dailySalesChart.getContext('2d');

            if (this.dailySalesChart) {
                this.dailySalesChart.destroy();
            }

            const dailySales = this.reportData.dailySales;

            this.dailySalesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dailySales.map(d => new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })),
                    datasets: [{
                        label: 'Daily Sales',
                        data: dailySales.map(d => d.sales),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        notation: 'compact'
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        },

        updatePaymentMethodsChart() {
            if (!this.reportData?.transactions) return;

            const ctx = this.$refs.paymentMethodsChart.getContext('2d');

            if (this.paymentMethodsChart) {
                this.paymentMethodsChart.destroy();
            }

            // Calculate payment method distribution
            const paymentMethods = {};
            this.reportData.transactions.forEach(t => {
                const method = t.paymentmethod || 'Unknown';
                paymentMethods[method] = (paymentMethods[method] || 0) + Number(t.total || 0);
            });

            const labels = Object.keys(paymentMethods);
            const data = Object.values(paymentMethods);
            const colors = [
                'rgb(34, 197, 94)',   // Green for Cash
                'rgb(59, 130, 246)',  // Blue for Transfer
                'rgb(168, 85, 247)',  // Purple for Credit
                'rgb(249, 115, 22)',  // Orange for Debit
                'rgb(156, 163, 175)'  // Gray for others
            ];

            this.paymentMethodsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        },

        exportReport() {
            if (!this.reportData) {
                window.showToast?.('No data to export', 'error');
                return;
            }

            // Generate CSV content
            let csvContent = "data:text/csv;charset=utf-8,";

            // Summary
            csvContent += "SALES REPORT SUMMARY\n";
            csvContent += `Period,${this.dateRange.from} to ${this.dateRange.to}\n`;
            csvContent += `Total Sales,${this.summary.totalSales}\n`;
            csvContent += `Total Transactions,${this.summary.totalTransactions}\n`;
            csvContent += `Average Transaction,${this.summary.averageTransaction}\n\n`;

            // Top Items
            csvContent += "TOP SELLING ITEMS\n";
            csvContent += "Rank,Part Number,Name,Quantity Sold,Revenue\n";
            this.topItems.forEach((item, index) => {
                csvContent += `${index + 1},${item.partnumber},${item.name},${item.quantity},${item.revenue}\n`;
            });

            // Create download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `sales-report-${this.dateRange.from}-to-${this.dateRange.to}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.showToast?.('Report exported successfully');
        },

        getItemCount(items) {
            try {
                const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
                return Array.isArray(parsedItems) ? parsedItems.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
            } catch (e) {
                return 0;
            }
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(price || 0);
        },

        formatDate(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('id-ID');
        }
    }));
};

// ===== PURCHASE ORDERS COMPONENT =====

const registerPurchaseOrders = () => {
    window.Alpine.data('purchaseOrders', () => ({
        // Tab Management
        activeTab: 'list',

        // Data Management
        purchaseOrders: [],
        filteredPurchaseOrders: [],
        isLoading: false,

        // Filters
        filters: {
            status: '',
            supplier: '',
            dateFrom: '',
            dateTo: ''
        },

        // Modal Management (only for receiving)
        showReceivingModal: false,
        showDetailsModal: false,
        selectedPO: null,

        // Form Data
        editingPO: {
            id: '',
            supplier: '',
            expecteddate: '',
            notes: '',
            items: [],
            total: 0
        },

        receivingData: {
            date: '',
            items: [],
            notes: ''
        },

        // Calendar State
        accordion: { date: false },
        fpDate: null,

        // Calendar Methods
        initDatePicker() {
            if (this.fpDate) return;

            this.$nextTick(() => {
                const container = this.$refs.calendarMount;
                // const timeInput = this.$refs.timeInput; // Not used for PO
                const compactYear = this.$refs.compactYear;
                const compactSelectedDate = this.$refs.compactSelectedDate;
                const compactMonthLabel = this.$refs.compactMonthLabel;

                if (!container) return;

                const dateVal = this.editingPO.date ? new Date(this.editingPO.date) : new Date();

                this.updateCompactHeader(dateVal);

                try {
                    this.fpDate = flatpickr(container, {
                        inline: true,
                        className: 'flatpickr-compact',
                        dateFormat: 'Y-m-d',
                        defaultDate: dateVal,
                        locale: {
                            firstDayOfWeek: 1,
                            weekdays: {
                                shorthand: ['M', 'S', 'S', 'R', 'K', 'J', 'S'],
                                longhand: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
                            },
                            months: {
                                shorthand: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                                longhand: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
                            }
                        },
                        onChange: (selectedDates) => {
                            this.updateDate(selectedDates[0]);
                            if (selectedDates[0]) {
                                this.updateCompactHeader(selectedDates[0]);
                            }
                        },
                        onMonthChange: (selectedDates, dateStr, instance) => {
                            const currentDate = instance.currentYear && instance.currentMonth !== undefined
                                ? new Date(instance.currentYear, instance.currentMonth, 1)
                                : new Date();
                            this.updateMonthLabel(currentDate);
                        },
                        onYearChange: (selectedDates, dateStr, instance) => {
                            const currentDate = instance.currentYear && instance.currentMonth !== undefined
                                ? new Date(instance.currentYear, instance.currentMonth, 1)
                                : new Date();
                            this.updateMonthLabel(currentDate);
                        }
                    });
                } catch (e) {
                    console.error(e);
                }
            });
        },

        destroyDatePicker() {
            if (this.fpDate) { this.fpDate.destroy(); this.fpDate = null; }
        },

        updateDate(datePart) {
            let current = this.editingPO.date ? new Date(this.editingPO.date) : new Date();
            if (datePart) {
                current.setFullYear(datePart.getFullYear());
                current.setMonth(datePart.getMonth());
                current.setDate(datePart.getDate());
            }
            this.editingPO.date = current.toISOString();
        },

        updateCompactHeader(date) {
            const compactYear = this.$refs.compactYear;
            const compactSelectedDate = this.$refs.compactSelectedDate;

            if (compactYear && compactSelectedDate && date) {
                const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

                const dayName = dayNames[date.getDay()];
                const day = date.getDate();
                const monthName = monthNames[date.getMonth()];
                const year = date.getFullYear();

                compactYear.textContent = year;
                compactSelectedDate.textContent = `${dayName}, ${day} ${monthName}`;
            }

            this.updateMonthLabel(date);
        },

        updateMonthLabel(date) {
            const compactMonthLabel = this.$refs.compactMonthLabel;

            if (compactMonthLabel && date) {
                const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const monthName = monthNames[date.getMonth()];
                const year = date.getFullYear();

                compactMonthLabel.textContent = `${monthName} ${year}`;
            }
        },

        prevMonth() {
            if (this.fpDate) {
                this.fpDate.changeMonth(-1);
            }
        },

        nextMonth() {
            if (this.fpDate) {
                this.fpDate.changeMonth(1);
            }
        },

        async init() {
            console.log('Purchase Orders Initialized');
            await this.loadPurchaseOrders();
        },

        async loadPurchaseOrders() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getPurchaseOrders', {}, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.purchaseOrders = response || [];
                this.applyFilters();

            } catch (err) {
                console.error('Failed to load purchase orders:', err);
                window.showToast?.('Failed to load purchase orders: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async refreshPurchaseOrders() {
            await this.loadPurchaseOrders();
            window.showToast?.('Purchase orders refreshed');
        },

        applyFilters() {
            let filtered = [...this.purchaseOrders];

            if (this.filters.status) {
                filtered = filtered.filter(po => po.status === this.filters.status);
            }

            if (this.filters.supplier.trim()) {
                const search = this.filters.supplier.toLowerCase();
                filtered = filtered.filter(po =>
                    (po.supplier || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                filtered = filtered.filter(po => new Date(po.date) >= fromDate);
            }

            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo + 'T23:59:59');
                filtered = filtered.filter(po => new Date(po.date) <= toDate);
            }

            // Sort by date descending
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.filteredPurchaseOrders = filtered;
        },

        // Tab-based functions
        openCreatePOTab() {
            this.resetPOForm();
            this.activeTab = 'editor';
        },

        editPOInTab(po) {
            this.editingPO = {
                id: po.id,
                ponumber: po.ponumber,
                supplier: po.supplier,
                date: po.date ? new Date(po.date).toISOString() : '',
                expecteddate: po.expecteddate ? new Date(po.expecteddate).toISOString().split('T')[0] : '',
                notes: po.notes || '',
                status: po.status,
                createdby: po.createdby,
                total: po.total || 0
            };

            try {
                this.editingPO.items = typeof po.items === 'string' ? JSON.parse(po.items) : (po.items || []);
            } catch (e) {
                this.editingPO.items = [];
            }

            // Ensure items have proper structure
            this.editingPO.items = this.editingPO.items.map(item => ({
                partnumber: item.partnumber || '',
                name: item.name || '',
                quantity: item.quantity || 1,
                unitprice: item.unitprice || 0,
                receivedqty: item.receivedqty || 0
            }));

            this.calculatePOTotals();
            this.activeTab = 'editor';
        },

        resetPOForm() {
            this.editingPO = {
                id: '',
                supplier: '',
                expecteddate: '',
                notes: '',
                items: [{ partnumber: '', name: '', quantity: 1, unitprice: 0 }],
                total: 0
            };
        },

        cancelPOEditor() {
            if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
                this.resetPOForm();
                this.activeTab = 'list';
            }
        },

        addPOItem() {
            this.editingPO.items.push({
                partnumber: '',
                name: '',
                quantity: 1,
                unitprice: 0
            });
        },

        removePOItem(index) {
            this.editingPO.items.splice(index, 1);
            this.calculatePOTotals();
        },

        calculatePOTotals() {
            this.editingPO.total = this.editingPO.items.reduce((sum, item) => {
                return sum + ((item.quantity || 0) * (item.unitprice || 0));
            }, 0);
        },

        async saveDraftPO() {
            if (!this.editingPO.supplier.trim()) {
                window.showToast?.('Please enter supplier name', 'error');
                return;
            }

            this.editingPO.status = 'draft';
            await this.savePO('btn-save-draft');
        },

        async createPO() {
            if (!this.editingPO.supplier.trim()) {
                window.showToast?.('Please enter supplier name', 'error');
                return;
            }

            if (this.editingPO.items.length === 0) {
                window.showToast?.('Please add at least one item', 'error');
                return;
            }

            // Validate items
            for (const item of this.editingPO.items) {
                if (!item.partnumber.trim() || !item.name.trim() || !item.quantity || !item.unitprice) {
                    window.showToast?.('Please fill in all item details', 'error');
                    return;
                }
            }

            this.editingPO.status = 'confirmed';
            this.editingPO.createdby = this.getCurrentUser();
            await this.savePO('btn-save-po');
        },

        async updatePO() {
            if (!this.editingPO.supplier.trim()) {
                window.showToast?.('Please enter supplier name', 'error');
                return;
            }

            if (this.editingPO.items.length === 0) {
                window.showToast?.('Please add at least one item', 'error');
                return;
            }

            // Validate items
            for (const item of this.editingPO.items) {
                if (!item.partnumber.trim() || !item.name.trim() || !item.quantity || !item.unitprice) {
                    window.showToast?.('Please fill in all item details', 'error');
                    return;
                }
            }

            // Keep existing status or set to confirmed if it was draft
            if (!this.editingPO.status || this.editingPO.status === 'draft') {
                this.editingPO.status = 'confirmed';
            }

            await this.savePO('btn-save-po');
        },

        async savePO(buttonId = null) {
            try {
                if (buttonId && window.setButtonLoadingById) {
                    window.setButtonLoadingById(buttonId, true);
                }

                this.calculatePOTotals();

                const poData = JSON.parse(JSON.stringify(this.editingPO));
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('savePurchaseOrder', poData, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                const isUpdate = !!this.editingPO.id;

                if (buttonId && window.setButtonSuccessById) {
                    window.setButtonSuccessById(buttonId, { closeModal: false, message: 'Saved!' });
                } else {
                    window.showToast?.(response.message, 'success');
                }

                this.resetPOForm();
                this.activeTab = 'list';
                await this.loadPurchaseOrders();

            } catch (err) {
                if (buttonId && window.setButtonLoadingById) {
                    window.setButtonLoadingById(buttonId, false);
                }
                console.error('Failed to save purchase order:', err);
                window.showToast?.('Failed to save purchase order: ' + err, 'error');
            }
        },

        openReceivingModal(po) {
            this.selectedPO = po;

            // Parse PO items
            let poItems = [];
            try {
                poItems = typeof po.items === 'string' ? JSON.parse(po.items) : po.items || [];
            } catch (e) {
                poItems = [];
            }

            // Prepare receiving data
            this.receivingData = {
                date: new Date().toISOString().split('T')[0],
                items: poItems.map(item => ({
                    ...item,
                    orderedqty: item.quantity,
                    receivedqty: item.receivedqty || 0,
                    receivingnow: 0
                })),
                notes: ''
            };

            this.showReceivingModal = true;
        },

        closeReceivingModal() {
            this.showReceivingModal = false;
            this.selectedPO = null;
            this.receivingData = {
                date: '',
                items: [],
                notes: ''
            };
        },

        async processReceiving() {
            try {
                const receivingData = {
                    poid: this.selectedPO.id,
                    ponumber: this.selectedPO.ponumber,
                    supplier: this.selectedPO.supplier,
                    date: this.receivingData.date,
                    items: this.receivingData.items.filter(item => item.receivingnow > 0),
                    notes: this.receivingData.notes
                };

                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('processReceiving', receivingData, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message, 'success');
                this.closeReceivingModal();
                await this.loadPurchaseOrders();

            } catch (err) {
                console.error('Failed to process receiving:', err);
                window.showToast?.('Failed to process receiving: ' + err, 'error');
            }
        },

        viewPODetails(po) {
            this.selectedPO = po;
            try {
                this.selectedPO.items = typeof po.items === 'string' ? JSON.parse(po.items) : po.items || [];
            } catch (e) {
                this.selectedPO.items = [];
            }
            this.showDetailsModal = true;
        },

        closeDetailsModal() {
            this.showDetailsModal = false;
            this.selectedPO = null;
        },

        editPOFromModal(po) {
            // Deep copy PO data before closing modal to prevent null reference
            const poData = JSON.parse(JSON.stringify(po));
            this.closeDetailsModal();
            // Use setTimeout to ensure modal is closed before opening editor
            setTimeout(() => {
                this.editPOInTab(poData);
            }, 100);
        },

        receiveFromModal(po) {
            // Deep copy PO data before closing modal to prevent null reference
            const poData = JSON.parse(JSON.stringify(po));
            this.closeDetailsModal();
            // Use setTimeout to ensure modal is closed before opening receiving modal
            setTimeout(() => {
                this.openReceivingModal(poData);
            }, 100);
        },

        getStatusColor(status) {
            const colors = {
                'draft': 'bg-gray-100 text-gray-800',
                'sent': 'bg-blue-100 text-blue-800',
                'confirmed': 'bg-yellow-100 text-yellow-800',
                'partial': 'bg-orange-100 text-orange-800',
                'completed': 'bg-green-100 text-green-800',
                'cancelled': 'bg-red-100 text-red-800'
            };
            return colors[status] || 'bg-gray-100 text-gray-800';
        },

        getStatusLabel(status) {
            const labels = {
                'draft': 'Draft',
                'sent': 'Sent',
                'confirmed': 'Confirmed',
                'partial': 'Partially Received',
                'completed': 'Completed',
                'cancelled': 'Cancelled'
            };
            return labels[status] || status;
        },

        getItemCount(items) {
            try {
                const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
                return Array.isArray(parsedItems) ? parsedItems.length : 0;
            } catch (e) {
                return 0;
            }
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(price || 0);
        },

        formatDate(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('id-ID');
        },

        async deletePO(po) {
            if (!confirm(`Are you sure you want to delete PO ${po.ponumber}?`)) return;

            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('deletePurchaseOrder', { id: po.id }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message, 'success');
                await this.loadPurchaseOrders();
            } catch (err) {
                console.error('Failed to delete PO:', err);
                window.showToast?.('Failed to delete PO: ' + err, 'error');
            }
        },

        async sendPOToSupplier(po) {
            const email = prompt("Enter Supplier Email:", "");
            if (email === null) return; // Cancelled
            if (!email.trim()) {
                window.showToast?.('Email is required', 'error');
                return;
            }

            if (!confirm(`Send PO ${po.ponumber} to ${email}? This will lock the PO.`)) return;

            try {
                window.showToast?.('Sending email...', 'info');
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('sendPOToSupplier', {
                        po: po,
                        supplierEmail: email
                    }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message, 'success');
                await this.loadPurchaseOrders();
            } catch (err) {
                console.error('Failed to send PO:', err);
                window.showToast?.('Failed to send PO: ' + err, 'error');
            }
        },

        getCurrentUser() {
            try {
                const user = JSON.parse(localStorage.getItem('signedInUser') || '{}');
                return user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'System';
            } catch (e) {
                return 'System';
            }
        }
    }));
};

// ===== RECEIVING HISTORY COMPONENT =====

const registerReceivingHistory = () => {
    window.Alpine.data('receivingHistory', () => ({
        // Data Management
        receivings: [],
        filteredReceivings: [],
        isLoading: false,

        // Filters
        filters: {
            ponumber: '',
            supplier: '',
            dateFrom: '',
            dateTo: ''
        },

        // Modal Management
        showDetailsModal: false,
        selectedReceiving: null,

        async init() {
            console.log('Receiving History Initialized');
            await this.loadReceivingHistory();
        },

        async loadReceivingHistory() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getReceivingHistory', {}, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.receivings = response || [];
                this.applyFilters();

            } catch (err) {
                console.error('Failed to load receiving history:', err);
                window.showToast?.('Failed to load receiving history: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async refreshReceivingHistory() {
            await this.loadReceivingHistory();
            window.showToast?.('Receiving history refreshed');
        },

        applyFilters() {
            let filtered = [...this.receivings];

            if (this.filters.ponumber.trim()) {
                const search = this.filters.ponumber.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.ponumber || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.supplier.trim()) {
                const search = this.filters.supplier.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.supplier || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.dateFrom) {
                const fromDate = new Date(this.filters.dateFrom);
                filtered = filtered.filter(r => new Date(r.date) >= fromDate);
            }

            if (this.filters.dateTo) {
                const toDate = new Date(this.filters.dateTo + 'T23:59:59');
                filtered = filtered.filter(r => new Date(r.date) <= toDate);
            }

            // Sort by date descending
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

            this.filteredReceivings = filtered;
        },

        viewReceivingDetails(receiving) {
            this.selectedReceiving = receiving;
            this.showDetailsModal = true;
        },

        closeDetailsModal() {
            this.showDetailsModal = false;
            this.selectedReceiving = null;
        },

        getReceivingItems(receiving) {
            try {
                return typeof receiving.items === 'string' ? JSON.parse(receiving.items) : receiving.items || [];
            } catch (e) {
                return [];
            }
        },

        getItemCount(items) {
            try {
                const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
                return Array.isArray(parsedItems) ? parsedItems.length : 0;
            } catch (e) {
                return 0;
            }
        },

        formatDate(date) {
            if (!date) return '';
            return new Date(date).toLocaleDateString('id-ID');
        }
    }));
};

// Register all components
if (window.Alpine) {
    registerSparepartManager();
    registerPosManager();
    registerPosTransactions();
    registerPosReports();
    registerPurchaseOrders();
    registerReceivingHistory();
} else {
    document.addEventListener('alpine:init', () => {
        registerSparepartManager();
        registerPosManager();
        registerPosTransactions();
        registerPosReports();
        registerPurchaseOrders();
        registerReceivingHistory();
    });
}
