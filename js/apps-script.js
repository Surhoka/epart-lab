// Global modal functions
window.openProductModal = function(mode, productId = null) {
    const modal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitProduct');
    
    modalTitle.textContent = mode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk';
    submitBtn.textContent = mode === 'add' ? 'Tambah' : 'Update';
    
    if (mode === 'edit' && productId) {
        // Load product data for editing
        sendDataToGoogle('getProduct', { productId: productId }, (response) => {
            if (response.status === 'success') {
                const product = response.data;
                document.getElementById('productName').value = product.name;
                document.getElementById('productCode').value = product.code;
                document.getElementById('productCategory').value = product.category;
                document.getElementById('productBrand').value = product.brand;
                document.getElementById('productDescription').value = product.description;
                document.getElementById('productPrice').value = product.price;
                document.getElementById('productCost').value = product.cost;
                document.getElementById('minimumStock').value = product.minimumStock;
            }
        });
    }
    
    modal.classList.remove('hidden');
};

window.closeProductModal = function() {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    form.reset();
    modal.classList.add('hidden');
};

window.setupModalClose = function() {
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeProductModal();
        }
    };

    // Close modal when clicking close button
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = closeProductModal;
    }
};

// Helper function for rendering product table
window.renderProductTable = function(products) {
    console.log('Rendering products:', products); // Debug log
    
    // Ensure products is an array
    if (!Array.isArray(products)) {
        console.error('Products must be an array:', products);
        products = [];
    }
    
    // Additional validation
    products = products.filter(product => product && typeof product === 'object');

    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) {
        console.error('Product table body not found');
        return;
    }

    tableBody.innerHTML = '';
    
    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-gray-500">
                    Tidak ada produk yang tersedia
                </td>
            </tr>
        `;
        return;
    }

    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.code || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${product.name || '-'}</div>
                <div class="text-sm text-gray-500">${product.category || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.brand || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.stock || '0'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price || 0)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.minimumStock || '0'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.status || 'Aktif'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="openProductModal('edit', '${product.id}')" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onclick="deleteProduct('${product.id}')" class="text-red-600 hover:text-red-900">Hapus</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
};

// Global utility functions
window.showToast = function(message, type = 'success', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('Toast container not found.');
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.innerHTML = `
        <span class="toast-message">${message}</span>
        <button class="toast-close-btn">&times;</button>
    `;
    
    toastContainer.appendChild(toast);

    void toast.offsetWidth; 
    toast.classList.add('show');

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
        hideToast(toast);
    });

    setTimeout(() => hideToast(toast), duration);
};

window.hideToast = function(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
        toast.remove();
    }, { once: true });
};

// Function to make requests with JSONP (script injection) for GET requests
function makeFetchRequest(action, data, callback, errorHandler) {
    const callbackName = 'jsonp_callback_' + Math.round(1000 * Math.random());
    
    window[callbackName] = function(response) {
        delete window[callbackName];
        
        console.log('Raw response (GET):', JSON.stringify(response, null, 2));
        
        try {
            const normalizedResponse = normalizeResponse(action, response);
            console.log('Normalized response (GET):', normalizedResponse);
            if (callback) callback(normalizedResponse);
        } catch (error) {
            console.error('Error processing GET response:', error);
            if (errorHandler) errorHandler(error);
        }
    };

    let url = window.appsScriptUrl + `?action=${action}&callback=${callbackName}`;
    for (const key in data) {
        if (key !== 'action') {
            url += `&${key}=${encodeURIComponent(data[key])}`;
        }
    }

    console.log('Sending GET request to:', url);
    
    const script = document.createElement('script');
    script.src = url;
    script.onerror = function(error) {
        console.error('Script loading error:', error);
        delete window[callbackName];
        document.body.removeChild(script);
        if (errorHandler) errorHandler(new Error('Network error or script loading failed.'));
        else showToast('Network error, please try again.', 'error');
    };
    document.body.appendChild(script);
}

// Function to normalize responses from the server
function normalizeResponse(action, response) {
    let normalized = {
        status: 'error',
        message: 'Invalid response from server.',
        data: [],
        pagination: {},
        version: 'unknown'
    };

    if (response) {
        if (action === 'getApiStatusNotifications') {
            normalized.status = response.status || 'success';
            normalized.message = response.message || 'Notifications fetched';
            normalized.data = response.notifications || [];
        } else if (action === 'SignInUser' || action === 'registerUser') {
            normalized.status = response.status || 'error';
            normalized.message = response.message || '';
            normalized.data = response.user || null;
            if (response.user) normalized.user = response.user; // For backward compatibility
            if (response.redirectUrl) normalized.redirectUrl = response.redirectUrl;
            if (response.token) normalized.token = response.token;
        } else if (response.status) {
            // For all other actions, if response has a status field, we should accept it as valid
            // Only override the message if there's a specific error message
            normalized = { 
                status: response.status,
                message: response.message || 'Success',
                data: response.data || [],
                pagination: response.pagination || {},
                version: response.version || 'unknown'
            };
        } else {
            // This case should not happen with proper server responses, but for safety
            normalized.status = 'success';
            normalized.data = response;
        }
    }
    
    return normalized;
}


window.sendDataToGoogle = function(action, data, callback, errorHandler) {
    // Actions that must use POST for security or data length reasons
    const postActions = [
        'SignInUser',
        'registerUser',
        'uploadFile',
        'uploadImageAndGetUrl',
        'addProduk',
        'updateProduk',
        'addProduct',
        'updateProduct',
        'savePurchaseOrder',
        'addSupplier',
        'updateSupplier',
        'changePassword',
        'updateProfile',
        'saveProfileDataOnServer',
        'simpanProdukBaru'
    ];

    if (postActions.includes(action)) {
        // Use Fetch API for POST requests
        const payload = { action, ...data };
        const formData = 'payload=' + encodeURIComponent(JSON.stringify(payload));

        console.log(`Sending POST request for action: ${action}`);
        
        fetch(window.appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! Status: ${response.status}, Body: ${text}`);
                });
            }
            return response.json();
        })
        .then(jsonResponse => {
            console.log(`Raw response (POST for ${action}):`, jsonResponse);
            const normalized = normalizeResponse(action, jsonResponse);
            console.log(`Normalized response (POST for ${action}):`, normalized);
            if (callback) callback(normalized);
        })
        .catch(error => {
            console.error(`Fetch error for action '${action}':`, error);
            if (errorHandler) {
                errorHandler(error);
            } else {
                showToast(error.message || `An error occurred with action: ${action}`, 'error');
            }
        });
    } else {
        // Use JSONP for GET requests
        makeFetchRequest(action, data, callback, errorHandler);
    }
};

window.handleAuthUI = function() {
    const user = JSON.parse(localStorage.getItem('signedInUser'));
    console.log('handleAuthUI: User object from localStorage:', user); // Added log here
    const profileDropdownToggle = document.getElementById('profile-dropdown-toggle');
    const profilePicture = document.getElementById('profile-picture');
    const usernameDisplay = document.getElementById('username-display');
    const dropdownUsernameDisplay = document.getElementById('dropdown-username-display');
    const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
    const signInButton = document.getElementById('signin-button'); // Assuming a signIn button exists elsewhere for signed out state

    if (user && user.isLoggedIn) {
        if (profileDropdownToggle) profileDropdownToggle.classList.remove('hidden');
        if (profilePicture) profilePicture.src = user.pictureUrl || 'https://dummyimage.com/100';
        if (usernameDisplay) usernameDisplay.textContent = user.fullName || user.userName; // Use fullName, fallback to userName
        if (dropdownUsernameDisplay) dropdownUsernameDisplay.textContent = user.fullName || user.userName; // Use fullName, fallback to userName
        if (signInButton) signInButton.classList.add('hidden'); // Hide signIn button if logged in
    } else {
        // Ensure profileDropdownToggle is always visible, regardless of signIn status
        if (profileDropdownToggle) profileDropdownToggle.classList.remove('hidden'); 
        if (signInButton) signInButton.classList.remove('hidden'); // Show signIn button if signed out
    }
};
