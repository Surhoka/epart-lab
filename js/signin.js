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
    if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return;
    }

    const btn = e.target;
    const originalText = btn.textContent;
    btn.innerHTML = '<div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>';
    btn.disabled = true;

    sendDataToGoogle('loginUser', {
        email: email,
        password: password
    }, function (response) {
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (response.status === 'success') {
            showToast('Login successful!', 'success');

            // Store user session
            const user = response.data || response.user;
            if (user) {
                user.isLoggedIn = true;
                localStorage.setItem('loggedInUser', JSON.stringify(user));

                // Update UI state if handleAuthUI exists
                if (window.handleAuthUI) {
                    window.handleAuthUI();
                }
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.hash = '#dashboard';
            }, 1000);
        } else {
            showToast(response.message || 'Login failed. Please check your credentials.', 'error');
        }
    });
}

// Initialize when script loads (for direct load) or when called by router
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSigninPage);
} else {
    initSigninPage();
}
