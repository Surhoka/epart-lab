// notifications.js
// Notification page initialization

// Function to load a script and return a promise
function loadScript(url) {
  return new Promise((resolve, reject) => {
    // Check if the script is already loaded
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });
}


window.initNotification = function () {
    console.log("Notification Page Initialized");
    initNotificationsPage();
    }
    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('Notification');
    }
async function initNotificationsPage() {
  const app = window.app; // akses state global dari appData
  app.isLoading = true;
  app.notifications = [];
  app.notificationError = '';

  try {
    // Load marked.js library
    await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');

    sendDataToGoogle('getApiStatusNotifications', {}, (data) => {
      // data is the normalized response. Notifications are in data.data
      if (data.status === "success" && Array.isArray(data.data)) {
        app.notifications = data.data.map(notif => {
          if (notif.message && typeof window.marked === 'function') {
            // Ensure message is a string before parsing
            if (typeof notif.message !== 'string') {
              notif.message = String(notif.message);
            }
            notif.message = window.marked.parse(notif.message);
          }
          return notif;
        });
      } else {
        app.notificationError = data.message || "Tidak ada notifikasi tersedia.";
      }
      app.isLoading = false; // Set loading to false inside the callback
    }, (error) => {
      console.error("Error fetching notifications:", error);
      app.notificationError = "Gagal memuat notifikasi.";
      app.isLoading = false; // Also here
    });

  } catch (error) {
    // This will only catch errors from loadScript
    console.error("Error loading dependencies:", error);
    app.notificationError = "Gagal memuat komponen notifikasi.";
    app.isLoading = false;
  }
}
