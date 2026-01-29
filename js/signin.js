const registerSignInPage = () => {
    if (window.Alpine && !window.Alpine.data('signInPage')) {
        window.Alpine.data('signInPage', () => ({
            email: '',
            password: '',

            handleSignin(button) {
                if (!this.email || !this.password) {
                    window.showToast('Email and password are required.', 'error');
                    return;
                }

                window.setButtonLoading(button, true);

                window.sendDataToGoogle('SignInUser', {
                    email: this.email,
                    password: this.password
                }, (response) => {
                    window.setButtonLoading(button, false);

                    if (response.status === 'success') {
                        window.showToast('Signin successful!', 'success');
                        let user = response.data || response.user;
                        if (user && user.id) {
                            this.fetchFullProfileAndLogin(user);
                        } else {
                            window.showToast('Signin failed: Invalid user data.', 'error');
                        }
                    } else {
                        window.showToast(response.message || 'Signin failed. Please check your credentials.', 'error');
                    }
                }, (err) => {
                    window.setButtonLoading(button, false);
                    window.showToast('API Error: ' + err.message, 'error');
                });
            },

            fetchFullProfileAndLogin(basicUser) {
                window.sendDataToGoogle('getProfile', { userId: basicUser.id }, (profileResponse) => {
                    let user = { ...basicUser }; // Start with basic info
                    if (profileResponse.status === 'success' && profileResponse.data) {
                        const fullProfile = profileResponse.data;
                        user = {
                            ...user,
                            isLoggedIn: true,
                            firstName: fullProfile.personalInfo.firstName || user.fullName || user.name || 'User',
                            lastName: fullProfile.personalInfo.lastName || '',
                            email: fullProfile.personalInfo.email || user.email || '',
                            pictureUrl: fullProfile.personalInfo.profilePhoto || 'https://dummyimage.com/100'
                        };
                    } else {
                        // Fallback if fetching full profile fails
                        console.error('Failed to fetch full profile after sign-in:', profileResponse.message);
                        user = {
                            ...user,
                            isLoggedIn: true,
                            firstName: user.fullName || user.name || 'User',
                            lastName: '',
                            email: user.email || '',
                            pictureUrl: 'https://dummyimage.com/100'
                        };
                    }
                    this.completeLogin(user);
                }, (error) => {
                    // Fallback on network error
                    console.error('Error fetching full profile after sign-in:', error);
                    const user = {
                        ...basicUser,
                        isLoggedIn: true,
                        firstName: basicUser.fullName || basicUser.name || 'User',
                        lastName: '',
                        email: basicUser.email || '',
                        pictureUrl: 'https://dummyimage.com/100'
                    };
                    this.completeLogin(user);
                });
            },

            completeLogin(user) {
                localStorage.setItem('signedInUser', JSON.stringify(user));
                if (window.app) {
                    window.app.currentUser = user;
                }
                setTimeout(() => {
                    window.navigate('dashboard');
                    window.dispatchEvent(new Event('auth-status-changed'));
                }, 50);
            }
        }));
    }
};

if (window.Alpine) {
    registerSignInPage();
} else {
    document.addEventListener('alpine:init', registerSignInPage);
}
