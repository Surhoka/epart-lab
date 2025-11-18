window.initLoginPage = function() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const submitButton = document.getElementById('submitButton');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const eyeIcon = togglePassword.querySelector('svg path:last-child'); // Select the second path for the eye
            if (type === 'password') {
                // Show password (open eye)
                eyeIcon.setAttribute('d', 'M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z');
            } else {
                // Hide password (closed eye)
                eyeIcon.setAttribute('d', 'M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7 1.274-4.057 5.065-7 9.542-7a9.95 9.95 0 011.825.125M17.5 12a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0zM12 17.5V12m0-5.5V12m5.5 0H12m-5.5 0H12');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                alert('User Name and password are required!');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';

            try {
                // Assuming google.script.run is available for Apps Script communication
                // Use window.sendDataToGoogle for Apps Script communication
                window.sendDataToGoogle(
                    'processLogin', // The Apps Script function name
                    { username: username, password: password }, // Data to send
                    handleLoginSuccess, // Success handler
                    handleLoginFailure // Failure handler
                );
            } catch (error) {
                console.error('Error initiating Apps Script call:', error);
                alert('An unexpected error occurred. Please try again.');
                submitButton.disabled = false;
                submitButton.textContent = 'Sign In';
            }
        });
    }

    function handleLoginSuccess(response) {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
        if (response.status === 'success') {
            window.showToast('Login successful! Redirecting...', 'success');
            // Redirect to dashboard or home page within the SPA
            localStorage.setItem('loggedInUser', JSON.stringify(response.data)); // Store user data
            window.location.href = '#/dashboard'; // Redirect to the main SPA file with dashboard hash
        } else {
            window.showToast('Login failed: ' + response.message, 'error');
        }
    }

    function handleLoginFailure(error) {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
        console.error('Login error:', error);
        alert('Login failed: ' + error.message || 'Invalid credentials.');
    }
};
