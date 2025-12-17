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
if (typeof window.renderBreadcrumb === 'function') {
  window.renderBreadcrumb('Notification');
}

window.initNotificationPage = initNotificationsPage;

async function initNotificationsPage() {
  try {
    // Initialize Breadcrumb
    if (typeof window.renderBreadcrumb === 'function') {
      window.renderBreadcrumb('Notification');
    }

    // Load marked.js library
    await loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');

    const user = JSON.parse(localStorage.getItem('signedInUser'));
    const userEmail = user ? user.email : null;

    // Check if we have cached notifications for today
    const today = new Date().toISOString().split('T')[0];
    const cachedData = JSON.parse(localStorage.getItem('notificationsCache') || '{}');

    // If we have cached data for today, use it immediately
    if (cachedData.date === today && Array.isArray(cachedData.notifications)) {
      const processedNotifications = cachedData.notifications.map(notif => {
        if (notif.message && typeof window.marked === 'function') {
          // Ensure message is a string before parsing
          if (typeof notif.message !== 'string') {
            notif.message = String(notif.message);
          }
          notif.message = window.marked.parse(notif.message);
        }
        return notif;
      });
      // Dispatch an event with the cached notifications
      console.log('Dispatching cached notifications-loaded event', processedNotifications);
      window.dispatchEvent(new CustomEvent('notifications-loaded', { detail: processedNotifications }));
    }

    // Always fetch fresh data from server to update cache
    sendDataToGoogle('getExistingNotifications', { email: userEmail }, (data) => {
      // data is the normalized response. Notifications are in data.data
      if (data.status === "success" && Array.isArray(data.data)) {
        const processedNotifications = data.data.map(notif => {
          if (notif.message && typeof window.marked === 'function') {
            // Ensure message is a string before parsing
            if (typeof notif.message !== 'string') {
              notif.message = String(notif.message);
            }
            notif.message = window.marked.parse(notif.message);
          }
          return notif;
        });
        // Dispatch an event with the notifications
        console.log('Dispatching notifications-loaded event', processedNotifications);
        window.dispatchEvent(new CustomEvent('notifications-loaded', { detail: processedNotifications }));

        // Cache the fresh data with today's date
        const cacheData = {
          date: today,
          notifications: data.data
        };
        localStorage.setItem('notificationsCache', JSON.stringify(cacheData));
      } else {
        window.dispatchEvent(new CustomEvent('notifications-error', { detail: data.message || "Tidak ada notifikasi tersedia." }));
      }
    }, (error) => {
      console.error("Error fetching notifications:", error);
      window.dispatchEvent(new CustomEvent('notifications-error', { detail: "Gagal memuat notifikasi." }));
    });

  } catch (error) {
    // This will only catch errors from loadScript
    console.error("Error loading dependencies:", error);
    window.dispatchEvent(new CustomEvent('notifications-error', { detail: "Gagal memuat komponen notifikasi." }));
  }
}

// API Functions for Alpine.js
window.fetchNotificationSettings = function (callback) {
  sendDataToGoogle('getNotificationSettings', {}, (response) => {
    if (response.status === 'success' && callback) callback(response.data);
  }, (err) => console.error("Error fetching settings:", err));
};

window.saveNotificationSettings = function (settings, callback) {
  sendDataToGoogle('saveNotificationSettings', { settings: JSON.stringify(settings) }, (response) => {
    if (response.status === 'success' && callback) callback();
  }, (err) => console.error("Error saving settings:", err));
};

window.fetchAiRules = function (callback) {
  sendDataToGoogle('getAiRules', {}, (response) => {
    if (response.status === 'success' && callback) callback(response.data);
  }, (err) => console.error("Error fetching rules:", err));
};

window.addAiRule = function (prompt, callback) {
  sendDataToGoogle('addAiRule', { prompt: prompt }, (response) => {
    if (response.status === 'success' && callback) callback(response.data);
  }, (err) => console.error("Error adding rule:", err));
};

window.updateAiRuleStatus = function (id, isActive, callback) {
  sendDataToGoogle('updateAiRuleStatus', { id: id, isActive: isActive }, (response) => {
    if (response.status === 'success' && callback) callback();
  }, (err) => console.error("Error updating rule status:", err));
};

window.deleteAiRule = function (id, callback) {
  sendDataToGoogle('deleteAiRule', { id: id }, (response) => {
    if (response.status === 'success' && callback) callback();
  }, (err) => console.error("Error deleting rule:", err));
};
