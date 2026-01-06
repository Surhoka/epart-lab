/**
 * EZYPARTS ADMIN CORE - v2.4.0
 * 
 * SETUP INSTRUCTIONS:
 * 1. Link the DBDrive Library in your Apps Script Project Settings.
 * 2. Use the Identifier: "DBDriveLibrary"
 * 3. Ensure the Library version is selected.
 */

// Global configuration object (Fetch dynamically from Script Properties populated during Setup)
const props_ = PropertiesService.getScriptProperties();
const CONFIG = {
  // Database ID (Spreadsheet ID)
  spreadsheetId: props_.getProperty('DB_ID'),
  
  // Public Database ID (Spreadsheet ID)
  publicSpreadsheetId: props_.getProperty('PUBLIC_DB_ID'),

  // Root Drive Folder ID for storage
  driveFolderId: props_.getProperty('DRIVE_FOLDER_ID'),
  
  // Public Folder ID (if applicable)
  publicFolderId: props_.getProperty('PUBLIC_FOLDER_ID'),

  // Standard Sheet Names
  produkSheetName: "Produk",
  gambarSheetName: "GambarProduk",
  daftarprodukSheetName: "DaftarProduk",
  calendarSheetName: "Events",
  profileSheetName: "Profile",
  hotspotSheetName: "Hotspot",
  mediaLibrarySheetName: "MediaLibrary",
  postsSheetName: "Posts"
};

/**
 * Gets or creates the Public Spreadsheet in the specified Drive Folder.
 * Used for all public-facing data (Branding, Posts, etc.)
 */
function getPublicSpreadsheet_() {
  try {
    if (!CONFIG.publicSpreadsheetId) {
      throw new Error("Public Spreadsheet ID is not configured. Please run setup.");
    }
    return SpreadsheetApp.openById(CONFIG.publicSpreadsheetId);
  } catch (e) {
    console.error("Could not open public spreadsheet by ID: " + CONFIG.publicSpreadsheetId + ". Error: " + e.toString());
    // As a last resort, try to find it via the registry from the library directly.
    const status = (typeof DBDriveLibrary !== 'undefined') ? DBDriveLibrary.checkDatabaseStatus() : { exists: false };
    if (status.exists && status.data.publicSpreadsheetId) {
      console.warn("Falling back to DBDriveLibrary registry for Public DB ID.");
      PropertiesService.getScriptProperties().setProperty('PUBLIC_DB_ID', status.data.publicSpreadsheetId);
      CONFIG.publicSpreadsheetId = status.data.publicSpreadsheetId;
      return SpreadsheetApp.openById(status.data.publicSpreadsheetId);
    }
    throw new Error("Fatal: Could not access the Public Spreadsheet. Please re-run setup. " + e.toString());
  }
}

/**
 * Handle GET Requests
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action;
  const callback = params.callback;
  let response;

  try {
    // 1. ROUTE: Database Library Actions (Delegated to DBDriveLibrary)
    if (typeof DBDriveLibrary !== 'undefined' && DBDriveLibrary.isDatabaseAction(action)) {
      response = DBDriveLibrary.handleDatabaseAction(action, params);
    } 
    // 2. ROUTE: Discovery & Setup (Legacy Compatibility)
    else if (action === 'get_config' || action === 'check') {
      response = handleGetConfigAction_(params);
    } 
    else if (action === 'setup') {
      response = handleSetupAction_(params);
    }
    // 3. ROUTE: Core Admin API
    else {
      switch (action) {
        case 'checkLoginStatus':
          response = checkLoginStatus();
          break;
        case 'getProfile':
          response = getProfile(params.userId);
          break;
        case 'getEvents':
          response = (typeof getEvents === 'function') ? getEvents() : { status: 'error', message: 'Calendar not implemented' };
          break;
        case 'updateCoreProfile':
          // NOTE: This should ideally be a POST, but handling via GET for client compatibility.
          try {
            const profileData = params.profileData ? JSON.parse(params.profileData) : {};
            if (typeof updateCoreProfile === 'function') {
                const updateResponse = updateCoreProfile(profileData, params.userId);
                // Echo back the saved data on success, as the client might need it to refresh the UI.
                if (updateResponse.status === 'success') {
                    updateResponse.data = profileData;
                }
                response = updateResponse;
            } else {
                response = { status: 'error', message: 'Core profile update failed' };
            }
          } catch(jsonErr) {
            response = { status: 'error', message: 'Invalid profileData format: ' + jsonErr.toString() };
          }
          break;
        case 'updatePublicProfile':
          // NOTE: This should ideally be a POST, but handling via GET for client compatibility.
          try {
            const profileData = params.profileData ? JSON.parse(params.profileData) : {};
            if (typeof updatePublicProfile === 'function') {
                const updateResponse = updatePublicProfile(profileData, params.userId);
                // Echo back the saved data on success
                if (updateResponse.status === 'success') {
                    updateResponse.data = profileData;
                }
                response = updateResponse;
            } else {
                response = { status: 'error', message: 'Public profile update failed' };
            }
          } catch(jsonErr) {
            response = { status: 'error', message: 'Invalid profileData format: ' + jsonErr.toString() };
          }
          break;
        default:
          if (!action) {
            response = { status: 'success', message: "Ezyparts Admin API Active", isLibraryLoaded: (typeof setupUserDatabase === 'function') };
          } else {
            response = { status: 'error', message: "Action '" + action + "' not recognized." };
          }
      }
    }
  } catch (err) {
    response = { status: 'error', message: err.toString() };
  }

  return callback ? createJsonpResponse_(callback, response) : createJsonResponse_(response);
}

/**
 * Handle POST Requests
 */
function doPost(e) {
  let payload;
  try {
    const contents = e.postData.contents;
    if (e.postData.type === "application/x-www-form-urlencoded") {
      const params = contents.split('&').reduce((acc, part) => {
        const [key, value] = part.split('=');
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
        return acc;
      }, {});
      payload = params.payload ? JSON.parse(params.payload) : params;
    } else {
      payload = JSON.parse(contents);
    }

    const action = payload.action;
    let response;

    // 1. ROUTE: Database & Image Library Actions
    if (typeof DBDriveLibrary !== 'undefined' && DBDriveLibrary.isDatabaseAction(action)) {
      response = DBDriveLibrary.handleEnhancedDatabaseAction(e, action, payload);
    }
    // 2. ROUTE: Core Admin API
    else {
      switch (action) {
        case 'SignInUser':
          response = SignInUser(payload);
          break;
        case 'registerUser':
          response = registerUser(payload);
          break;
        case 'SignOut':
          response = SignOut();
          break;
        case 'createProfile':
          response = (typeof createProfile === 'function') ? createProfile(payload.userId, payload.profileData) : { status: 'error', message: 'Profile creation failed' };
          break;
        case 'updateCoreProfile':
          if (typeof updateCoreProfile === 'function') {
              const updateResponse = updateCoreProfile(payload.profileData, payload.userId);
              // Echo back the saved data on success, as the client might need it to refresh the UI.
              if (updateResponse.status === 'success') {
                  updateResponse.data = payload.profileData;
              }
              response = updateResponse;
          } else {
              response = { status: 'error', message: 'Core profile update failed' };
          }
          break;
        case 'updatePublicProfile':
          if (typeof updatePublicProfile === 'function') {
              const updateResponse = updatePublicProfile(payload.profileData, payload.userId);
              // Echo back the saved data on success, as the client might need it to refresh the UI.
              if (updateResponse.status === 'success') {
                  updateResponse.data = payload.profileData;
              }
              response = updateResponse;
          } else {
              response = { status: 'error', message: 'Public profile update failed' };
          }
          break;
        case 'updateProfilePhoto':
          response = (typeof updateProfilePhoto === 'function') ? updateProfilePhoto(payload.photoUrl, payload.userId) : { status: 'error', message: 'Profile photo update failed' };
          break;
        case 'uploadImageAndGetUrl':
          response = (typeof uploadImageAndGetUrl === 'function') ? uploadImageAndGetUrl(payload.fileName, payload.fileData, payload.fileType) : { status: 'error', message: 'Image upload failed' };
          break;
        case 'saveEvent':
          response = (typeof saveEvent === 'function') ? saveEvent(payload) : { status: 'error', message: 'Calendar save failed' };
          break;
        case 'setup':
          response = handleSetupAction_(payload);
          break;
        default:
          response = { status: 'error', message: "Action '" + action + "' not recognized for POST." };
      }
    }
    return createJsonResponse_(response);
  } catch (err) {
    return createJsonResponse_({ status: 'error', message: err.toString() });
  }
}

// --- CORE FUNCTIONS ---


// --- HELPERS ---

// --- SETUP & CONFIG HELPERS (INTEGRATED) ---

function handleGetConfigAction_(params) {
  const props = PropertiesService.getScriptProperties();
  
  // Cek Registry Library dulu via linked DBDriveLibrary
  const hasLibrary = (typeof DBDriveLibrary !== 'undefined');
  const libraryStatus = hasLibrary ? DBDriveLibrary.checkDatabaseStatus() : { exists: false };
  let dbId = props.getProperty('DB_ID');
  
  // Jika library punya registry, gunakan adminSpreadsheetId sebagai DB_ID utama
  if (libraryStatus.exists && libraryStatus.data.adminSpreadsheetId) {
    dbId = libraryStatus.data.adminSpreadsheetId;
  }

  let isDbActuallyValid = false;
  if (dbId) {
    try {
      SpreadsheetApp.openById(dbId);
      isDbActuallyValid = true;
    } catch (e) { }
  }

  return {
    status: 'success',
    adminUrl: props.getProperty('WEBAPP_URL_ADMIN') || '',
    publicUrl: props.getProperty('WEBAPP_URL_PUBLIC') || '',
    dbId: dbId || '',
    isSetup: isDbActuallyValid,
    email: props.getProperty('ADMIN_EMAIL') || '',
    libraryRegistry: libraryStatus.exists ? libraryStatus.data : null
  };
}

function handleSetupAction_(params) {
  try {
    const role = params.role; 
    const url = params.url;
    const props = PropertiesService.getScriptProperties();
    
    if (role === 'Admin') {
      props.setProperty('WEBAPP_URL_ADMIN', url);
      if (params.email) props.setProperty('ADMIN_EMAIL', params.email);
      
      // Menggunakan linked DBDriveLibrary untuk setup struktur canggih
      if (typeof DBDriveLibrary !== 'undefined') {
          // Library ini sekarang punya Health Check internal di checkDatabaseStatus()
          const librarySetup = DBDriveLibrary.setupUserDatabase();
          
          if (librarySetup.status === 'success') {
             // Extract both Admin and Public DB IDs from the library's setup result
             const adminDbId = librarySetup.data.adminSpreadsheetId;
             const publicDbId = librarySetup.data.publicSpreadsheetId;

             // Store them in script properties for global use
             props.setProperty('DB_ID', adminDbId);
             props.setProperty('PUBLIC_DB_ID', publicDbId);
             
             // Pastikan tabel-tabel standar tersedia (Gunakan Safety Try-Catch)
             try {
               const ss = SpreadsheetApp.openById(adminDbId);
               ['Produk', 'DaftarProduk', 'Profile', 'Posts', 'Events'].forEach(n => { 
                  if(!ss.getSheetByName(n)) ss.insertSheet(n); 
               });
                              const profileSheet = ss.getSheetByName('Profile');
                if (profileSheet && profileSheet.getLastRow() === 0) {
                  const profileHeaders = [
                    'id', 'first name', 'last name', 'email', 'phone', 'bio', 'status', 
                    'profile photo', 'country', 'city/state', 'postal code', 'tax id', 
                    'facebook', 'twitter', 'linkedin', 'instagram', 'timestamp'
                  ];
                  profileSheet.appendRow(profileHeaders);
                }
             } catch (ssErr) {
               // Jika gagal buka di sini, berarti librarySetup meloloskan ID yang rusak
               props.deleteProperty("DB_DRIVE_REGISTRY");
               throw new Error("Database file exists in registry but is unreadable. Please try again to recreate it.");
             }
          } else {
             throw new Error(librarySetup.message || "Library failed to setup database.");
          }
      } else {
        // Fallback jika library tidak terhubung
        let dbId = props.getProperty('DB_ID');
        if (dbId) {
          try { SpreadsheetApp.openById(dbId); } catch(e) { dbId = null; }
        }

        if (!dbId || params.dbSetup === 'force_new') {
            const ss = SpreadsheetApp.create(params.dbName || 'Ezyparts Database');
            dbId = ss.getId();
            props.setProperty('DB_ID', dbId);
        }
      }
    } 
    
    if (role === 'Public') {
      props.setProperty('WEBAPP_URL_PUBLIC', url);
    }

    return { 
      status: 'success', 
      message: 'Setup ' + role + ' Successful',
      dbId: props.getProperty('DB_ID')
    };
  } catch (err) {
    return { status: 'error', message: "Setup Critical Error: " + err.toString() };
  }
}

// --- AUTH FUNCTIONS (PRESERVED) ---

// (registerUser and SignInUser are now managed in auth.gs for better organization)

function SignOut() {
  PropertiesService.getUserProperties().deleteProperty('loggedInUserEmail');
  return { status: 'success', message: 'Signed out' };
}

function checkLoginStatus() {
  const email = PropertiesService.getUserProperties().getProperty('loggedInUserEmail');
  return { status: 'success', isLoggedIn: !!email, user: email ? { email } : null };
}

// --- OUTPUT HELPERS ---

function createJsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createJsonpResponse_(callback, data) {
  const jsonp = callback + '(' + JSON.stringify(data) + ')';
  return ContentService.createTextOutput(jsonp)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
