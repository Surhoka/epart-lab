// Profile page initialization
window.initProfilePage = function () {
    console.log("Profile Page Initialized");

    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Profile');
    }

    // Store current user ID globally for this page
    window.currentProfileUserId = null;

    // Fetch and populate profile data
    fetchProfileData();

    // Setup event listeners for save buttons
    setupEventListeners();

    console.log('Profile page ready');
};

/**
 * Force reset button to original state
 * This ensures button is fully restored even if setButtonLoading fails
 */
function forceResetButton(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.classList.remove('btn-loading', 'btn-success');
        button.style.display = '';
        button.style.opacity = '';
        button.style.transform = '';
        button.style.backgroundColor = '';
        button.style.borderColor = '';
        button.style.color = '';
        if (originalText) {
            button.innerHTML = originalText;
        }
        // Clean up any data attributes
        delete button.dataset.originalText;
        delete button.dataset.originalDisabled;
        delete button.dataset.oldBg;
    }
}

/**
 * Uploads an image to Google Drive via Google Apps Script and returns its public URL.
 * @param {string} fileName - The desired file name for the uploaded image.
 * @param {string} base64Data - The base64 encoded image data (without the data:image/...;base64, prefix).
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/png', 'image/jpeg').
 * @returns {Promise<Object>} A promise that resolves with an object containing `status` and `url` if successful,
 *                            or `status` and `message` if there's an error.
 */
window.uploadImageAndGetUrl = function (fileName, base64Data, mimeType) {
    return new Promise((resolve, reject) => {
        if (typeof window.sendDataToGoogle !== 'function') {
            const errorMessage = 'sendDataToGoogle function not found. Make sure apps-script.js is loaded.';
            console.error(errorMessage);
            return reject({ status: 'error', message: errorMessage });
        }

        const data = {
            fileName: fileName,
            fileData: base64Data,
            fileType: mimeType
        };

        window.sendDataToGoogle('uploadImageAndGetUrl', data, (response) => {
            if (response.status === 'success' && response.url) {
                resolve({ status: 'success', url: response.url });
            } else {
                reject({ status: 'error', message: response.message || 'Unknown error during upload.' });
            }
        }, (error) => {
            console.error('Error in uploadImageAndGetUrl:', error);
            reject({ status: 'error', message: error.message || 'Network error or script execution failed.' });
        });
    });
};

/**
 * Fetch profile data from Google Sheets
 * @param {String} userId Optional - ID user yang akan diambil. Jika kosong, ambil user pertama.
 */
function fetchProfileData(userId) {
    // 1. CACHE FIRST STRATEGY
    const cacheKey = userId ? `cached_profile_data_${userId}` : 'cached_profile_data_default';
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        try {
            const parsedData = JSON.parse(cachedData);
            console.log('Loading profile from cache...');
            // Populate UI immediately with cached data
            window.currentProfileUserId = parsedData.id;
            populateProfileData(parsedData);
        } catch (e) {
            console.error('Error parsing cached profile data', e);
            localStorage.removeItem(cacheKey);
        }
    }

    // 2. NETWORK BACKGROUND FETCH
    if (typeof window.sendDataToGoogle === 'function') {
        const params = userId ? { userId } : {};
        console.log('Fetching fresh profile data from server...');

        window.sendDataToGoogle('getProfile', params, (response) => {
            if (response.status === 'success' && response.data) {
                // Store the user ID for future updates
                window.currentProfileUserId = response.data.id;

                // Update UI with fresh data
                populateProfileData(response.data);
                console.log('Profile data loaded from server:', response.data);

                // Update Cache
                localStorage.setItem(cacheKey, JSON.stringify(response.data));

                // Also update the loggedInUser session so the header updates immediately
                // This ensures consistency between profile data and header display.
                const sessionUser = JSON.parse(localStorage.getItem('signedInUser'));
                if (sessionUser && response.data.personalInfo && response.data.personalInfo.profilePhoto) {
                    sessionUser.pictureUrl = response.data.personalInfo.profilePhoto;
                    localStorage.setItem('signedInUser', JSON.stringify(sessionUser));

                    // Force Alpine.js to update the header by re-assigning the currentUser object
                    if (window.app && typeof window.app.currentUser !== 'undefined') {
                        window.app.currentUser = sessionUser;
                    }
                }

            } else {
                console.log('No profile data found, prompting creation.');
                window.currentProfileUserId = null; // Ensure ID is null

                // Only show toast/modal if we didn't have cached data (to avoid annoying popups if cache was stale but valid-ish)
                // OR if we want to enforce consistency. 
                // Let's stick to original behavior but only if NO cache exists or if server explicitly says "error/empty".

                if (!cachedData) {
                    if (window.showToast) window.showToast('Welcome! Please create your profile.', 'info');

                    // Auto-open Personal Info Modal
                    const profileContainer = document.getElementById('profile-page-container');
                    if (profileContainer && window.Alpine) {
                        try {
                            const alpineData = window.Alpine.$data(profileContainer);
                            if (alpineData) {
                                alpineData.isProfileInfoModal = true;
                            }
                        } catch (e) {
                            console.error('Error opening modal:', e);
                        }
                    }
                }
            }
        });
    } else {
        console.error('sendDataToGoogle function not found. Make sure apps-script.js is loaded.');
    }
}

/**
 * Populate profile data into the HTML
 */
function populateProfileData(data) {
    const { personalInfo, address, socialLinks } = data;

    // Populate Meta Card
    const profilePhotoDisplay = document.getElementById('profile-photo-display');
    if (profilePhotoDisplay && personalInfo.profilePhoto) {
        profilePhotoDisplay.src = personalInfo.profilePhoto;
    }

    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.trim();
    const nameDisplay = document.getElementById('profile-name-display');
    if (nameDisplay) nameDisplay.textContent = fullName;

    const bioDisplay = document.getElementById('profile-bio-display');
    if (bioDisplay) bioDisplay.textContent = personalInfo.bio || '-';

    const locationDisplay = document.getElementById('profile-location-display');
    if (locationDisplay) locationDisplay.textContent = address.cityState || '-';

    // Populate Personal Information section
    const personalInfoSection = document.querySelectorAll('.grid.grid-cols-1.gap-4')[0];
    if (personalInfoSection) {
        const fields = personalInfoSection.querySelectorAll('div');
        fields.forEach(field => {
            const label = field.querySelector('p.text-xs');
            const value = field.querySelector('p.text-sm.font-medium');

            if (label && value) {
                const labelText = label.textContent.trim();
                switch (labelText) {
                    case 'First Name':
                        value.textContent = personalInfo.firstName || '-';
                        break;
                    case 'Last Name':
                        value.textContent = personalInfo.lastName || '-';
                        break;
                    case 'Email address':
                        value.textContent = personalInfo.email || '-';
                        break;
                    case 'Phone':
                        value.textContent = personalInfo.phone || '-';
                        break;
                    case 'Bio':
                        value.textContent = personalInfo.bio || '-';
                        break;
                }
            }
        });
    }

    // Populate Address section
    const addressSection = document.querySelectorAll('.grid.grid-cols-1.gap-4')[1];
    if (addressSection) {
        const fields = addressSection.querySelectorAll('div');
        fields.forEach(field => {
            const label = field.querySelector('p.text-xs');
            const value = field.querySelector('p.text-sm.font-medium');

            if (label && value) {
                const labelText = label.textContent.trim();
                switch (labelText) {
                    case 'Country':
                        value.textContent = address.country || '-';
                        break;
                    case 'City/State':
                        value.textContent = address.cityState || '-';
                        break;
                    case 'Postal Code':
                        value.textContent = address.postalCode || '-';
                        break;
                    case 'TAX ID':
                        value.textContent = address.taxId || '-';
                        break;
                }
            }
        });
    }

    // Populate modal form fields
    populateModalFields(personalInfo, address, socialLinks);
}

/**
 * Populate modal form fields with data
 */
function populateModalFields(personalInfo, address, socialLinks) {
    // Personal Info Modal - using IDs
    const firstNameInput = document.getElementById('input-firstname');
    const lastNameInput = document.getElementById('input-lastname');
    const emailInput = document.getElementById('input-email');
    const phoneInput = document.getElementById('input-phone');
    const bioInput = document.getElementById('input-bio');

    if (firstNameInput) firstNameInput.value = personalInfo.firstName || '';
    if (lastNameInput) lastNameInput.value = personalInfo.lastName || '';
    if (emailInput) emailInput.value = personalInfo.email || '';
    if (phoneInput) phoneInput.value = personalInfo.phone || '';
    if (bioInput) bioInput.value = personalInfo.bio || '';

    // Social Links - using IDs
    const facebookInput = document.getElementById('input-facebook');
    const twitterInput = document.getElementById('input-twitter');
    const linkedinInput = document.getElementById('input-linkedin');
    const instagramInput = document.getElementById('input-instagram');

    if (facebookInput) facebookInput.value = socialLinks.facebook || '';
    if (twitterInput) twitterInput.value = socialLinks.twitter || '';
    if (linkedinInput) linkedinInput.value = socialLinks.linkedin || '';
    if (instagramInput) instagramInput.value = socialLinks.instagram || '';

    // Address Modal - using IDs
    const countryInput = document.getElementById('input-country');
    const cityStateInput = document.getElementById('input-citystate');
    const postalCodeInput = document.getElementById('input-postalcode');
    const taxIdInput = document.getElementById('input-taxid');

    if (countryInput) countryInput.value = address.country || '';
    if (cityStateInput) cityStateInput.value = address.cityState || '';
    if (postalCodeInput) postalCodeInput.value = address.postalCode || '';
    if (taxIdInput) taxIdInput.value = address.taxId || '';
}

/**
 * Setup event listeners for save buttons
 */
function setupEventListeners() {
    // Personal Info Save Button
    const savePersonalInfoBtn = document.getElementById('save-personal-info-btn');
    if (savePersonalInfoBtn) {
        savePersonalInfoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Add loading state (using global function)
            window.setButtonLoading(savePersonalInfoBtn, true);
            savePersonalInfo();
        });
    }

    // Address Save Button
    const saveAddressBtn = document.getElementById('save-address-btn');
    if (saveAddressBtn) {
        saveAddressBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Add loading state (using global function)
            window.setButtonLoading(saveAddressBtn, true);
            saveAddress();
        });
    }

    // Delete Profile Button (Personal Info Modal)
    const deleteBtn = document.getElementById('delete-profile-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.setButtonLoading(deleteBtn, true);
            clearPersonalInfo();
        });
    }

    // Delete Profile Button (Address Modal)
    const deleteBtnAddress = document.getElementById('delete-address-btn');
    if (deleteBtnAddress) {
        deleteBtnAddress.addEventListener('click', (e) => {
            e.preventDefault();
            // Add loading state
            window.setButtonLoading(deleteBtnAddress, true);
            clearAddress();
        });
    }

    // Profile Photo Edit Button
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    const photoInput = document.getElementById('profile-photo-input');

    if (editPhotoBtn && photoInput) {
        editPhotoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            photoInput.click();
        });

        photoInput.addEventListener('change', handlePhotoFileChange);
    }
}

/**
 * Clear personal information
 */
function clearPersonalInfo() {
    if (!window.currentProfileUserId) {
        if (window.showToast) window.showToast('User ID tidak ditemukan', 'error');
        return;
    }

    if (confirm('Are you sure you want to clear personal information?')) {
        const profileData = {
            personalInfo: {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                bio: ''
            },
            socialLinks: {
                facebook: '',
                twitter: '',
                linkedin: '',
                instagram: ''
            }
        };

        window.sendDataToGoogle('updateProfile', {
            profileData: JSON.stringify(profileData),
            userId: window.currentProfileUserId
        }, (response) => {
            const deleteBtn = document.getElementById('delete-profile-btn');
            if (response.status === 'success') {
                if (window.showToast) window.showToast('Personal information cleared successfully', 'success');

                // Fetch will automatically update cache and UI
                fetchProfileData(window.currentProfileUserId);
            } else {
                console.error('Failed to clear personal info:', response.message);
                if (window.showToast) window.showToast('Failed to clear personal info', 'error');
                window.setButtonLoading(deleteBtn, false);
            }
        });
    } else {
        const deleteBtn = document.getElementById('delete-profile-btn');
        window.setButtonLoading(deleteBtn, false);
    }
}

/**
 * Clear address information
 */
function clearAddress() {
    if (!window.currentProfileUserId) {
        if (window.showToast) window.showToast('User ID tidak ditemukan', 'error');
        return;
    }

    if (confirm('Are you sure you want to clear address information?')) {
        const profileData = {
            address: {
                country: '',
                cityState: '',
                postalCode: '',
                taxId: ''
            }
        };

        if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle('updateProfile', {
                profileData: JSON.stringify(profileData),
                userId: window.currentProfileUserId
            }, (response) => {
                const deleteBtnAddress = document.getElementById('delete-address-btn');
                if (response.status === 'success') {
                    if (window.showToast) window.showToast('Address information cleared successfully', 'success');

                    // Fetch will automatically update cache and UI
                    fetchProfileData(window.currentProfileUserId);
                } else {
                    console.error('Failed to clear address:', response.message);
                    if (window.showToast) window.showToast('Failed to clear address', 'error');
                    window.setButtonLoading(deleteBtnAddress, false);
                }
            });
        }
    } else {
        const deleteBtnAddress = document.getElementById('delete-address-btn');
        window.setButtonLoading(deleteBtnAddress, false);
    }
}

/**
 * Save personal information
 */
function savePersonalInfo() {
    // If no ID, we are creating a new profile
    const isCreating = !window.currentProfileUserId;

    // Get values from modal inputs using IDs
    const firstName = document.getElementById('input-firstname')?.value || '';
    const lastName = document.getElementById('input-lastname')?.value || '';
    const email = document.getElementById('input-email')?.value || '';
    const phone = document.getElementById('input-phone')?.value || '';
    const bio = document.getElementById('input-bio')?.value || '';

    const facebook = document.getElementById('input-facebook')?.value || '';
    const twitter = document.getElementById('input-twitter')?.value || '';
    const linkedin = document.getElementById('input-linkedin')?.value || '';
    const instagram = document.getElementById('input-instagram')?.value || '';

    const profileData = {
        personalInfo: {
            firstName,
            lastName,
            email,
            phone,
            bio
        },
        socialLinks: {
            facebook,
            twitter,
            linkedin,
            instagram
        }
    };

    if (typeof window.sendDataToGoogle === 'function') {
        const action = isCreating ? 'createProfile' : 'updateProfile';
        const payload = isCreating ? { profileData: JSON.stringify(profileData) } : {
            profileData: JSON.stringify(profileData),
            userId: window.currentProfileUserId
        };

        window.sendDataToGoogle(action, payload, (response) => {
            const saveBtn = document.getElementById('save-personal-info-btn');

            if (response.status === 'success') {
                if (window.showToast) window.showToast(isCreating ? 'Profile created successfully' : 'Profile updated successfully', 'success');

                if (isCreating && response.data && response.data.id) {
                    window.currentProfileUserId = response.data.id;
                }

                // Clear cache before refetching to ensure we don't load stale data
                const cacheKey = window.currentProfileUserId ? `cached_profile_data_${window.currentProfileUserId}` : 'cached_profile_data_default';
                localStorage.removeItem(cacheKey);

                fetchProfileData(window.currentProfileUserId); // Refresh data
            } else {
                console.error('Failed to save profile:', response.message);
                if (window.showToast) window.showToast('Failed to save profile: ' + response.message, 'error');
                window.setButtonLoading(saveBtn, false);
            }
        });
    }
}

/**
 * Save address information
 */
function saveAddress() {
    // If no ID, we are creating a new profile (though usually personal info comes first)
    const isCreating = !window.currentProfileUserId;

    // Get values from address modal inputs using IDs
    const country = document.getElementById('input-country')?.value || '';
    const cityState = document.getElementById('input-citystate')?.value || '';
    const postalCode = document.getElementById('input-postalcode')?.value || '';
    const taxId = document.getElementById('input-taxid')?.value || '';

    const profileData = {
        address: {
            country,
            cityState,
            postalCode,
            taxId
        }
    };

    if (typeof window.sendDataToGoogle === 'function') {
        const action = isCreating ? 'createProfile' : 'updateProfile';
        const payload = isCreating ? { profileData: JSON.stringify(profileData) } : {
            profileData: JSON.stringify(profileData),
            userId: window.currentProfileUserId
        };

        window.sendDataToGoogle(action, payload, (response) => {
            const saveBtn = document.getElementById('save-address-btn');

            if (response.status === 'success') {
                if (window.showToast) window.showToast(isCreating ? 'Address saved and profile created' : 'Address updated successfully', 'success');

                if (isCreating && response.data && response.data.id) {
                    window.currentProfileUserId = response.data.id;
                }

                // Clear cache before refetching
                const cacheKey = window.currentProfileUserId ? `cached_profile_data_${window.currentProfileUserId}` : 'cached_profile_data_default';
                localStorage.removeItem(cacheKey);

                fetchProfileData(window.currentProfileUserId); // Refresh data
            } else {
                console.error('Failed to save address:', response.message);
                if (window.showToast) window.showToast('Failed to save address: ' + response.message, 'error');
                window.setButtonLoading(saveBtn, false);
            }
        });
    }
}

/**
 * Handle profile photo file selection
 */
function handlePhotoFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        if (window.showToast) window.showToast('Please select an image file', 'error');
        return;
    }

    // Validate file size (max 10MB for Drive upload)
    if (file.size > 10 * 1024 * 1024) {
        if (window.showToast) window.showToast('Image size must be less than 10MB', 'error');
        return;
    }

    // Show loading toast
    if (window.showToast) window.showToast('Uploading profile photo...', 'info', 5000);

    // Disable edit button during upload
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    if (editPhotoBtn) {
        window.setButtonLoading(editPhotoBtn, true);
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = function (e) {
        const base64data = e.target.result.split(',')[1];
        const fileName = `profile_photo_${Date.now()}.${file.name.split('.').pop()}`;

        // Preview the image immediately
        const profilePhotoDisplay = document.getElementById('profile-photo-display');
        if (profilePhotoDisplay) {
            profilePhotoDisplay.src = e.target.result;
        }

        // Upload to Google Drive and get URL
        uploadProfilePhoto(fileName, base64data, file.type);
    };
    reader.readAsDataURL(file);
}

/**
 * Upload profile photo to Google Drive and save URL
 * @param {String} fileName - Name for the uploaded file
 * @param {String} base64data - Base64 encoded image data (without prefix)
 * @param {String} mimeType - MIME type of the image
 */
function uploadProfilePhoto(fileName, base64data, mimeType) {
    if (!window.currentProfileUserId) {
        if (window.showToast) window.showToast('Please create a profile first', 'error');
        resetUploadButton();
        return;
    }

    // Check if uploadImageAndGetUrl function exists
    if (typeof window.uploadImageAndGetUrl !== 'function') {
        console.error('uploadImageAndGetUrl function not found');
        if (window.showToast) window.showToast('Upload function not available', 'error');
        resetUploadButton();
        return;
    }

    // Upload image to Google Drive
    window.uploadImageAndGetUrl(fileName, base64data, mimeType).then((response) => {
        if (response.status === 'success' && response.url) {
            // Save the Drive URL to profile
            saveProfilePhotoUrl(response.url);
        } else {
            console.error('Failed to upload photo:', response.message);
            if (window.showToast) window.showToast('Failed to upload photo: ' + (response.message || 'Error'), 'error');
            resetUploadButton();
        }
    }).catch((error) => {
        console.error('Error uploading photo:', error);
        if (window.showToast) window.showToast('Error uploading photo: ' + error.message, 'error');
        resetUploadButton();
    });
}

/**
 * Save profile photo URL to backend
 * @param {String} photoUrl - Google Drive URL of the uploaded photo
 */
function saveProfilePhotoUrl(photoUrl) {
    if (typeof window.sendDataToGoogle === 'function') {
        // Use the correct 'updateProfilePhoto' action and include the userId
        window.sendDataToGoogle('updateProfilePhoto', {
            photoUrl: photoUrl,
            userId: window.currentProfileUserId
        }, (response) => {
            if (response.status === 'success') {
                if (window.showToast) window.showToast('Profile photo updated successfully');

                // Update the display with the new URL
                const profilePhotoDisplay = document.getElementById('profile-photo-display');
                if (profilePhotoDisplay) {
                    profilePhotoDisplay.src = photoUrl;
                }

                // Update cache locally to reflect the new photo url without needing full re-fetch or invalidation
                // This is a "surgical" cache update since we know exactly what changed
                const cacheKey = window.currentProfileUserId ? `cached_profile_data_${window.currentProfileUserId}` : 'cached_profile_data_default';
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    try {
                        const parsedData = JSON.parse(cachedData);
                        if (parsedData.personalInfo) {
                            parsedData.personalInfo.profilePhoto = photoUrl;
                            localStorage.setItem(cacheKey, JSON.stringify(parsedData));

                            // ALSO update the loggedInUser session so the header updates immediately
                            const sessionUser = JSON.parse(localStorage.getItem('signedInUser'));
                            if (sessionUser) {
                                sessionUser.pictureUrl = photoUrl;
                                localStorage.setItem('signedInUser', JSON.stringify(sessionUser));

                                // Force Alpine.js to update the header by re-assigning the currentUser object
                                if (window.app && typeof window.app.currentUser !== 'undefined') {
                                    window.app.currentUser = sessionUser;
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to update cache for photo", e);
                    }
                }
            } else {
                console.error('Failed to save photo URL:', response.message);
                if (window.showToast) window.showToast('Failed to save photo: ' + response.message, 'error');
            }
            resetUploadButton();
        });
    } else {
        console.error('sendDataToGoogle function not found');
        if (window.showToast) window.showToast('Save function not available', 'error');
        resetUploadButton();
    }
}

/**
 * Reset upload button state
 */
function resetUploadButton() {
    const editPhotoBtn = document.getElementById('edit-photo-btn');
    if (editPhotoBtn) {
        editPhotoBtn.disabled = false;
        editPhotoBtn.style.opacity = '1';
    }
}

