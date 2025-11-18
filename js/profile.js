// profile.js
window.initProfilePage = function() {
    const modal = document.getElementById("profileModal");
    const editForm = document.getElementById("editForm");
    const modalFormFields = document.getElementById("modal-form-fields");
    const closeButton = document.getElementById("closeModalBtn");
    const cancelButton = document.getElementById("cancelBtn");

    let currentSection = '';
    let profileData = {};

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
        { id: "postalCode", label: "Postal Code", type: "text" },
        { id: "taxId", label: "TAX ID", type: "text" }
      ],
      account: [
        { id: "userName", label: "User Name", type: "text" },
        { id: "email", label: "Email", type: "email" },
        { id: "password", label: "New Password", type: "password" }
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
      } else {
        inputElement = document.createElement("input");
        inputElement.type = field.type;
      }
      inputElement.id = field.id;
      inputElement.name = field.id;
      inputElement.className = "border p-2 rounded";
      inputElement.value = value || '';
      div.appendChild(inputElement);
      return div;
    }

    function openEditModal(section) {
      currentSection = section;
      document.getElementById('modalTitle').textContent = 'Edit Data for ' + section;
      modalFormFields.innerHTML = '';
      const fields = fieldConfigs[section];
      if (!profileData[section]) profileData[section] = {};
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
      const data = {};
      formData.forEach((value, key) => { data[key] = value; });

      const payload = {
        action: 'saveProfileDataOnServer',
        section: currentSection,
        ...data
      };

      // JSONP call
      sendDataToGoogle('saveProfileDataOnServer', payload, (result) => {
        if (result.status === 'success') {
          profileData[currentSection] = { ...profileData[currentSection], ...data };
          renderProfileData();
          showToast('Data berhasil disimpan!', 'success');
        } else {
          showToast('Error menyimpan data: ' + (result.message || 'Terjadi kesalahan.'), 'error');
        }
        finalizeForm();
      }, (error) => {
        showToast('Terjadi kesalahan saat menyimpan data: ' + error.message, 'error');
        finalizeForm();
      });
    }

    function renderProfileData() {
      const profilePhotoElement = document.getElementById('profile-photo');
      if (profilePhotoElement) {
        profilePhotoElement.src = (profileData.meta && profileData.meta.profilePhotoUrl) || 'https://dummyimage.com/100';
      }
      const nameEl = document.getElementById('profile-name');
      const metaEl = document.getElementById('profile-title-location');
      if (nameEl) nameEl.textContent = profileData.meta?.name || '';
      if (metaEl) metaEl.textContent = (profileData.meta?.title || '') + ' · ' + (profileData.meta?.location || '');

      // Render info section
      const infoDisplay = document.getElementById('info-display');
      if (infoDisplay && profileData.info) {
        for (const field in profileData.info) {
          const element = infoDisplay.querySelector(`[data-field="${field}"]`);
          if (element) element.textContent = profileData.info[field];
        }
      }

      // Render address section
      const addressDisplay = document.getElementById('address-display');
      if (addressDisplay && profileData.address) {
        for (const field in profileData.address) {
          const element = addressDisplay.querySelector(`[data-field="${field}"]`);
          if (element) element.textContent = profileData.address[field];
        }
      }

      // Render account section
      const accountDisplay = document.getElementById('account-display');
      if (accountDisplay && profileData.account) {
        for (const field in profileData.account) {
          const element = accountDisplay.querySelector(`[data-field="${field}"]`);
          if (element) element.textContent = profileData.account[field];
        }
      }
    }

    function loadProfileData() {
      sendDataToGoogle('readProfileDataFromSheet', {}, (response) => {
        profileData = response;
        renderProfileData();
      }, (error) => {
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

    // Upload foto profil dengan JSONP
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const profilePhotoUploadInput = document.getElementById('profile-photo-upload');

    if (uploadPhotoBtn && profilePhotoUploadInput) {
      uploadPhotoBtn.addEventListener('click', () => profilePhotoUploadInput.click());

      profilePhotoUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        showToast('Mengunggah foto profil...', 'info', 5000);
        uploadPhotoBtn.disabled = true;
        uploadPhotoBtn.textContent = 'Uploading...';

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          const fileName = `profile_photo_${Date.now()}.${file.name.split('.').pop()}`;

          const payload = {
            action: 'uploadFile',
            fileName: fileName,
            fileData: base64data,
            fileType: file.type
          };

          // JSONP upload
          sendDataToGoogle('uploadFile', payload, (response) => {
            if (response.status === 'success' && response.url) {
              profileData.meta.profilePhotoUrl = response.url;
              // Simpan URL ke sheet
              sendDataToGoogle('saveProfileDataOnServer', {
                section: 'meta',
                profilePhotoUrl: response.url
              }, (saveResponse) => {
                if (saveResponse.status === 'success') {
                  renderProfileData();
                  showToast('Foto profil berhasil diunggah!', 'success');
                } else {
                  showToast('Gagal menyimpan URL foto profil: ' + (saveResponse.message || 'Error'), 'error');
                }
                uploadPhotoBtn.disabled = false;
                uploadPhotoBtn.textContent = 'Upload Photo';
              });
            } else {
              showToast('Gagal mengunggah foto: ' + (response.message || 'Error'), 'error');
              uploadPhotoBtn.disabled = false;
              uploadPhotoBtn.textContent = 'Upload Photo';
            }
          }, (error) => {
            showToast('Error upload foto: ' + error.message, 'error');
            uploadPhotoBtn.disabled = false;
            uploadPhotoBtn.textContent = 'Upload Photo';
          });
        };
        reader.readAsDataURL(file);
      });
    }

    // Initial load
    loadProfileData();
}
