// utils.js
const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyXBcKm42b6KJ8znU8ryYn-5PtlORDH0HMuUoMlM7e24yp5v0dtkOi9Q16wLweMYhHaDg/exec';

function showToast(message, type = 'success', duration = 3000) {
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

    // Force reflow to enable transition
    void toast.offsetWidth; 
    toast.classList.add('show');

    const closeBtn = toast.querySelector('.toast-close-btn');
    closeBtn.addEventListener('click', () => {
        hideToast(toast);
    });

    setTimeout(() => hideToast(toast), duration);
}

function hideToast(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
        toast.remove();
    }, { once: true });
}

function sendDataToGoogle(action, data, callback, errorHandler) {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(response) {
        delete window[callbackName];
        document.body.removeChild(script);
        if (callback) callback(response);
    };

    let url = appsScriptUrl + `?action=${action}&callback=${callbackName}`;
    for (const key in data) {
        url += `&${key}=${encodeURIComponent(data[key])}`;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onerror = function() {
        delete window[callbackName];
        document.body.removeChild(script);
        if (errorHandler) errorHandler(new Error('Network error or script loading failed.'));
    };
    document.body.appendChild(script);
}

function uploadImageAndGetUrl(fileName, fileData, fileType) {
    const payload = { action: 'uploadFile', fileName: fileName, fileData: fileData, fileType: fileType };
    return fetch(appsScriptUrl, {
        method: 'POST',
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
                console.error('Error parsing URL:', e);
            }
        }
        return uploadResponse;
    });
}
