// profile.js
window.initProfilePage = function() {
    // Modal logic
    const modal = document.getElementById("profileModal");
    const editForm = document.getElementById("editForm");
    const modalFormFields = document.getElementById("modal-form-fields");
    const closeButton = document.getElementById("closeModalBtn");
    const cancelButton = document.getElementById("cancelBtn");

    let currentSection = '';

    // Data profil awal (akan diisi dari server)
    let profileData = {}; // Initialize as empty object

    // Moved finalizeForm to a higher scope
    const finalizeForm = () => {
      modal.classList.add("hidden");
      const submitButton = editForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Save';
      }
    };

    const fieldConfigs = {
      meta: [
        { id: "name", label: "Full Name", type: "text" },
        { id: "title", label: "Title", type: "text" },
        { id: "location", label: "Location", type: "text" }
      ],
      info: [
        { id: "firstName", label: "First Name", type: "text" },
        { id: "lastName", label: "Last Name", type: "text" },
        { id: "email", label: "Email", type: "email" },
        { id: "phone", label: "Phone", type: "text" },
        { id: "bio", label: "Bio", type: "textarea" }
      ],
      address: [
        { id: "country", label: "Country", type: "text" },
        { id: "cityState", label: "City/State", type: "text" },
        { id: "postalCode", label: "Postal Code", "type": "text" },
        { id: "taxId", label: "TAX ID", type: "text" }
      ],
      account: [
        { id: "userName", label: "User Name", type: "text" }, // Added for direct User Name field
        { id: "email", label: "Email", type: "email" }, // Keep email for consistency if needed elsewhere
        { id: "password", label: "New Password", type: "password" } // For changing password
      ]
    };

    function createInputField(field, value) {
      const div = document.createElement("div");
      div.className = "flex flex-col";
      const label = document.createElement("label");
      label.htmlFor = field.id;
      label.className = "text-xs text-gray-500 mb-1";
      label.textContent = field.label;
      div.appendChild(label);
      let inputElement;
      if (field.type === "textarea") {
        inputElement = document.createElement("textarea");
        inputElement.rows = 3;
      } else if (field.type === "file") {
        inputElement = document.createElement("input");
        inputElement.type = "file";
        inputElement.accept = "image/*";
      } else {
        inputElement = document.createElement("input");
        inputElement.type = field.type;
      }
      inputElement.id = field.id;
      inputElement.name = field.id;
      inputElement.className = "border p-2 rounded";
      if (field.type !== "file") {
        inputElement.value = value || '';
      }
      div.appendChild(inputElement);
      return div;
    }

    function openEditModal(section) {
      currentSection = section;
      document.getElementById('modalTitle').textContent = 'Edit Data for ' + section.charAt(0).toUpperCase() + section.slice(1);
      modalFormFields.innerHTML = '';
      const fields = fieldConfigs[section];
      // Ensure profileData[section] exists before accessing its properties
      if (!profileData[section]) {
        profileData[section] = {}; 
      }
      fields.forEach(field => {
        modalFormFields.appendChild(createInputField(field, profileData[section][field.id]));
      });
      modal.classList.remove("hidden");
    }

    async function saveProfileData(event) {
      event.preventDefault();
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      submitButton.textContent = 'Saving...';

      // Create a plain object from the form data instead of FormData
      const formData = new FormData(editForm);
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      // Construct the payload for the server
      const payload = {
        action: 'saveProfileDataOnServer',
        section: currentSection,
        ...data // Spread the form data into the payload
      };

      // Convert payload to URL-encoded string for application/x-www-form-urlencoded
      const urlEncodedPayload = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();

      // Use sendDataToGoogle (JSONP) for saving data to bypass CORS issues
      sendDataToGoogle('saveProfileDataOnServer', payload, (result) => {
        if (result.status === 'success') {
          console.log('Save successful.', result);
          
          // Update local profileData object from the form data we just sent
          profileData[currentSection] = { ...profileData[currentSection], ...data };
          
          // If the 'meta' section was updated and a new name is returned, update localStorage
          if (currentSection === 'meta' && result.name) {
              let user = JSON.parse(localStorage.getItem('loggedInUser'));
              if (user) {
                  user.fullName = result.name; // Assuming 'name' from payload maps to 'fullName' in localStorage
                  localStorage.setItem('loggedInUser', JSON.stringify(user));
                  window.handleAuthUI(); // Re-render header with updated localStorage data
              }
          }

          renderProfileData();
          showToast('Data berhasil disimpan!', 'success');
        } else {
          console.error('Server-side logical error result:', result);
          showToast('Error menyimpan data: ' + (result.message || 'Terjadi kesalahan tidak dikenal.'), 'error');
        }
        finalizeForm();
      }, (error) => {
        console.error('Error saving data (sendDataToGoogle callback):', error);
        showToast('Terjadi kesalahan saat menyimpan data: ' + (error.message || 'Terjadi kesalahan tidak dikenal.'), 'error');
        finalizeForm();
      });
    }

    function renderProfileData() {
      console.log("renderProfileData: profileData.meta:", profileData.meta); // Added log
      // Update profile photo
      const profilePhotoElement = document.getElementById('profile-photo');
      if (profilePhotoElement && profileData.meta && profileData.meta.profilePhotoUrl) { // Added check for profileData.meta
        profilePhotoElement.src = profileData.meta.profilePhotoUrl;
      } else if (profilePhotoElement) {
          profilePhotoElement.src = 'https://dummyimage.com/100'; // Default image
      }

      // Update User Meta Card
      if (profileData.meta) { // Added check for profileData.meta
        const nameEl = document.getElementById('profile-name');
        const metaEl = document.getElementById('profile-title-location');
        if(nameEl) nameEl.textContent = profileData.meta.name;
        if(metaEl) metaEl.textContent = profileData.meta.title + ' · ' + profileData.meta.location;
      }

      // Update User Info Card
      const infoDisplayContainer = document.getElementById('info-display');
      if (infoDisplayContainer && profileData.info) { // Added check for profileData.info
        for (const field in profileData.info) {
          const displayElement = infoDisplayContainer.querySelector('[data-field="' + field + '"]');
          if (displayElement) displayElement.textContent = profileData.info[field];
        }
      }

      // Update User Address Card
      const addressDisplayContainer = document.getElementById('address-display');
      if (addressDisplayContainer && profileData.address) { // Added check for profileData.address
        for (const field in profileData.address) {
          const displayElement = addressDisplayContainer.querySelector('[data-field="' + field + '"]');
          if (displayElement) displayElement.textContent = profileData.address[field];
        }
      }

      // Update Account Information Card
      const accountDisplayContainer = document.getElementById('account-display');
      if (accountDisplayContainer && profileData.account) { // Added check for profileData.account
        const userNameDisplayElement = accountDisplayContainer.querySelector('[data-field="userName"]');
        if (userNameDisplayElement) {
          userNameDisplayElement.textContent = profileData.account.userName || '';
        }
        // Password is not displayed directly for security reasons
      }
      
      // Update header with profile info
      const profilePictureHeader = document.getElementById('profile-picture');
      const usernameDisplayHeader = document.getElementById('username-display');
      const dropdownUsernameDisplayHeader = document.getElementById('dropdown-username-display');

      if (profileData.meta) {
          if (usernameDisplayHeader) {
              usernameDisplayHeader.textContent = profileData.meta.name || 'User';
          }
          if (dropdownUsernameDisplayHeader) {
              dropdownUsernameDisplayHeader.textContent = profileData.meta.name || 'User';
          }
          if (profilePictureHeader && profileData.meta.profilePhotoUrl) {
              profilePictureHeader.src = profileData.meta.profilePhotoUrl;
          } else if (profilePictureHeader) {
              profilePictureHeader.src = 'https://dummyimage.com/100'; // Default image for header
          }
      }
    }

    // Fetch initial profile data when the page is loaded
        function loadProfileData() {
      console.log("Attempting to load profile data from sheet...");
      sendDataToGoogle('readProfileDataFromSheet', {}, (response) => {
        console.log("Profile data received in success handler:", response); // Modified log
        profileData = response.data; // Extract the actual profile data from the normalized response
        // Convert Google Drive URL for profile photo to embeddable format if necessary
        if (profileData.meta && profileData.meta.profilePhotoUrl) {
          try {
            const url = new URL(profileData.meta.profilePhotoUrl);
            const fileId = url.searchParams.get("id");
            if (fileId) {
              profileData.meta.profilePhotoUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
            }
          } catch (e) {
            console.error('Error parsing loaded profile photo URL:', e);
          }
        }
        renderProfileData();
      }, (error) => {    console.error('Error loading profile data:', error);
        showToast('Terjadi kesalahan saat memuat data profil: ' + error.message, 'error');
      });
    }

    // Event Listeners
    document.getElementById('editMetaBtn').onclick = () => openEditModal('meta');
    document.getElementById('editInfoBtn').onclick = () => openEditModal('info');
    document.getElementById('editAddressBtn').onclick = () => openEditModal('address');
    document.getElementById('editAccountBtn').onclick = () => openEditModal('account');
    closeButton.onclick = () => modal.classList.add("hidden");
    cancelButton.onclick = () => modal.classList.add("hidden");
    editForm.onsubmit = saveProfileData;

    // New photo upload logic
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const profilePhotoUploadInput = document.getElementById('profile-photo-upload');

    if (uploadPhotoBtn && profilePhotoUploadInput) {
        uploadPhotoBtn.addEventListener('click', () => {
            profilePhotoUploadInput.click();
        });

        profilePhotoUploadInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            showToast('Mengunggah foto profil...', 'info', 5000);
            uploadPhotoBtn.disabled = true;
            uploadPhotoBtn.textContent = 'Uploading...';

            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1]; // Get base64 string without data:image/png;base64,
                const fileName = `profile_photo_${Date.now()}.${file.name.split('.').pop()}`;
                
                // Revert to fetch POST for image upload due to potential GET URL size limits
                const uploadPayload = {
                    action: 'uploadFile',
                    fileName: fileName,
                    fileData: base64data,
                    fileType: file.type
                };

                fetch(appsScriptUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // Use JSON for direct POST
                    },
                    body: JSON.stringify(uploadPayload)
                })
                .then(response => {
                    if (!response.ok) {
                        return response.text().then(text => {
                            throw new Error(`Network response was not ok: ${response.statusText} - ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(response => {
                    if (response.status === 'success' && response.url) {
                        profileData.meta.profilePhotoUrl = response.url;
                        // Save the new URL to the spreadsheet using JSONP (sendDataToGoogle)
                        sendDataToGoogle('saveProfileDataOnServer', {
                            section: 'meta',
                            profilePhotoUrl: response.url
                        }, (saveResponse) => {
                            if (saveResponse.status === 'success') {
                                renderProfileData();
                                showToast('Foto profil berhasil diunggah dan disimpan!', 'success');
                            } else {
                                showToast('Gagal menyimpan URL foto profil: ' + (saveResponse.message || 'Terjadi kesalahan.'), 'error');
                            }
                            uploadPhotoBtn.disabled = false;
                            uploadPhotoBtn.textContent = 'Upload Photo';
                        }, (saveError) => {
                            showToast('Error menyimpan URL foto profil: ' + (saveError.message || 'Terjadi kesalahan.'), 'error');
                            uploadPhotoBtn.disabled = false;
                            uploadPhotoBtn.textContent = 'Upload Photo';
                        });
                    } else {
                        showToast('Gagal mengunggah foto: ' + (response.message || 'Terjadi kesalahan tidak dikenal.'), 'error');
                        uploadPhotoBtn.disabled = false;
                        uploadPhotoBtn.textContent = 'Upload Photo';
                    }
                })
                .catch(error => {
                    console.error('Error during photo upload (fetch catch):', error);
                    showToast('Terjadi kesalahan saat mengunggah foto: ' + (error.message || 'Terjadi kesalahan tidak dikenal.'), 'error');
                    uploadPhotoBtn.disabled = false;
                    uploadPhotoBtn.textContent = 'Upload Photo';
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // Initial load of profile data
    loadProfileData();
}
