function initSigninPage() {
    const signinButton = document.querySelector('button.bg-brand-500'); // Select the Sign In button
    if (signinButton) {
        // Remove existing event listeners by cloning
        const newButton = signinButton.cloneNode(true);
        signinButton.parentNode.replaceChild(newButton, signinButton);

        newButton.addEventListener('click', handleSignin);
    }
}

function handleSignin(e) {
    if (e) e.preventDefault();

    const email = document.getElementById('email').value;
    // Assuming the password input is the one inside the relative div with toggle
    const passwordInput = document.querySelector('input[type="password"]') || document.querySelector('input[placeholder="Enter your password"]');
    const password = passwordInput ? passwordInput.value : '';

    // Basic Validation
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>';
    btn.disabled = true;

    const toast = (msg, type) => {
        if (typeof showToast === 'function') showToast(msg, type);
        else if (typeof window.showToast === 'function') window.showToast(msg, type);
        else alert(msg);
    };

    sendDataToGoogle('SignInUser', {
        email: email,
        password: password
    }, function (response) {
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (response.status === 'success') {
            toast('Signin successful!', 'success');

            // Store user session - now using response.data instead of response.user
            let user = response.data || response.user;
            if (user && user.id) {
                // Fetch full profile data to get pictureUrl
                sendDataToGoogle('getProfile', { userId: user.id }, (profileResponse) => {
                    if (profileResponse.status === 'success' && profileResponse.data) {
                        const fullProfile = profileResponse.data;
                        // Update the user object with full profile details including photo
                        user = {
                            ...user,
                            isLoggedIn: true,
                            firstName: fullProfile.personalInfo.firstName || user.fullName || user.name || 'User',
                            lastName: fullProfile.personalInfo.lastName || '',
                            email: fullProfile.personalInfo.email || user.email || '',
                            pictureUrl: fullProfile.personalInfo.profilePhoto || 'https://dummyimage.com/100'
                        };
                        console.log('User object being saved to localStorage (after full profile fetch):', user);
                        localStorage.setItem('signedInUser', JSON.stringify(user));

                        // Force update the Alpine.js app state to reflect the new user
                        if (window.app) {
                            window.app.currentUser = user;
                        }

                        // Proceed with navigation after full profile is fetched and saved
                        setTimeout(() => {
                            // Redirect to dashboard using the proper navigation function
                            if (window.navigate) {
                                window.navigate('dashboard');
                            } else {
                                // Fallback to direct hash change if navigate function is not available
                                window.location.hash = window.encodeState ? window.encodeState({ page: 'dashboard', params: {} }) : '#dashboard';
                            }
                            window.dispatchEvent(new Event('auth-status-changed'));
                        }, 50); // Reduced delay to 50ms

                    } else {
                        // If fetching full profile fails, proceed with basic user data
                        console.error('Failed to fetch full profile after sign-in:', profileResponse.message);
                        user = {
                            ...user,
                            isLoggedIn: true,
                            firstName: user.fullName || user.name || 'User',
                            lastName: '',
                            email: user.email || '',
                            pictureUrl: 'https://dummyimage.com/100' // Fallback
                        };
                        console.log('User object being saved to localStorage (fallback after full profile fetch fail):', user);
                        localStorage.setItem('signedInUser', JSON.stringify(user));
                        if (window.app) {
                            window.app.currentUser = user;
                        }
                        setTimeout(() => {
                            if (window.navigate) {
                                window.navigate('dashboard');
                            } else {
                                window.location.hash = window.encodeState ? window.encodeState({ page: 'dashboard', params: {} }) : '#dashboard';
                            }
                            window.dispatchEvent(new Event('auth-status-changed'));
                        }, 50);
                    }
                }, (error) => {
                    console.error('Error fetching full profile after sign-in:', error);
                    // In case of network error during full profile fetch, proceed with basic user data
                    user = {
                        ...user,
                        isLoggedIn: true,
                        firstName: user.fullName || user.name || 'User',
                        lastName: '',
                        email: user.email || '',
                        pictureUrl: 'https://dummyimage.com/100' // Fallback
                    };
                    console.log('User object being saved to localStorage (fallback after error):', user);
                    localStorage.setItem('signedInUser', JSON.stringify(user));
                    if (window.app) {
                        window.app.currentUser = user;
                    }
                    setTimeout(() => {
                        if (window.navigate) {
                            window.navigate('dashboard');
                        } else {
                            window.location.hash = window.encodeState ? window.encodeState({ page: 'dashboard', params: {} }) : '#dashboard';
                        }
                        window.dispatchEvent(new Event('auth-status-changed'));
                    }, 50);
                });
            } else {
                // Fallback if initial user object is invalid
                toast('Signin failed: Invalid user data.', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            toast(response.message || 'Signin failed. Please check your credentials.', 'error');
        }
    });
}

// Initialize when script loads
initSigninPage();

// Also re-initialize when SPA navigates back to this page
window.addEventListener('ezy:page-loaded', function (e) {
    if (e.detail && e.detail.page === 'signin') {
        console.log("Signin page loaded, re-initializing...");
        initSigninPage();
    }
});
