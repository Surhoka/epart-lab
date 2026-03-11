document.addEventListener('alpine:init', () => {
    const savedLocale = localStorage.getItem('app_locale') || 'id';

    // 1. Inisialisasi i18next dengan Backend
    i18next
        .use(i18nextHttpBackend)
        .init({
            lng: savedLocale,
            fallbackLng: 'en',
            // Tambahkan translasi dasar sebagai fallback agar tidak muncul nama key saat loading
            resources: {
                id: {
                    translation: {
                        "email_placeholder": "Masukkan alamat email Anda",
                        "password_placeholder": "Masukkan kata sandi Anda"
                    }
                },
                en: {
                    translation: {
                        "email_placeholder": "Enter your email",
                        "password_placeholder": "Enter your password"
                    }
                }
            },
            backend: {
                // Memuat file dari folder json/ relatif ke root
                loadPath: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/locales/{{lng}}.json',
            }
        });

    // 2. Daftarkan Alpine Store secara sinkron
    Alpine.store('i18n', {
        locale: savedLocale,

        t(key, options = {}) {
            // PENTING: Akses this.locale agar Alpine mencatat dependensi ini.
            // Tanpa ini, Alpine tidak tahu bahwa t() harus dijalankan ulang saat locale berubah.
            this.locale;
            return i18next.t(key, options);
        },

        async toggle() {
            this.locale = this.locale === 'id' ? 'en' : 'id';
            await i18next.changeLanguage(this.locale);
            localStorage.setItem('app_locale', this.locale);
        }
    });
});
