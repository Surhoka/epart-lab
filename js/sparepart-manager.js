/**
 * @fileoverview Frontend logic for Sparepart Management with POS Integration
 * Manages state for Inventory, Dashboard, POS Cashier, Transactions, and Reports views.
 */

const registerSparepartManager = () => {
    window.Alpine.data('sparepartManager', () => ({
        dbId: null,
        spareparts: [],
        isLoading: false,
        isUploading: false,
        isGeneratingImage: false,
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
        aiRules: [],

        async init() {
            console.log('Sparepart Manager Initialized');
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }
            await this.fetchSpareparts();
            await this.fetchAiRules();
        },

        async fetchAiRules() {
            window.sendDataToGoogle('getAiRules', {}, (res) => {
                if (res.status === 'success') {
                    this.aiRules = res.data;
                }
            });
        },

        async fetchSpareparts() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSpareparts', { dbId: this.dbId }, (res) => {
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
                imageurl: '',
                aiPrompt: ''
            };
            this.showModal = true;
        },

        editSparepart(item) {
            this.isEditing = true;
            this.editingItem = { ...item, aiPrompt: '' };
            this.showModal = true;
        },

        async saveSparepart() {
            const btn = document.getElementById('save-sparepart-btn');
            window.setButtonLoading?.(btn, true);

            try {
                // --- AUTO GENERATE IMAGE LOGIC ---
                if (!this.editingItem.imageurl) {
                    const imgTemplate = this.aiRules.find(r => r.active && r.category === 'Image Template');
                    if (imgTemplate) {
                        try {
                            window.showToast?.('Deteksi template otomatis, men-generate gambar...', 'info');
                            // Temporarily set a specific prompt if template exists
                            const originalAiPrompt = this.editingItem.aiPrompt;
                            this.editingItem.aiPrompt = `${imgTemplate.prompt} for ${this.editingItem.name}`;
                            await this.generateImageFromAi();
                            this.editingItem.aiPrompt = originalAiPrompt; // Restore
                        } catch (e) {
                            console.warn("Auto-image generation failed:", e);
                        }
                    }
                }

                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('saveSparepart', { ...this.editingItem, dbId: this.dbId }, (res) => {
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
                    window.sendDataToGoogle('deleteSparepart', { id, dbId: this.dbId }, (res) => {
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
                    window.sendDataToGoogle('adjustStock', { id, amount, dbId: this.dbId }, (res) => {
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

        async generateImageFromAi() {
            if (!this.editingItem.name) {
                window.showToast?.('Mohon isi nama barang terlebih dahulu sebagai referensi AI.', 'warning');
                return;
            }

            this.isGeneratingImage = true;
            const userPrompt = this.editingItem.aiPrompt || `Sparepart: ${this.editingItem.name}${this.editingItem.category ? ', Category: ' + this.editingItem.category : ''}`;

            try {
                // 1. Optimize Prompt via Gemini (Backend)
                window.showToast?.('Sedang mengoptimasi prompt dengan Gemini...', 'info');
                let optimizedPrompt = userPrompt;

                try {
                    const optRes = await new Promise((resolve, reject) => {
                        window.sendDataToGoogle('optimizeAiPrompt', {
                            prompt: userPrompt,
                            dbId: this.dbId
                        }, (res) => {
                            if (res.status === 'success') resolve(res.optimizedPrompt);
                            else reject(res.message);
                        }, (err) => reject(err));
                    });
                    optimizedPrompt = optRes;
                    console.log('[AI] Optimized Prompt:', optimizedPrompt);
                } catch (optErr) {
                    console.warn('[AI] Optimization failed, using raw prompt:', optErr);
                    // Fallback to raw prompt if Gemini fails (e.g. Quota 429)
                    window.showToast?.('AI sedang sibuk, menggunakan deskripsi asli...', 'warning');
                }

                // 2. Fetch Image directly from Browser (Frontend)
                const encodedPrompt = encodeURIComponent(optimizedPrompt);
                const seed = Math.floor(Math.random() * 1000000);

                // Providers List
                const providers = [
                    { name: 'Pollinations', url: `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&nofeed=true` },
                    { name: 'Hercai', url: `https://hercai.onrender.com/v3/text2image?prompt=${encodedPrompt}` }
                ];

                let blob = null;
                let successProvider = '';

                for (const provider of providers) {
                    try {
                        window.showToast?.(`Mencoba AI ${provider.name}...`, 'info');
                        const response = await fetch(provider.url);
                        if (!response.ok) throw new Error(`Provider ${provider.name} error: ${response.status}`);

                        const tempBlob = await response.blob();
                        // Hercai returns JSON usually, Pollinations returns Image. 
                        // Logic for Hercai might need adjustment if it returns URL.
                        if (provider.name === 'Hercai') {
                            const text = await tempBlob.text();
                            const json = JSON.parse(text);
                            if (json.url) {
                                const imgRes = await fetch(json.url);
                                blob = await imgRes.blob();
                            }
                        } else {
                            if (!tempBlob.type.startsWith('image/')) continue;
                            blob = tempBlob;
                        }

                        if (blob) {
                            successProvider = provider.name;
                            break;
                        }
                    } catch (err) {
                        console.warn(`[AI] Provider ${provider.name} failed:`, err);
                    }
                }

                if (!blob) throw new Error('Semua layanan AI sedang sibuk. Silakan coba lagi nanti.');
                window.showToast?.(`Gambar berhasil di-generate menggunakan ${successProvider}`, 'success');

                // 3. Convert Blob to Base64
                const base64Data = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });

                // 4. Save to Drive (Backend)
                window.showToast?.('Sedang menyimpan gambar ke Google Drive...', 'info');
                const fileName = `ai_sparepart_${this.editingItem.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;

                const uploadRes = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('uploadImageAndGetUrl', {
                        fileName: fileName,
                        fileData: base64Data, // Data URL is fine, Admin-Code.gs strips prefix
                        fileType: blob.type,
                        folderName: 'Spareparts',
                        dbId: this.dbId
                    }, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.editingItem.imageurl = uploadRes.url;
                window.showToast?.('Gambar AI berhasil dibuat dan disimpan!', 'success');
            } catch (err) {
                console.error('Frontend AI Generation failed:', err);
                window.showToast?.('Gagal generate gambar: ' + err, 'error');
            } finally {
                this.isGeneratingImage = false;
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
        dbId: null,
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
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }
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
                    window.sendDataToGoogle('getSpareparts', { dbId: this.dbId }, (res) => {
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
                    dbId: this.dbId,
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
            const now = new Date();
            const transaction = this.lastTransaction;

            const data = {
                storeName: 'SPAREPART STORE',
                headerInfo: {
                    'Transaction': transaction.transactionNumber,
                    'Date': now.toLocaleString(),
                    'Cashier': this.getCurrentUser()
                },
                items: this.cart.items.map(item => ({
                    name: item.name,
                    qty: item.quantity,
                    price: this.formatPrice(item.price),
                    total: this.formatPrice(item.quantity * item.price)
                })),
                totals: {
                    'Subtotal': this.formatPrice(this.cart.subtotal),
                    'Tax': this.formatPrice(this.cart.tax),
                    'Total': this.formatPrice(transaction.total),
                    [`Payment (${this.paymentMethod})`]: this.formatPrice(this.paymentAmount)
                },
                footer: [
                    'Thank you for your purchase!',
                    'Please keep this receipt for your records'
                ]
            };

            if (transaction.change > 0) {
                data.totals['Change'] = this.formatPrice(transaction.change);
            }

            if (window.PrintService) {
                window.PrintService.print(data, {
                    title: `Receipt - ${transaction.transactionNumber}`,
                    paperSize: '58mm'
                });
            } else {
                console.error('PrintService not found');
                window.showToast?.('Print Service not available', 'error');
            }
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
        dbId: null,
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
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }

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
                    window.sendDataToGoogle('getTransactions', { ...this.filters, dbId: this.dbId }, (res) => {
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
                        transactionId: transaction.transactionid,
                        dbId: this.dbId
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
            const items = this.getTransactionItems(transaction);

            const data = {
                storeName: 'SPAREPART STORE',
                headerInfo: {
                    'Transaction': transaction.transactionnumber,
                    'Date': this.formatDateTime(transaction.date),
                    'Cashier': transaction.cashier || 'System'
                },
                items: items.map(item => ({
                    name: item.name,
                    qty: item.quantity,
                    price: this.formatPrice(item.price),
                    total: this.formatPrice(item.quantity * item.price)
                })),
                totals: {
                    'Subtotal': this.formatPrice(transaction.subtotal),
                    'Tax': this.formatPrice(transaction.tax),
                },
                footer: [
                    'Thank you for your purchase!',
                    'Please keep this receipt for your records'
                ]
            };

            if (transaction.customername) {
                data.headerInfo['Customer'] = transaction.customername;
            }

            if (transaction.discount > 0) {
                data.totals['Discount'] = '-' + this.formatPrice(transaction.discount);
            }

            data.totals['Total'] = this.formatPrice(transaction.total);
            data.totals[`Payment (${transaction.paymentmethod})`] = this.formatPrice(transaction.paymentamount);

            if (transaction.change > 0) {
                data.totals['Change'] = this.formatPrice(transaction.change);
            }

            if (transaction.status === 'voided') {
                data.footer.push('*** VOIDED TRANSACTION ***');
            }

            if (window.PrintService) {
                window.PrintService.print(data, {
                    title: `Receipt - ${transaction.transactionnumber}`,
                    paperSize: '58mm'
                });
            } else {
                console.error('PrintService not found');
                window.showToast?.('Print Service not available', 'error');
            }
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
        dbId: null,
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
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }

            // Set default date range (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

            this.dateRange.to = today.toISOString().split('T')[0];
            this.dateRange.from = thirtyDaysAgo.toISOString().split('T')[0];

            await this.loadReports();

            this.$nextTick(() => {
                this.initDatePicker();
            });
        },

        initDatePicker() {
            if (typeof flatpickr !== 'undefined') {
                flatpickr(".datepicker", {
                    mode: "range",
                    static: true,
                    monthSelectorType: "static",
                    dateFormat: "M j, Y",
                    defaultDate: [this.dateRange.from, this.dateRange.to],
                    prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8L1.4 6.8 5.4 2.8 6.8 4.2 4.2 6.8 6.8 9.4z" /></svg>',
                    nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L5.4 6.8 1.4 2.8 0 4.2 2.6 6.8 0 9.4z" /></svg>',
                    onChange: (selectedDates, dateStr, instance) => {
                        if (selectedDates.length === 2) {
                            const format = (d) => {
                                const offset = d.getTimezoneOffset();
                                const local = new Date(d.getTime() - (offset * 60 * 1000));
                                return local.toISOString().split('T')[0];
                            };
                            this.dateRange.from = format(selectedDates[0]);
                            this.dateRange.to = format(selectedDates[1]);
                            this.loadReports();
                        }
                    }
                });
            }
        },

        async loadReports() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSalesReport', {
                        dbId: this.dbId,
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
        dbId: null,
        // Tab Management
        activeTab: 'list',

        // Data Management
        purchaseOrders: [],
        filteredPurchaseOrders: [],
        purchaseOrders: [],
        filteredPurchaseOrders: [],
        masterParts: [],
        masterPartsMap: new Map(),
        suppliers: [], // New
        isLoading: false,

        // Filters
        filters: {
            ponumber: '',
            status: '',
            supplier: '',
            dateFrom: '',
            dateTo: ''
        },

        // Modal Management
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

        async init() {
            console.log('Purchase Orders Initialized');
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }
            await this.loadPurchaseOrders();
            this.loadMasterParts();
            this.loadSuppliers();

            this.$nextTick(() => {
                this.initDatePicker();
            });
        },

        initDatePicker() {
            if (typeof flatpickr !== 'undefined') {
                flatpickr(".po-datepicker", {
                    mode: "range",
                    static: true,
                    monthSelectorType: "static",
                    dateFormat: "M j, Y",
                    prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8L1.4 6.8 5.4 2.8 6.8 4.2 4.2 6.8 6.8 9.4z" /></svg>',
                    nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L5.4 6.8 1.4 2.8 0 4.2 2.6 6.8 0 9.4z" /></svg>',
                    onChange: (selectedDates, dateStr, instance) => {
                        if (selectedDates.length === 2) {
                            const format = (d) => {
                                const offset = d.getTimezoneOffset();
                                const local = new Date(d.getTime() - (offset * 60 * 1000));
                                return local.toISOString().split('T')[0];
                            };
                            this.filters.dateFrom = format(selectedDates[0]);
                            this.filters.dateTo = format(selectedDates[1]);
                            this.applyFilters();
                        } else if (selectedDates.length === 0) {
                            this.filters.dateFrom = '';
                            this.filters.dateTo = '';
                            this.applyFilters();
                        }
                    }
                });
            }
        },

        async loadSuppliers() {
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSuppliers', { dbId: this.dbId }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });
                this.suppliers = (response || []).filter(s => s.status === 'Active');
            } catch (err) {
                console.error('Failed to load suppliers for PO:', err);
            }
        },

        selectSupplier(supplier) {
            this.editingPO.supplier = supplier.company || supplier.name;
            this.editingPO.supplieremail = supplier.email || '';
        },

        async loadPurchaseOrders() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getPurchaseOrders', { dbId: this.dbId }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.purchaseOrders = (response || []).map(po => {
                    // Pre-calculate timestamp for faster filtering and sorting
                    po._timestamp = po.date ? new Date(po.date).getTime() : 0;
                    return po;
                });
                this.applyFilters();

            } catch (err) {
                console.error('Failed to load purchase orders:', err);
                window.showToast?.('Failed to load purchase orders: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async loadMasterParts() {
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getMasterParts', { dbId: this.dbId }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });
                this.masterParts = response || [];

                // Populate Map for O(1) lookup
                this.masterPartsMap.clear();
                this.masterParts.forEach(part => {
                    if (part.partnumber) {
                        this.masterPartsMap.set(String(part.partnumber).toLowerCase(), part);
                    }
                });
            } catch (err) {
                console.error('Failed to load master parts:', err);
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

            if (this.filters.ponumber.trim()) {
                const search = this.filters.ponumber.toLowerCase();
                filtered = filtered.filter(po =>
                    (po.ponumber || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.supplier.trim()) {
                const search = this.filters.supplier.toLowerCase();
                filtered = filtered.filter(po =>
                    (po.supplier || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.dateFrom || this.filters.dateTo) {
                const fromTime = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : null;
                const toTime = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59').getTime() : null;

                filtered = filtered.filter(po => {
                    const poTime = po._timestamp;
                    if (fromTime && poTime < fromTime) return false;
                    if (toTime && poTime > toTime) return false;
                    return true;
                });
            }

            // Sort by pre-calculated timestamp for efficiency
            filtered.sort((a, b) => b._timestamp - a._timestamp);

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
                supplieremail: po.supplieremail || '',
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
                supplieremail: '',
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

        getPartSuggestions(query) {
            if (!query || query.length < 1) return [];

            const lowerQuery = query.toLowerCase();
            const matches = [];

            // Optimize: simple loop with break for performance
            for (let i = 0; i < this.masterParts.length; i++) {
                const part = this.masterParts[i];
                const pNum = String(part.partnumber || '').toLowerCase();
                const pName = String(part.name || '').toLowerCase();

                if (pNum.includes(lowerQuery) || pName.includes(lowerQuery)) {
                    matches.push(part);
                    if (matches.length >= 20) break; // Limit to 20 suggestions
                }
            }
            return matches;
        },

        lookupPart(index) {
            const item = this.editingPO.items[index];
            if (!item.partnumber) return;

            // Use Map for O(1) lookup instead of find()
            const part = this.masterPartsMap.get(String(item.partnumber).toLowerCase());

            if (part) {
                item.name = this.toTitleCase(part.name || '');
                item.unitprice = Number(part.purchaseprice) || Number(part.sellingprice) || 0;
                this.calculatePOTotals();
            }
        },

        toTitleCase(str) {
            return str.replace(
                /\w\S*/g,
                text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
            );
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

        async createPO(closeAfterSave = true) {
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
            await this.savePO('btn-save-po', closeAfterSave);
        },

        async updatePO(closeAfterSave = true) {
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

            await this.savePO('btn-save-po', closeAfterSave);
        },

        async savePO(buttonId = null, closeAfterSave = true) {
            try {
                if (buttonId && window.setButtonLoadingById) {
                    window.setButtonLoadingById(buttonId, true);
                }

                this.calculatePOTotals();

                const poData = { ...JSON.parse(JSON.stringify(this.editingPO)), dbId: this.dbId };
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('savePurchaseOrder', poData, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                // Update local state with returned data (important for new POs to become updates)
                if (response.data) {
                    this.editingPO.id = response.data.id;
                    this.editingPO.ponumber = response.data.ponumber;
                }

                if (buttonId && window.setButtonSuccessById) {
                    window.setButtonSuccessById(buttonId, { closeModal: false, message: 'Saved!' });
                } else {
                    window.showToast?.(response.message, 'success');
                }

                if (closeAfterSave) {
                    this.resetPOForm();
                    this.activeTab = 'list';
                }
                await this.loadPurchaseOrders();

            } catch (err) {
                if (buttonId && window.setButtonLoadingById) {
                    window.setButtonLoadingById(buttonId, false);
                }
                console.error('Failed to save purchase order:', err);
                window.showToast?.('Failed to save purchase order: ' + err, 'error');
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

        printPurchaseOrder(po) {
            if (!po) return;
            if (window.PrintService) {
                window.PrintService.printDocument('purchase-order', po);
            } else {
                console.error('PrintService not found');
                window.showToast?.('Print Service not available', 'error');
            }
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

        toTitleCase(str) {
            if (!str) return '';
            return str.toLowerCase().split(' ').map(word => {
                const w = word.trim();
                if (!w) return '';
                return w.charAt(0).toUpperCase() + w.slice(1);
            }).join(' ');
        },

        async deletePO(po) {
            if (!confirm(`Are you sure you want to delete PO ${po.ponumber}?`)) return;

            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('deletePurchaseOrder', { id: po.id, dbId: this.dbId }, (res) => {
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
            let email = po.supplieremail;

            if (!email) {
                email = prompt("Enter Supplier Email:", "");
                if (email === null) return; // Cancelled
            }

            if (!email.trim()) {
                window.showToast?.('Email is required', 'error');
                return;
            }

            if (!confirm(`Send PO ${po.ponumber} to ${email}? This will lock the PO.`)) return;

            try {
                window.showToast?.('Sending email...', 'info');
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('sendPOToSupplier', {
                        dbId: this.dbId,
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
        dbId: null,
        activeTab: 'history',
        // Data Management
        receivings: [],
        filteredReceivings: [],
        pendingPOs: [],
        isLoading: false,
        searchPO: '',

        // Processing Form
        processingPO: null,
        receivingForm: {
            date: new Date().toISOString().split('T')[0],
            discount: 0,
            discountType: 'fixed',
            items: [],
            notes: ''
        },

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
            try {
                const config = JSON.parse(localStorage.getItem('EzypartsConfig') || '{}');
                this.dbId = config.sheetId;
                if (!this.dbId) {
                    console.error('Database ID (sheetId) not found in EzypartsConfig.');
                    window.showToast?.('Database configuration is missing. Please re-setup.', 'error');
                }
            } catch (e) {
                console.error('Failed to parse EzypartsConfig', e);
            }
            await this.loadReceivingHistory();
            await this.loadPendingPOs();

            this.$nextTick(() => {
                this.initDatePicker();
            });
        },

        initDatePicker() {
            if (typeof flatpickr !== 'undefined') {
                flatpickr(".receiving-datepicker", {
                    mode: "range",
                    static: true,
                    monthSelectorType: "static",
                    dateFormat: "M j, Y",
                    prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8L1.4 6.8 5.4 2.8 6.8 4.2 4.2 6.8 6.8 9.4z" /></svg>',
                    nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L5.4 6.8 1.4 2.8 0 4.2 2.6 6.8 0 9.4z" /></svg>',
                    onChange: (selectedDates, dateStr, instance) => {
                        if (selectedDates.length === 2) {
                            const format = (d) => {
                                const offset = d.getTimezoneOffset();
                                const local = new Date(d.getTime() - (offset * 60 * 1000));
                                return local.toISOString().split('T')[0];
                            };
                            this.filters.dateFrom = format(selectedDates[0]);
                            this.filters.dateTo = format(selectedDates[1]);
                            this.applyFilters();
                        } else if (selectedDates.length === 0) {
                            this.filters.dateFrom = '';
                            this.filters.dateTo = '';
                            this.applyFilters();
                        }
                    }
                });
            }
        },

        async loadReceivingHistory() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getReceivingHistory', { dbId: this.dbId }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                this.receivings = (response || []).map(r => {
                    r._timestamp = r.date ? new Date(r.date).getTime() : 0;
                    return r;
                });
                this.applyFilters();

            } catch (err) {
                console.error('Failed to load receiving history:', err);
                window.showToast?.('Failed to load receiving history: ' + err, 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async loadPendingPOs() {
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getPurchaseOrders', { dbId: this.dbId }, (res) => {
                        if (res.status === 'success') resolve(res.data);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                // Filter POs that are ready to be received
                this.pendingPOs = (response || []).filter(po =>
                    po.status === 'sent' || po.status === 'confirmed' || po.status === 'partial'
                );
            } catch (err) {
                console.error('Failed to load pending POs:', err);
            }
        },

        async refreshReceivingHistory() {
            await this.loadReceivingHistory();
            await this.loadPendingPOs();
            window.showToast?.('Receiving history refreshed');
        },

        applyFilters() {
            let filtered = [...this.receivings];

            if (this.filters.ponumber.trim()) {
                const search = this.filters.ponumber.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.poNumber || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.supplier.trim()) {
                const search = this.filters.supplier.toLowerCase();
                filtered = filtered.filter(r =>
                    (r.supplier || '').toLowerCase().includes(search)
                );
            }

            if (this.filters.dateFrom || this.filters.dateTo) {
                const fromTime = this.filters.dateFrom ? new Date(this.filters.dateFrom).getTime() : null;
                const toTime = this.filters.dateTo ? new Date(this.filters.dateTo + 'T23:59:59').getTime() : null;

                filtered = filtered.filter(r => {
                    const rTime = r._timestamp;
                    if (fromTime && rTime < fromTime) return false;
                    if (toTime && rTime > toTime) return false;
                    return true;
                });
            }

            // Sort by pre-calculated timestamp
            filtered.sort((a, b) => b._timestamp - a._timestamp);

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
        },

        formatPrice(price) {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
            }).format(price || 0);
        },

        getCurrentUser() {
            try {
                const user = JSON.parse(localStorage.getItem('signedInUser') || '{}');
                return user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'System';
            } catch (e) {
                return 'System';
            }
        },

        // New Methods for Processing Tab
        get filteredPendingPOs() {
            if (!this.searchPO) return this.pendingPOs;
            const q = this.searchPO.toLowerCase();
            return this.pendingPOs.filter(po =>
                (po.ponumber || '').toLowerCase().includes(q) ||
                (po.supplier || '').toLowerCase().includes(q)
            );
        },

        selectPOForProcessing(po) {
            this.processingPO = po;
            let poItems = [];
            try {
                poItems = typeof po.items === 'string' ? JSON.parse(po.items) : po.items || [];
            } catch (e) { poItems = []; }

            this.receivingForm = {
                date: new Date().toISOString().split('T')[0],
                discount: 0,
                discountType: 'fixed',
                items: poItems.map(item => ({
                    ...item,
                    orderedqty: item.quantity,
                    receivedqty: item.receivedqty || 0,
                    receivingnow: 0
                })),
                notes: ''
            };
        },

        calculateProcessingTotal() {
            const subtotal = this.receivingForm.items.reduce((sum, item) => sum + (Number(item.receivingnow || 0) * Number(item.unitprice || 0)), 0);
            let discount = Number(this.receivingForm.discount) || 0;

            if (this.receivingForm.discountType === 'percent') {
                discount = (subtotal * discount) / 100;
            }

            return subtotal - discount;
        },

        async submitProcessing() {
            if (!this.processingPO) return;

            const btn = document.getElementById('confirm-receiving-btn');
            window.setButtonLoading?.(btn, true);

            try {
                const receivingData = {
                    dbId: this.dbId,
                    poid: this.processingPO.id,
                    ponumber: this.processingPO.ponumber,
                    supplier: this.processingPO.supplier,
                    date: this.receivingForm.date,
                    items: this.receivingForm.items.filter(item => item.receivingnow > 0),
                    subtotal: this.receivingForm.items.reduce((sum, item) => sum + (item.receivingnow * item.unitprice), 0),
                    discount: Number(this.receivingForm.discount) || 0,
                    discountType: this.receivingForm.discountType,
                    total: this.calculateProcessingTotal(),
                    notes: this.receivingForm.notes,
                    receivedby: this.getCurrentUser()
                };

                if (receivingData.items.length === 0) {
                    window.showToast?.('Please enter received quantity for at least one item', 'error');
                    window.setButtonLoading?.(btn, false);
                    return;
                }

                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('processReceiving', receivingData, (res) => {
                        if (res.status === 'success') resolve(res);
                        else reject(res.message);
                    }, (err) => reject(err));
                });

                window.showToast?.(response.message, 'success');
                this.processingPO = null;
                await this.refreshReceivingHistory();
                this.activeTab = 'history';

            } catch (err) {
                console.error('Failed to process receiving:', err);
                window.showToast?.('Failed to process receiving: ' + err, 'error');
            } finally {
                window.setButtonLoading?.(btn, false);
            }
        },

        printReceivingReceipt(receiving) {
            if (!receiving) return;
            if (window.PrintService) {
                window.PrintService.printDocument('receiving', receiving);
            } else {
                // Fallback or Error
                console.error("PrintService not found");
            }
        },

        toTitleCase(str) {
            if (!str) return '';
            return str.toLowerCase().split(' ').map(word => {
                const w = word.trim();
                if (!w) return '';
                return w.charAt(0).toUpperCase() + w.slice(1);
            }).join(' ');
        },

        calculateLineUnitPriceAfterDiscount(item, receiving) {
            const unitPrice = Number(item.unitprice || 0);
            const subtotal = Number(receiving.subtotal || 0);
            const discount = Number(receiving.discount || 0);
            const discountType = (receiving.discountType || receiving.discounttype || 'fixed').toLowerCase();

            if (subtotal === 0) return unitPrice;

            let totalEffectiveDiscount = discount;
            if (discountType === 'percent') {
                totalEffectiveDiscount = (subtotal * discount) / 100;
            }

            // Proportional discount allocation
            const portion = unitPrice / subtotal;
            const lineDiscountPerUnit = totalEffectiveDiscount * portion;
            return Math.max(0, unitPrice - lineDiscountPerUnit);
        },

        calculateLineTotal(item, receiving) {
            const qty = Number(item.receivingnow || 0);
            const priceAfter = this.calculateLineUnitPriceAfterDiscount(item, receiving);
            return qty * priceAfter;
        },

        calculateLineDiscountPercent(item, receiving) {
            if (!item || !receiving) return '-';
            const unitPrice = Number(item.unitprice || 0);
            const priceAfter = this.calculateLineUnitPriceAfterDiscount(item, receiving);

            if (unitPrice === 0 || priceAfter >= unitPrice) return '0%';

            const discountAmount = unitPrice - priceAfter;
            const percent = (discountAmount / unitPrice) * 100;

            if (percent < 0.01) return percent.toFixed(4) + '%';
            if (percent < 0.1) return percent.toFixed(3) + '%';
            return (Number.isInteger(percent) ? percent : percent.toFixed(1)) + '%';
        }
        ,

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
            return labels[status] || status || 'Unknown';
        }
    }));
};

/**
 * Supplier Manager Component
 */
const registerSupplierManager = () => {
    Alpine.data('supplierManager', () => ({
        suppliers: [],
        filteredSuppliers: [],
        isLoading: false,
        search: '',

        // Modal & Form
        showModal: false,
        isEditing: false,
        editingSupplier: {
            id: '',
            name: '',
            company: '',
            phone: '',
            email: '',
            address: '',
            status: 'Active'
        },

        async init() {
            await this.fetchSuppliers();
        },

        async fetchSuppliers() {
            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('getSuppliers', {}, resolve, reject);
                });

                if (response.status === 'success') {
                    this.suppliers = response.data;
                    this.applyFilters();
                } else {
                    window.showToast?.(response.message || 'Gagal memuat supplier', 'error');
                }
            } catch (error) {
                console.error('Fetch suppliers error:', error);
                window.showToast?.('Terjadi kesalahan koneksi', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        applyFilters() {
            const search = this.search.toLowerCase();
            this.filteredSuppliers = this.suppliers.filter(s =>
                (s.name || '').toLowerCase().includes(search) ||
                (s.company || '').toLowerCase().includes(search) ||
                (s.email || '').toLowerCase().includes(search) ||
                (s.phone || '').toLowerCase().includes(search)
            );
        },

        openAddModal() {
            this.isEditing = false;
            this.editingSupplier = {
                id: '',
                name: '',
                company: '',
                phone: '',
                email: '',
                address: '',
                status: 'Active'
            };
            this.showModal = true;
        },

        editSupplier(supplier) {
            this.isEditing = true;
            this.editingSupplier = { ...supplier };
            this.showModal = true;
        },

        async saveSupplier() {
            if (!this.editingSupplier.name || !this.editingSupplier.company) {
                window.showToast?.('Nama dan Perusahaan wajib diisi', 'warning');
                return;
            }

            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('saveSupplier', this.editingSupplier, resolve, reject);
                });

                if (response.status === 'success') {
                    window.showToast?.(response.message, 'success');
                    this.showModal = false;
                    await this.fetchSuppliers();
                } else {
                    window.showToast?.(response.message, 'error');
                }
            } catch (error) {
                console.error('Save supplier error:', error);
                window.showToast?.('Terjadi kesalahan sistem', 'error');
            } finally {
                this.isLoading = false;
            }
        },

        async deleteSupplier(supplier) {
            if (!confirm(`Hapus supplier ${supplier.name}?`)) return;

            this.isLoading = true;
            try {
                const response = await new Promise((resolve, reject) => {
                    window.sendDataToGoogle('deleteSupplier', { id: supplier.id }, resolve, reject);
                });

                if (response.status === 'success') {
                    window.showToast?.(response.message, 'success');
                    await this.fetchSuppliers();
                } else {
                    window.showToast?.(response.message, 'error');
                }
            } catch (error) {
                console.error('Delete supplier error:', error);
                window.showToast?.('Gagal menghapus supplier', 'error');
            } finally {
                this.isLoading = false;
            }
        }
    }));
};

// Register all components
if (window.Alpine) {
    registerSparepartManager();
    registerSupplierManager();
    registerPosManager();
    registerPosTransactions();
    registerPosReports();
    registerPurchaseOrders();
    registerReceivingHistory();
} else {
    document.addEventListener('alpine:init', () => {
        registerSparepartManager();
        registerSupplierManager();
        registerPosManager();
        registerPosTransactions();
        registerPosReports();
        registerPurchaseOrders();
        registerReceivingHistory();
    });
}
