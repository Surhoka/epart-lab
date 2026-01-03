document.addEventListener('DOMContentLoaded', function () {
    const setupForm = document.getElementById('setup-form');
    const roleSelector = document.getElementById('role');
    const tokenGroup = document.getElementById('token-group');

    roleSelector.addEventListener('change', function () {
        if (this.value === 'Admin') {
            tokenGroup.style.display = 'block';
        } else {
            tokenGroup.style.display = 'none';
        }
    });

    setupForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const webAppUrl = document.getElementById('webapp-url').value;
        const role = roleSelector.value;
        const token = document.getElementById('token').value;

        if (!webAppUrl) {
            alert('Please enter a valid WebApp URL.');
            return;
        }

        if (role === 'Admin' && !token) {
            alert('Please enter a token for the Admin role.');
            return;
        }

        const params = new URLSearchParams({
            role: role,
            url: webAppUrl,
            token: token
        });

        const scriptUrl = webAppUrl;

        fetch(`${scriptUrl}?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.role && data.url) {
                    localStorage.setItem('EzypartsConfig', JSON.stringify(data));
                    alert('Configuration saved successfully!');
                } else {
                    alert('Error saving configuration.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while saving the configuration.');
            });
    });
});