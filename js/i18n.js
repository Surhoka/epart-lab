document.addEventListener('alpine:init', () => {
    const savedLocale = localStorage.getItem('app_locale') || 'id';

    // 1. Inisialisasi i18next dengan Backend
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLocale,
            fallbackLng: 'en',
            backend: {
                loadPath: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/locales/${lngs[0]}.json?v=${Date.now()}`;
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
            // PENTING: Akses this.locale dan this._refresh agar Alpine mencatat dependensi ini.
            this.locale;
            this._refresh;
            return i18next.t(key, options);
        },

        async toggle() {
            this.locale = this.locale === 'id' ? 'en' : 'id';
            await i18next.changeLanguage(this.locale);
            localStorage.setItem('app_locale', this.locale);
        }
    });
});
