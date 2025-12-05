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
 * Fetch profile data from Google Sheets
 * @param {String} userId Optional - ID user yang akan diambil. Jika kosong, ambil user pertama.
 */
function fetchProfileData(userId) {
    if (typeof window.sendDataToGoogle === 'function') {
        const params = userId ? { userId } : {};
        window.sendDataToGoogle('getProfile', params, (response) => {
            if (response.status === 'success' && response.data) {
                // Store the user ID for future updates
                window.currentProfileUserId = response.data.id;
                populateProfileData(response.data);
                console.log('Profile data loaded:', response.data);
            } else {
                console.log('No profile data found, prompting creation.');
                window.currentProfileUserId = null; // Ensure ID is null
                if (window.showToast) window.showToast('Welcome! Please create your profile.', 'info');

                // Auto-open Personal Info Modal
                const modal = document.querySelectorAll('[x-show="isProfileInfoModal"]')[0];
                if (modal) {
                    Alpine.evaluate(modal, '$data.isProfileInfoModal = true');
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
    const saveInfoButtons = document.querySelectorAll('button.bg-brand-500');
    if (saveInfoButtons[0]) {
        saveInfoButtons[0].addEventListener('click', (e) => {
            e.preventDefault();
            savePersonalInfo();
        });
    }

    // Address Save Button
    if (saveInfoButtons[1]) {
        saveInfoButtons[1].addEventListener('click', (e) => {
            e.preventDefault();
            saveAddress();
        });
    }

    // Delete Profile Button (Personal Info Modal)
    const deleteBtn = document.getElementById('delete-profile-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearPersonalInfo();
        });
    }

    // Delete Profile Button (Address Modal)
    const deleteBtnAddress = document.getElementById('delete-address-btn');
    if (deleteBtnAddress) {
        deleteBtnAddress.addEventListener('click', (e) => {
            e.preventDefault();
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

        if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle('updateProfile', {
                profileData: JSON.stringify(profileData),
                userId: window.currentProfileUserId
            }, (response) => {
                if (response.status === 'success') {
                    if (window.showToast) window.showToast('Personal information cleared successfully');
                    fetchProfileData(window.currentProfileUserId); // Refresh data
                    // Close modal
                    const modal = document.querySelectorAll('[x-show="isProfileInfoModal"]')[0];
                    if (modal) {
                        Alpine.evaluate(modal, '$data.isProfileInfoModal = false');
                    }
                } else {
                    console.error('Failed to clear personal info:', response.message);
                    if (window.showToast) window.showToast('Failed to clear personal info', 'error');
                }
            });
        }
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
                if (response.status === 'success') {
                    if (window.showToast) window.showToast('Address information cleared successfully');
                    fetchProfileData(window.currentProfileUserId); // Refresh data
                    // Close modal
                    const modal = document.querySelectorAll('[x-show="isProfileAddressModal"]')[0];
                    if (modal) {
                        Alpine.evaluate(modal, '$data.isProfileAddressModal = false');
                    }
                } else {
                    console.error('Failed to clear address:', response.message);
                    if (window.showToast) window.showToast('Failed to clear address', 'error');
                }
            });
        }
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
            if (response.status === 'success') {
                if (window.showToast) window.showToast(isCreating ? 'Profile created successfully' : 'Profile updated successfully');

                if (isCreating && response.data && response.data.id) {
                    window.currentProfileUserId = response.data.id;
                }

                fetchProfileData(window.currentProfileUserId); // Refresh data
                // Close modal
                const modal = document.querySelectorAll('[x-show="isProfileInfoModal"]')[0];
                if (modal) {
                    Alpine.evaluate(modal, '$data.isProfileInfoModal = false');
                }
            } else {
                console.error('Failed to save profile:', response.message);
                if (window.showToast) window.showToast('Failed to save profile: ' + response.message, 'error');
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
            if (response.status === 'success') {
                if (window.showToast) window.showToast(isCreating ? 'Address saved and profile created' : 'Address updated successfully');

                if (isCreating && response.data && response.data.id) {
                    window.currentProfileUserId = response.data.id;
                }

                fetchProfileData(window.currentProfileUserId); // Refresh data
                // Close modal
                const modal = document.querySelectorAll('[x-show="isProfileAddressModal"]')[0];
                if (modal) {
                    Alpine.evaluate(modal, '$data.isProfileAddressModal = false');
                }
            } else {
                console.error('Failed to save address:', response.message);
                if (window.showToast) window.showToast('Failed to save address: ' + response.message, 'error');
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        if (window.showToast) window.showToast('Image size must be less than 5MB', 'error');
        return;
    }

    // Preview the image immediately
    const reader = new FileReader();
    reader.onload = function (e) {
        const profilePhotoDisplay = document.getElementById('profile-photo-display');
        if (profilePhotoDisplay) {
            profilePhotoDisplay.src = e.target.result;
        }

        // Upload to backend
        uploadProfilePhoto(e.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Upload profile photo to backend
 * @param {String} base64Image - Base64 encoded image data
 */
function uploadProfilePhoto(base64Image) {
    if (!window.currentProfileUserId) {
        if (window.showToast) window.showToast('Please create a profile first', 'error');
        return;
    }

    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('updateProfilePhoto', {
            userId: window.currentProfileUserId,
            photoData: base64Image
        }, (response) => {
            if (response.status === 'success') {
                if (window.showToast) window.showToast('Profile photo updated successfully');
                // Optionally refresh profile data
                // fetchProfileData(window.currentProfileUserId);
            } else {
                console.error('Failed to upload photo:', response.message);
                if (window.showToast) window.showToast('Failed to upload photo: ' + response.message, 'error');
            }
        });
    } else {
        console.error('sendDataToGoogle function not found');
        if (window.showToast) window.showToast('Upload function not available', 'error');
    }
}
