/**
 * @fileoverview Frontend logic for Sparepart Management.
 * Manages state for Inventory and Dashboard views.
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
                            imageData: base64Data,
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

if (window.Alpine) {
    registerSparepartManager();
} else {
    document.addEventListener('alpine:init', registerSparepartManager);
}
