document.addEventListener('alpine:init', () => {
    Alpine.store('i18n', {
        locale: Alpine.$persist('id').as('app_locale'),
        
        translations: {
            id: {
                // Common
                'back_to_dashboard': 'Kembali ke dashboard',
                'sign_in': 'Masuk',
                'sign_up': 'Daftar',
                
                // Login Page
                'login_title': 'Masuk ke Akun',
                'login_subtitle': 'Masukkan email dan kata sandi Anda untuk masuk!',
                'email_label': 'Email',
                'password_label': 'Kata Sandi',
                'password_placeholder': 'Masukkan kata sandi Anda',
                'keep_logged_in': 'Tetap masuk',
                'forgot_password': 'Lupa kata sandi?',
                'dont_have_account': 'Belum punya akun?',
                'welcome_title': 'Selamat Datang Kembali',
                'welcome_desc': 'Masuk ke Dashboard Admin Anda. Kelola konten dan analitik Anda dengan mudah.',
                
                // Signup Page
                'signup_title': 'Buat Akun',
                'signup_subtitle': 'Masukkan detail Anda untuk mendaftar!',
                'first_name': 'Nama Depan',
                'last_name': 'Nama Belakang',
                'agree_terms': 'Setujui Syarat dan Ketentuan serta Kebijakan Privasi kami',
                'already_have_account': 'Sudah punya akun?',
                'join_desc': 'Bergabunglah dengan Dashboard Admin kami untuk mengelola konten dan analitik Anda dengan mudah.'
            },
            en: {
                // Common
                'back_to_dashboard': 'Back to dashboard',
                'sign_in': 'Sign In',
                'sign_up': 'Sign Up',
                
                // Login Page
                'login_title': 'Sign In',
                'login_subtitle': 'Enter your email and password to sign in!',
                'email_label': 'Email',
                'password_label': 'Password',
                'password_placeholder': 'Enter your password',
                'keep_logged_in': 'Keep me logged in',
                'forgot_password': 'Forgot password?',
                'dont_have_account': "Don't have an account?",
                'welcome_title': 'Welcome Back',
                'welcome_desc': 'Welcome back to your Admin Dashboard. Manage your content and analytics with ease.',
                
                // Signup Page
                'signup_title': 'Sign Up',
                'signup_subtitle': 'Enter your details to sign up!',
                'first_name': 'First Name',
                'last_name': 'Last Name',
                'agree_terms': 'Agree to the Terms and Conditions and our Privacy Policy',
                'already_have_account': 'Already have an account?',
                'join_desc': 'Join our Admin Dashboard to manage your content and analytics with ease.'
            }
        },

        t(key) {
            return this.translations[this.locale][key] || key;
        },

        toggle() {
            this.locale = this.locale === 'id' ? 'en' : 'id';
        }
    });
});
