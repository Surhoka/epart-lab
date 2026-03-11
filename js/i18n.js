document.addEventListener('alpine:init', () => {
    const savedLocale = localStorage.getItem('app_locale') || 'id';

    // 1. Inisialisasi i18next dengan Backend
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLocale,
            fallbackLng: 'en',
            backend: {
                // Gunakan timestamp dinamis untuk cache busting
                loadPath: (url, lngs) => {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
                    const base = isLocal ? 'locales/' : 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/locales/';
                    return `${base}${lngs[0]}.json?v=${Date.now()}`;
                }
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
            console.log('Toggling language from:', this.locale);
            this.locale = this.locale === 'id' ? 'en' : 'id';
            try {
                await i18next.changeLanguage(this.locale);
                this._refresh = Date.now(); // Trigger refresh agar x-text terpanggil ulang
                localStorage.setItem('app_locale', this.locale);
                console.log('Language changed successfully to:', this.locale);
            } catch (err) {
                console.error('Failed to change language:', err);
            }
        }
    });
});