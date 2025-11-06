/**
 * =================================================================
 *            FILE PENGELOLAAN PRODUK (INVENTORY)
 * =================================================================
 * 
 * CATATAN PENTING:
 * 1. Pastikan ID Google Sheet sudah benar di file `Code.gs` pada objek CONFIG.
 * 2. Pastikan nama sheet untuk produk (default: "Produk") sudah benar di `Code.gs`.
 * 3. Pastikan header kolom di sheet "DaftarProduk" adalah:
 *  No | SKU | NamaProduk | Kategori | Merek | HargaJual | Stok
 *
 * FUNGSI UTAMA:
 * - getProducts: Mengambil semua data produk dari Google Sheet.
 * - addProduct: Menambahkan produk baru ke Google Sheet.
 * - updateProduct: Memperbarui data produk di Google Sheet berdasarkan SKU.
 * - deleteProduct: Menghapus produk dari Google Sheet berdasarkan SKU.
 * 
 * PENGGUNAAN:
 * Fungsi-fungsi ini akan dipanggil dari file JavaScript sisi klien 
 * (inventory-daftar-produk.js) menggunakan `google.script.run`.
 */

/**
 * Mengambil semua data produk dari Google Sheet.
 * @returns {Array<Object>} Array berisi objek-objek produk.
 */
function getProducts() {
  const cache = CacheService.getScriptCache();
  const cacheKey = "allProducts";
  let cachedProducts = cache.get(cacheKey);

  if (cachedProducts != null) {
    console.log("Returning products from cache.");
    return JSON.parse(cachedProducts);
  }

  try {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.daftarprodukSheetName);
    // Mulai dari baris ke-2 untuk melewati header, ambil semua data sampai baris terakhir.
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    const products = data.map(row => ({
      no: row[0],
      sku: row[1],
      name: row[2],
      category: row[3],
      brand: row[4],
      price: row[5],
      stock: row[6]
    }));
    
    // Simpan data ke cache selama 5 menit (300 detik)
    cache.put(cacheKey, JSON.stringify(products), 300);
    console.log("Fetched products from sheet and cached them.");
    return products;
  } catch (e) {
    console.error("Error in getProducts: " + e.toString());
    return []; // Kembalikan array kosong jika terjadi error
  }
}

/**
 * Memuat ulang dan menyimpan semua data produk ke cache.
 * Digunakan setelah operasi tulis (tambah, edit, hapus) untuk memastikan cache selalu segar.
 */
function refreshProductsCache() {
  const cache = CacheService.getScriptCache();
  const cacheKey = "allProducts";
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.daftarprodukSheetName);
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    
    const products = data.map(row => ({
      no: row[0],
      sku: row[1],
      name: row[2],
      category: row[3],
      brand: row[4],
      price: row[5],
      stock: row[6]
    }));
    
    cache.put(cacheKey, JSON.stringify(products), 300);
    console.log("Products cache refreshed.");
  } catch (e) {
    console.error("Error refreshing products cache: " + e.toString());
  }
}

/**
 * Mencari produk berdasarkan istilah pencarian di SKU, Nama Produk, atau Merek.
 * @param {string} searchTerm Istilah pencarian.
 * @returns {Array<Object>} Array berisi objek-objek produk yang cocok.
 */
function searchProducts(searchTerm) {
  try {
    const allProducts = getProducts(); // Menggunakan fungsi getProducts yang sudah ada (dengan cache)
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredProducts = allProducts.filter(product => {
      return (
        (product.sku && product.sku.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.name && product.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.brand && product.brand.toLowerCase().includes(lowerCaseSearchTerm))
      );
    });
    return filteredProducts;
  } catch (e) {
    console.error("Error in searchProducts: " + e.toString());
    return [];
  }
}

/**
 * Menambahkan satu produk baru ke Google Sheet.
 * @param {Object} productData Objek berisi data produk baru.
 * @returns {Object} Objek berisi status dan pesan.
 */
function addProduct(productData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.daftarprodukSheetName);
    const newRow = [
      sheet.getLastRow(), // Nomor baris
      productData.sku || "SKU-OTOMATIS-" + new Date().getTime(),
      productData.name,
      productData.category || "Uncategorized",
      productData.brand || "N/A",
      productData.price,
      productData.stock
    ];
    sheet.appendRow(newRow);
    refreshProductsCache(); // Refresh cache after modification
    return { status: "success", message: "Produk berhasil ditambahkan." };
  } catch (e) {
    console.error("Error in addProduct: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

/**
 * Memperbarui data produk berdasarkan SKU.
 * @param {Object} productData Objek berisi data produk yang akan diperbarui.
 * @returns {Object} Objek berisi status dan pesan.
 */
function updateProduct(productData) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.daftarprodukSheetName);
    const skus = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat();
    const rowIndex = skus.indexOf(productData.sku);

    if (rowIndex === -1) {
      return { status: "error", message: "Produk dengan SKU tersebut tidak ditemukan." };
    }

    // Index di array adalah 0-based, baris di sheet adalah 1-based + 1 (untuk header)
    const targetRow = rowIndex + 2; 
    sheet.getRange(targetRow, 3, 1, 5).setValues([[
      productData.name,
      productData.category,
      productData.brand,
      productData.price,
      productData.stock
    ]]);
    refreshProductsCache(); // Refresh cache after modification
    return { status: "success", message: "Produk berhasil diperbarui." };
  } catch (e) {
    console.error("Error in updateProduct: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}

/**
 * Menghapus produk berdasarkan SKU.
 * @param {string} sku SKU produk yang akan dihapus.
 * @returns {Object} Objek berisi status dan pesan.
 */
function deleteProduct(sku) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.daftarprodukSheetName);
    const skus = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat();
    const rowIndex = skus.indexOf(sku);

    if (rowIndex === -1) {
      return { status: "error", message: "Produk dengan SKU tersebut tidak ditemukan." };
    }

    // Index di array adalah 0-based, baris di sheet adalah 1-based + 1 (untuk header)
    const targetRow = rowIndex + 2;
    sheet.deleteRow(targetRow);
    refreshProductsCache(); // Refresh cache after modification
    return { status: "success", message: "Produk berhasil dihapus." };
  } catch (e) {
    console.error("Error in deleteProduct: " + e.toString());
    return { status: "error", message: e.toString() };
  }
}
