// notifications.js
async function initNotificationsPage() {
  const app = window.app; // akses state global dari appData
  app.isLoading = true;
  app.notifications = [];
  app.notificationError = '';

  try {
    const response = await fetch(window.appsScriptUrl + "?action=getApiStatusNotifications");
    const data = await response.json();

    // Validasi response
    if (data.status === "success" && Array.isArray(data.notifications)) {
      app.notifications = data.notifications;
    } else if (Array.isArray(data)) {
      // fallback jika API langsung return array
      app.notifications = data;
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

// Pastikan initNotificationsPage dipanggil saat halaman notifikasi dimuat
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash.includes("notifications")) {
    initNotificationsPage();
  }
});