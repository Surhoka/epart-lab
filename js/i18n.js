document.addEventListener('alpine:init', () => {
    const savedLocale = localStorage.getItem('app_locale') || 'id';
    const cacheBust = Date.now(); // buat timestamp sekali saja

    // 1. Inisialisasi i18next dengan Backend
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLocale,
            fallbackLng: 'en',
            backend: {
                loadPath: `https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/locales/{{lng}}.json?v=${cacheBust}`
            }
        }, (err, t) => {
            // Trigger refresh Alpine jika loading selesai
            if (Alpine.store('i18n')) {
                Alpine.store('i18n')._refresh = Date.now();
            }
        });

    // 2. Daftarkan Alpine Store secara sinkron
    Alpine.store('i18n', {
        locale: savedLocale,
        _refresh: Date.now(),

        t(key, options = {}) {
            this.locale;
            this._refresh;
            return i18next.t(key, options);
        },

        async toggle() {
            this.locale = this.locale === 'id' ? 'en' : 'id';
            await i18next.changeLanguage(this.locale);
            localStorage.setItem('app_locale', this.locale);
            this._refresh = Date.now(); // paksa Alpine refresh
        }
    });
});
