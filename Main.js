function initModules() {
  console.group("🧩 SPA Epart Init");

  const modules = {
    Toast: "showMessageBox",
    Inject: "injectHomeContent",
    Router: ["router", "init", "handleLocation"],
    Analytics: "initAnalytics",
    Search: "initSearch",
    Table: "initTable",
    Modal: "initModal",
    Pdf: "initPdf",
    Navigasi: "initNav",
    Lazy: "initLazyLoad"
  };

  // 🔍 Validasi Fungsi Utama
  Object.entries(modules).forEach(([label, api]) => {
    if (Array.isArray(api)) {
      const [namespace, initFn, routeFn] = api;
      if (
        window[namespace] &&
        typeof window[namespace][initFn] === "function"
      ) {
        window[namespace][initFn]();
        console.log(`✅ ${label}: ${initFn} dijalankan`);
      } else {
        console.warn(`⚠️ ${label}: ${initFn} tidak ditemukan`);
      }

      if (
        window[namespace] &&
        typeof window[namespace][routeFn] === "function"
      ) {
        setTimeout(() => window[namespace][routeFn](), 60);
        console.log(`✅ ${label}: ${routeFn} dijalankan`);
      } else {
        console.warn(`⚠️ ${label}: ${routeFn} tidak ditemukan`);
      }
    } else {
      if (typeof window[api] === "function") {
        window[api]();
        console.log(`✅ ${label}: ${api} dijalankan`);
      } else {
        console.warn(`⚠️ ${label}: ${api} tidak ditemukan`);
        // Fallback sederhana jika perlu
        window[api] = () =>
          console.log(`↪️ Fallback ${api} aktif: fungsi tidak tersedia.`);
      }
    }
  });

  console.groupEnd();
}

// 🔁 DOM Ready Fallback
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModules);
} else {
  initModules();
}
