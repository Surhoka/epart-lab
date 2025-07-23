(function () {
  // 🔁 Konten Inject SPA
  function injectContent(html, retry = 0) {
    const target = document.getElementById("app-content");
    if (target) {
      target.innerHTML = html;
      if (retry > 0) console.log(`✅ Injected after ${retry} retry`);
    } else if (retry < 10) {
      setTimeout(() => injectContent(html, retry + 1), 100);
    } else {
      console.error("❌ Element #app-content not found.");
    }
  }

  window.injectHomeContent = function () {
    const html = `<div class="p-6 bg-white rounded shadow"><h2 class="text-xl font-bold">Beranda</h2><p>Selamat datang di SPA inject Blogger!</p></div>`;
    injectContent(html);
  };

  window.injectAboutContent = function () {
    const html = `<div class="p-6 bg-white rounded shadow"><h2 class="text-xl font-bold">Tentang Kami</h2><p>Informasi tentang blog ini.</p></div>`;
    injectContent(html);
  };

  window.injectNotFoundContent = function () {
    const html = `<div class="p-6 bg-red-100 text-red-600 rounded shadow"><h2 class="text-xl font-bold">404 - Halaman Tidak Ditemukan</h2><p>Halaman yang diminta tidak tersedia.</p></div>`;
    injectContent(html);
  };

  // 🔀 Routing SPA
  window.router = {
    routes: {
      "/": window.injectHomeContent,
      "/about": window.injectAboutContent
    },
    handleLocation: function () {
      const path = window.location.pathname;
      const routeHandler = this.routes[path] || window.injectNotFoundContent;
      routeHandler();
    },
    navigateTo: function (url) {
      window.history.pushState({}, "", url);
      this.handleLocation();
    },
    init: function () {
      document.body.addEventListener("click", (e) => {
        const link = e.target.closest("a[data-spa]");
        if (link && link.href) {
          e.preventDefault();
          this.navigateTo(link.getAttribute("href"));
        }
      });
      window.onpopstate = () => this.handleLocation();
    }
  };

  // 🚀 Init Loader SPA Inject
  function startSPA() {
    console.group("⚙️ SPA Inject Init");
    if (window.router?.init) {
      window.router.init();
      console.log("✅ Routing initialized");
    }
    if (window.router?.handleLocation) {
      setTimeout(() => window.router.handleLocation(), 50);
    }
    if (typeof window.injectHomeContent !== "function") {
      console.warn("⚠️ injectHomeContent not available");
    }
    console.groupEnd();
  }

  // 🧠 Fallback DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startSPA);
  } else {
    startSPA();
  }
})();