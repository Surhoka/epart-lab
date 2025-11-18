window.initLoginPage = function() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const loginForm = document.getElementById('loginForm');
    const submitButton = document.getElementById('submitButton');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Optionally, change the eye icon based on visibility
            // For simplicity, we'll just toggle the type
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert('Email and password are required!');
                return;
            }

            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';

            try {
                // Assuming google.script.run is available for Apps Script communication
                // Use window.sendDataToGoogle for Apps Script communication
                window.sendDataToGoogle(
                    'processLogin', // The Apps Script function name
                    { email: email, password: password }, // Data to send
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
        if (response.success) {
            alert('Login successful! Redirecting...');
            // Redirect to dashboard or home page
            window.location.href = 'dashboard.html'; // Or any other success page
        } else {
            alert('Login failed: ' + response.message);
        }
    }

    function handleLoginFailure(error) {
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
        console.error('Login error:', error);
        alert('Login failed: ' + error.message || 'Invalid credentials.');
    }
};
