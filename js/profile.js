function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }

    // Eye Icon functionality
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Toggle eye icon (simple example, could use different SVGs for open/closed eye)
            this.querySelector('svg').innerHTML = type === 'password'
                ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>`
                : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.879 13.879a3 3 0 11-4.242-4.242m4.242 4.242L21 21m-1.414-1.414L13.879 13.879m0 0L10.5 10.5m-4.242 4.242L3 3m1.414 1.414L10.5 10.5"/>`;
        });
    }

    // Remember Me functionality
    const emailInput = document.getElementById('email');
    const rememberMeCheckbox = document.getElementById('remember-me');

    // Load saved credentials
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');

    if (savedEmail && savedPassword && emailInput && passwordInput && rememberMeCheckbox) {
        emailInput.value = savedEmail;
        passwordInput.value = savedPassword;
        rememberMeCheckbox.checked = true;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMeCheckbox = document.getElementById('remember-me'); // Get checkbox reference
    const submitButton = document.getElementById('submitButton');

    // Handle "Remember me" state
    if (rememberMeCheckbox && rememberMeCheckbox.checked) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
    } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
    }

    // Disable button and show loading state
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <div class="spinner border-2 border-t-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin mr-2"></div>
        Signing In...
    `;

    try {
        const response = await fetch(window.appsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });

        const result = await response.json();

        if (result.status === 'success' && result.data.isLoggedIn) {
            // Store user data in localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(result.data));
            
            // Show success toast
            if (window.showToast) {
                window.showToast('Login successful!', 'success');
            }
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.hash = '#/dashboard';
                window.location.reload(); // Reload to update UI state based on login
            }, 1000);

        } else {
            // Show error toast
            if (window.showToast) {
                window.showToast(result.message || 'Invalid email or password.', 'error');
            }
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Sign In';
        }
    } catch (error) {
        console.error('Login error:', error);
        if (window.showToast) {
            window.showToast('An error occurred during login.', 'error');
        }
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    }
}
