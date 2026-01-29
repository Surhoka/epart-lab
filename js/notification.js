const registerNotificationPage = () => {
  if (window.Alpine && !window.Alpine.data('notificationPage')) {
    window.Alpine.data('notificationPage', () => ({
      notifications: [],
      isLoading: true,
      notificationError: '',
      params: {},

      async init() {
        console.log("Notification Page Initialized with Alpine Component.");
        this.params = window.app?.params || {};
        await this.loadDependenciesAndFetch();
      },

      async loadScript(url) {
        return new Promise((resolve, reject) => {
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
      },

      async loadDependenciesAndFetch() {
        try {
          await this.loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
          await this.fetchNotifications();
        } catch (error) {
          console.error("Error loading dependencies:", error);
          this.notificationError = "Gagal memuat komponen notifikasi.";
          this.isLoading = false;
        }
      },

      async fetchNotifications() {
        this.isLoading = true;
        const user = JSON.parse(localStorage.getItem('signedInUser'));
        const userEmail = user ? user.email : null;
        const today = new Date().toISOString().split('T')[0];
        const cachedData = JSON.parse(localStorage.getItem('notificationsCache') || '{}');

        if (cachedData.date === today && Array.isArray(cachedData.notifications)) {
          this.notifications = this.processMarkdown(cachedData.notifications);
        }

        window.sendDataToGoogle('getExistingNotifications', { email: userEmail }, (data) => {
          if (data.status === "success" && Array.isArray(data.data)) {
            this.notifications = this.processMarkdown(data.data);
            const cacheData = { date: today, notifications: data.data };
            localStorage.setItem('notificationsCache', JSON.stringify(cacheData));
          } else {
            this.notificationError = data.message || "Tidak ada notifikasi tersedia.";
          }
          this.isLoading = false;
        }, (error) => {
          console.error("Error fetching notifications:", error);
          this.notificationError = "Gagal memuat notifikasi.";
          this.isLoading = false;
        });
      },

      processMarkdown(notifications) {
        if (typeof window.marked !== 'function') return notifications;
        return notifications.map(notif => {
          if (notif.message) {
            if (typeof notif.message !== 'string') {
              notif.message = String(notif.message);
            }
            notif.message = window.marked.parse(notif.message);
          }
          return notif;
        });
      }
    }));
  }
};

if (window.Alpine) {
  registerNotificationPage();
} else {
  document.addEventListener('alpine:init', registerNotificationPage);
}
