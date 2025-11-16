// profile.js
function initProfilePage() {

    // Modal logic
    const modal = document.getElementById("profileModal");
    const editForm = document.getElementById("editForm");
    const modalFormFields = document.getElementById("modal-form-fields");
    const closeButton = document.getElementById("closeModalBtn");
    const cancelButton = document.getElementById("cancelBtn");

    let currentSection = '';

    // Data profil awal (akan diisi dari server)
    let profileData = {}; // Initialize as empty object

    const fieldConfigs = {
      meta: [
        { id: "profilePhoto", label: "Profile Photo", type: "file" },
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
        { id: "postalCode", label: "Postal Code", type: "text" },
        { id: "taxId", label: "TAX ID", type: "text" }
      ],
      account: [
        { id: "email", label: "Username (Email)", type: "email" },
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

      const formData = new FormData(editForm);
      const updatedData = {};
      for (let [key, value] of formData.entries()) {
          if (key !== 'profilePhoto') {
              updatedData[key] = value;
          }
      }

      const profilePhotoFile = formData.get('profilePhoto');
      if (currentSection === 'meta' && profilePhotoFile && profilePhotoFile.size > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          updatedData.profilePhoto = e.target.result; // base64 string
          sendDataToBackend(updatedData);
        };
        reader.readAsDataURL(profilePhotoFile);
      } else {
        sendDataToBackend(updatedData);
      }
    }

    function sendDataToBackend(data) {
      const payload = {
        action: 'saveProfileDataOnServer',
        targetSheet: 'profile',
        section: currentSection,
        profileData: data
      };

      const finalizeForm = () => {
        modal.classList.add("hidden");
        const submitButton = editForm.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Save';
      };

      // Construct the URL for the proxy GET request
      const proxyPayload = {
        action: 'proxyPost',
        payload: JSON.stringify(payload)
      };
      const queryString = new URLSearchParams(proxyPayload).toString();
      const proxyUrl = `${appsScriptUrl}?${queryString}`;

      fetch(proxyUrl, {
        method: 'GET' // Change to GET method for proxy
      })
      .then(response => response.json())
      .then(result => {
        if (result.status === 'success') {
          console.log('Save successful.');
          // Update local data object
          profileData[currentSection] = { ...profileData[currentSection], ...data };
          
          if (result.imageUrl) {
            try {
              const url = new URL(result.imageUrl);
              const fileId = url.searchParams.get("id");
              if (fileId) {
                profileData.meta.profilePhotoUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
              } else {
                profileData.meta.profilePhotoUrl = result.imageUrl;
              }
            } catch (e) {
              console.error('Error parsing profile photo URL:', e);
              profileData.meta.profilePhotoUrl = result.imageUrl;
            }
          }

          renderProfileData(); // Re-render data di halaman
          showToast('Data berhasil disimpan!', 'success'); // Use showToast from Admin Dashboard
        } else {
          // Handle server-side logical error
          showToast('Error menyimpan data: ' + (result.message || 'Terjadi kesalahan tidak dikenal.'), 'error');
        }
        finalizeForm();
      })
      .catch(error => {
        console.error('Error saving data:', error);
        showToast('Terjadi kesalahan saat menyimpan data: ' + (error.message || 'Terjadi kesalahan tidak dikenal.'), 'error'); // Use showToast from Admin Dashboard
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
          profilePhotoElement.src = 'https://dummyimage.com/100x100'; // Default image
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
      if (accountDisplayContainer && profileData.info) { // Using profileData.info for email
        const emailDisplayElement = accountDisplayContainer.querySelector('[data-field="email"]');
        if (emailDisplayElement) emailDisplayElement.textContent = profileData.info.email;
        // Password is not displayed directly for security reasons
      }
      
      // Update header with profile info
      const userNameHeader = document.getElementById('user-name-header');
      const userPhotoHeader = document.getElementById('user-photo-header');
      if (profileData.meta) {
          if (userNameHeader) {
              userNameHeader.textContent = profileData.meta.name || 'User';
          }
          if (userPhotoHeader && profileData.meta.profilePhotoUrl) {
              userPhotoHeader.src = profileData.meta.profilePhotoUrl;
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

    // Initial load of profile data
    loadProfileData();
}

document.addEventListener('DOMContentLoaded', initProfilePage); // Re-added to ensure initialization
