const registerSignUpPage = () => {
    if (window.Alpine && !window.Alpine.data('signUpPage')) {
        window.Alpine.data('signUpPage', () => ({
            fname: '',
            lname: '',
            email: '',
            password: '',

            handleSignup(button) {
                if (!this.fname || !this.lname || !this.email || !this.password) {
                    window.showToast('All fields are required.', 'error');
                    return;
                }

                window.setButtonLoading(button, true);

                window.sendDataToGoogle('registerUser', {
                    fname: this.fname,
                    lname: this.lname,
                    email: this.email,
                    password: this.password
                }, (response) => {
                    window.setButtonLoading(button, false);

                    if (response.status === 'success') {
                        window.showToast('Registration successful! Please sign in.', 'success');
                        setTimeout(() => {
                            window.navigate('signin');
                        }, 1500);
                    } else {
                        window.showToast(response.message || 'Registration failed.', 'error');
                    }
                }, (err) => {
                    window.setButtonLoading(button, false);
                    window.showToast('API Error: ' + err.message, 'error');
                });
            }
        }));
    }
};

if (window.Alpine) {
    registerSignUpPage();
} else {
    document.addEventListener('alpine:init', registerSignUpPage);
}
