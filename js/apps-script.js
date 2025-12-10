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

window.sendDataToGoogle = function(action, data, callback, errorHandler) {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Special handling for uploadImageAndGetUrl action to send as POST request with JSON payload
    if (action === 'uploadImageAndGetUrl') {
        // For uploadImageAndGetUrl, we don't need the JSONP callback wrapper
        const payload = { action: 'uploadImageAndGetUrl', ...data };
        
        fetch(window.appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script to parse raw JSON
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            // Check if the response is ok (status 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            // Call the callback function with the result directly
            if (callback) callback(result);
        })
        .catch(error => {
            console.error('Error in uploadImageAndGetUrl fetch:', error);
            // Call error handler if provided, otherwise call the callback with an error response
            if (errorHandler) {
                errorHandler(error);
            } else {
                // Call the callback with an error response to maintain consistency
                if (callback) callback({
                    status: 'error',
                    message: error.message || 'Network error or script execution failed.'
                });
            }
        });
    } else {
        // For other actions, use the JSONP approach
        window[callbackName] = function(response) {
            delete window[callbackName];
            
            console.log('Raw response:', JSON.stringify(response, null, 2));  // Debug log
            
            try {
                // The response from the server is already in the desired format.
                // Simply pass it to the callback, ensuring we have default fallbacks.
                const finalResponse = {
                    status: response.status || 'error',
                    message: response.message || 'No message',
                    data: response.data || [],
                    pagination: response.pagination || null,
                    version: response.version || null,
                    ...response // Spread any other properties from the response
                };

                console.log('Normalized response:', finalResponse);  // Debug log
                
                if (callback) callback(finalResponse);
            } catch (error) {
                console.error('Error processing response:', error);
                if (errorHandler) {
                    errorHandler(error);
                } else {
                    callback({
                        status: 'error',
                        message: 'Error processing response',
                        data: []
                    });
                }
            }
        };

        let url = window.appsScriptUrl + `?action=${action}&callback=${callbackName}`;
        for (const key in data) {
            // Avoid duplicating the 'action' parameter if it's already in the URL
            if (key !== 'action') {
                url += `&${key}=${encodeURIComponent(data[key])}`;
            }
        }

        console.log('Sending request to:', url);
        
        const script = document.createElement('script');
        script.src = url;
        script.onerror = function(error) {
            console.error('!!! CLINE DEBUG: Script loading error caught in sendDataToGoogle. URL was: ' + url, error);
            alert('!!! CLINE DEBUG: Script loading error for Apps Script call. Check console for URL and details.');
            delete window[callbackName];
            document.body.removeChild(script);
            if (errorHandler) errorHandler(new Error('Network error or script loading failed. Please check Apps Script deployment and logs.'));
            else showToast('Network error or script loading failed. Please check Apps Script deployment and logs.', 'error'); // Fallback toast
        };
        document.body.appendChild(script);
    }
};

window.uploadImageAndGetUrl = function(fileName, fileData, fileType) {
    const payload = { action: 'uploadFile', fileName: fileName, fileData: fileData, fileType: fileType };
    return fetch(window.appsScriptUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Important for Apps Script to parse raw JSON
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(uploadResponse => {
        if (uploadResponse.status === 'success' && uploadResponse.url) {
            try {
                const fileId = new URL(uploadResponse.url).searchParams.get("id");
                if (fileId) {
                    uploadResponse.url = `https://lh3.googleusercontent.com/d/${fileId}`;
                }
            } catch (e) {
                console.error('Error parsing URL from uploadImageAndGetUrl:', e);
            }
        }
        return uploadResponse;
    });
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
