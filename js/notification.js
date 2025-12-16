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

    const response = await fetch(window.appsScriptUrl + "?action=getApiStatusNotifications");
    const data = await response.json();

    // Validasi response
    if (data.status === "success" && Array.isArray(data.notifications)) {
      // Convert message from markdown to HTML
      app.notifications = data.notifications.map(notif => {
        if (notif.message && typeof window.marked === 'function') {
          notif.message = window.marked.parse(notif.message);
        }
        return notif;
      });
    } else if (Array.isArray(data)) {
      // fallback jika API langsung return array
      app.notifications = data.map(notif => {
        if (notif.message && typeof window.marked === 'function') {
          notif.message = window.marked.parse(notif.message);
        }
        return notif;
      });
    } else {
      app.notificationError = data.message || "Tidak ada notifikasi tersedia.";
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    app.notificationError = "Gagal memuat notifikasi.";
  } finally {
    app.isLoading = false;
  }
}
