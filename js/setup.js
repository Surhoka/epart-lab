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
        
        const publicWebappUrl = document.getElementById('public-webapp-url') ? document.getElementById('public-webapp-url').value : '';
        const dbSetup = document.querySelector('input[name="db-setup"]:checked') ? document.querySelector('input[name="db-setup"]:checked').value : 'auto';
        const dbName = document.getElementById('db-name') ? document.getElementById('db-name').value : '';
        const sheetId = document.getElementById('sheet-id') ? document.getElementById('sheet-id').value : '';

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
            token: token,
            publicWebappUrl: publicWebappUrl,
            dbSetup: dbSetup,
            dbName: dbName,
            sheetId: sheetId
        });

        const scriptUrl = webAppUrl;

        fetch(`${scriptUrl}?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    localStorage.setItem('EzypartsConfig', JSON.stringify(data));
                    alert('Configuration saved successfully!');
                    window.location.hash = '#dashboard'; // Redirect to dashboard
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
