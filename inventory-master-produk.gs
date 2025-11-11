const SPREADSHEET_ID = '1Bz0xMDBBiBxibMdNWMNt2bggUJOwzSOawH727hhnY7g';
const SHEET_NAME = 'MasterProduk';

function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let result;

  try {
    switch (action) {
      case 'getProducts':
        result = getProducts();
        break;
      case 'getProduct':
        const productId = e.parameter.id;
        result = getProductById(productId);
        break;
      default:
        result = { status: 'error', message: 'Invalid action for GET request.' };
    }
  } catch (error) {
    result = { status: 'error', message: error.message };
  }

  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;
  let result;

  try {
    switch (action) {
      case 'addProduct':
        result = addProduct(e.parameter);
        break;
      case 'updateProduct':
        result = updateProduct(e.parameter);
        break;
      case 'deleteProduct':
        const productId = e.parameter.id;
        result = deleteProduct(productId);
        break;
      default:
        result = { status: 'error', message: 'Invalid action for POST request.' };
    }
  } catch (error) {
    result = { status: 'error', message: error.message };
  }

  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * Helper function to get the sheet by name.
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found.`);
  }
  return sheet;
}

/**
 * Retrieves all products from the MasterProduk sheet.
 */
function getProducts() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // Remove header row

  const products = data.map(row => {
    const product = {};
    headers.forEach((header, i) => {
      product[header] = row[i];
    });
    return product;
  });

  return { status: 'success', data: products };
}

/**
 * Retrieves a single product by its ID (assuming 'id' is a column in the sheet).
 */
function getProductById(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();

  const productRow = data.find(row => row[headers.indexOf('id')] == id);

  if (productRow) {
    const product = {};
    headers.forEach((header, i) => {
      product[header] = productRow[i];
    });
    return { status: 'success', data: product };
  } else {
    return { status: 'error', message: `Product with ID ${id} not found.` };
  }
}

/**
 * Adds a new product to the MasterProduk sheet.
 * @param {object} productData - Object containing product details.
 */
function addProduct(productData) {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];

  // Generate a simple unique ID (for demonstration)
  const newId = Utilities.getUuid();
  productData.id = newId;

  headers.forEach(header => {
    newRow.push(productData[header] || ''); // Fill in data, or empty string if not provided
  });

  sheet.appendRow(newRow);
  return { status: 'success', message: 'Product added successfully.', id: newId };
}

/**
 * Updates an existing product in the MasterProduk sheet.
 * @param {object} productData - Object containing product details, including its ID.
 */
function updateProduct(productData) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idColumnIndex = headers.indexOf('id');

  if (idColumnIndex === -1) {
    throw new Error('Sheet must contain an "id" column for updates.');
  }

  const rowIndex = data.findIndex(row => row[idColumnIndex] == productData.id);

  if (rowIndex !== -1) {
    const rowToUpdate = data[rowIndex];
    headers.forEach((header, i) => {
      if (productData[header] !== undefined) { // Only update if the value is provided
        rowToUpdate[i] = productData[header];
      }
    });
    sheet.getRange(rowIndex + 2, 1, 1, rowToUpdate.length).setValues([rowToUpdate]); // +2 because headers were shifted and sheet is 1-indexed
    return { status: 'success', message: `Product with ID ${productData.id} updated successfully.` };
  } else {
    return { status: 'error', message: `Product with ID ${productData.id} not found for update.` };
  }
}

/**
 * Deletes a product from the MasterProduk sheet.
 * @param {string} id - The ID of the product to delete.
 */
function deleteProduct(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const idColumnIndex = headers.indexOf('id');

  if (idColumnIndex === -1) {
    throw new Error('Sheet must contain an "id" column for deletions.');
  }

  const rowIndex = data.findIndex(row => row[idColumnIndex] == id);

  if (rowIndex !== -1) {
    sheet.deleteRow(rowIndex + 2); // +2 because headers were shifted and sheet is 1-indexed
    return { status: 'success', message: `Product with ID ${id} deleted successfully.` };
  } else {
    return { status: 'error', message: `Product with ID ${id} not found for deletion.` };
  }
}
