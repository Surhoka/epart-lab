function initSignupPage() {
    const signupButton = document.querySelector('button.bg-brand-500'); // Select the Sign Up button
    if (signupButton) {
        // Remove existing event listeners by cloning
        const newButton = signupButton.cloneNode(true);
        signupButton.parentNode.replaceChild(newButton, signupButton);

        newButton.addEventListener('click', handleSignup);
    }
}

function handleSignup(e) {
    if (e) e.preventDefault();

    const fname = document.getElementById('fname').value;
    const lname = document.getElementById('lname').value;
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

    sendDataToGoogle('registerUser', {
        fname: fname,
        lname: lname,
        email: email,
        password: password
    }, function (response) {
        btn.innerHTML = originalText;
        btn.disabled = false;

        if (response.status === 'success') {
            toast('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                const state = { page: 'signin', params: {} };
                window.location.hash = window.encodeState ? window.encodeState(state) : '#signin';
            }, 1500);
        } else {
            toast(response.message || 'Registration failed.', 'error');
        }
    });
}

// Initialize when script loads (for direct load) or when called by router
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignupPage);
} else {
    initSignupPage();
}
