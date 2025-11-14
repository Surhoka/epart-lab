window.initProfilePage = function() {
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');
    const profileLink = document.getElementById('profile-link');
    const profilePictureHeader = document.getElementById('profile-picture');
    const usernameDisplayHeader = document.getElementById('username-display');
    const loginModal = document.getElementById('loginModal');
    const closeLoginModalButton = document.getElementById('closeLoginModal');
    const loginForm = document.getElementById('loginForm');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');

    const profilePictureDisplay = document.getElementById('profile-picture-display');
    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const editUsernameInput = document.getElementById('edit-username');
    const editEmailInput = document.getElementById('edit-email');
    const editPhoneInput = document.getElementById('edit-phone');
    const editAddressInput = document.getElementById('edit-address');
    const saveProfileButton = document.getElementById('save-profile-button');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const changePasswordButton = document.getElementById('change-password-button');
    const profileImageUploadInput = document.getElementById('profile-image-upload');
    const uploadImageButton = document.getElementById('upload-image-button');

    // Function to update UI based on login status
    function updateAuthUI(user) {
        if (user && user.isLoggedIn) {
            loginButton.classList.add('hidden');
            logoutButton.classList.remove('hidden');
            profileLink.classList.remove('hidden');
            profilePictureHeader.src = user.pictureUrl || 'https://via.placeholder.com/32';
            usernameDisplayHeader.textContent = user.username;

            // Update profile page fields if on profile page
            if (document.getElementById('profile-details')) {
                profilePictureDisplay.src = user.pictureUrl || 'https://via.placeholder.com/96';
                profileUsername.textContent = user.username;
                profileEmail.textContent = user.email;
                editUsernameInput.value = user.username;
                editEmailInput.value = user.email;
                editPhoneInput.value = user.phone || '';
                editAddressInput.value = user.address || '';
            }
        } else {
            loginButton.classList.remove('hidden');
            logoutButton.classList.add('hidden');
            profileLink.classList.add('hidden');
            profilePictureHeader.src = '';
            usernameDisplayHeader.textContent = '';

            // Clear profile page fields if on profile page
            if (document.getElementById('profile-details')) {
                profilePictureDisplay.src = 'https://via.placeholder.com/96';
                profileUsername.textContent = 'Guest';
                profileEmail.textContent = 'guest@example.com';
                editUsernameInput.value = '';
                editEmailInput.value = '';
                editPhoneInput.value = '';
                editAddressInput.value = '';
            }
        }
    }

    // Check login status on page load
    function checkLoginStatus() {
        window.sendDataToGoogle('checkLoginStatus', {}, (response) => {
            if (response.status === 'success' && response.data) {
                updateAuthUI(response.data);
            } else {
                updateAuthUI({ isLoggedIn: false });
            }
        });
    }

    // Event Listeners for Login/Logout
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }

    if (closeLoginModalButton) {
        closeLoginModalButton.addEventListener('click', () => {
            loginModal.classList.add('hidden');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;

            window.sendDataToGoogle('login', { email, password }, (response) => {
                if (response.status === 'success') {
                    window.showToast('Login successful!', 'success');
                    loginModal.classList.add('hidden');
                    checkLoginStatus(); // Update UI after successful login
                } else {
                    window.showToast(response.message || 'Login failed.', 'error');
                }
            });
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.sendDataToGoogle('logout', {}, (response) => {
                if (response.status === 'success') {
                    window.showToast('Logout successful!', 'success');
                    checkLoginStatus(); // Update UI after successful logout
                } else {
                    window.showToast(response.message || 'Logout failed.', 'error');
                }
            });
        });
    }

    // Profile Page Specific Logic
    if (saveProfileButton) {
        saveProfileButton.addEventListener('click', () => {
            const updatedProfile = {
                username: editUsernameInput.value,
                email: editEmailInput.value,
                phone: editPhoneInput.value,
                address: editAddressInput.value
            };
            window.sendDataToGoogle('updateProfile', updatedProfile, (response) => {
                if (response.status === 'success') {
                    window.showToast('Profile updated successfully!', 'success');
                    checkLoginStatus(); // Refresh UI with new data
                } else {
                    window.showToast(response.message || 'Failed to update profile.', 'error');
                }
            });
        });
    }

    if (changePasswordButton) {
        changePasswordButton.addEventListener('click', () => {
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (newPassword !== confirmPassword) {
                window.showToast('New password and confirmation do not match.', 'error');
                return;
            }

            window.sendDataToGoogle('changePassword', { currentPassword, newPassword }, (response) => {
                if (response.status === 'success') {
                    window.showToast('Password changed successfully!', 'success');
                    currentPasswordInput.value = '';
                    newPasswordInput.value = '';
                    confirmPasswordInput.value = '';
                } else {
                    window.showToast(response.message || 'Failed to change password.', 'error');
                }
            });
        });
    }

    if (uploadImageButton) {
        uploadImageButton.addEventListener('click', async () => {
            const file = profileImageUploadInput.files[0];
            if (!file) {
                window.showToast('Please select an image to upload.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileData = e.target.result.split(',')[1]; // Get base64 content
                const fileName = file.name;
                const fileType = file.type;

                try {
                    const response = await window.uploadImageAndGetUrl(fileName, fileData, fileType);
                    if (response.status === 'success' && response.url) {
                        window.showToast('Profile picture uploaded successfully!', 'success');
                        // Update profile with new picture URL
                        window.sendDataToGoogle('updateProfile', { pictureUrl: response.url }, (updateResponse) => {
                            if (updateResponse.status === 'success') {
                                checkLoginStatus(); // Refresh UI with new picture
                            } else {
                                window.showToast(updateResponse.message || 'Failed to update profile with new picture URL.', 'error');
                            }
                        });
                    } else {
                        window.showToast(response.message || 'Failed to upload profile picture.', 'error');
                    }
                } catch (error) {
                    window.showToast('Error uploading image: ' + error.message, 'error');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // Initial check when profile page is loaded
    checkLoginStatus();
}
