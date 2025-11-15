
function initLoginPage() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitButton = document.getElementById('submitButton');

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
                'Content-Type': 'application/json', // Changed for better compatibility with Apps Script doPost
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
