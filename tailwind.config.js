tailwind.config = {
    theme: {
        extend: {
            // Anda bisa menambahkan ekstensi tema di sini jika diperlukan
        }
    },
    variants: {
        extend: {
            // Mengaktifkan varian group-hover secara eksplisit
            display: ['group-hover'],
            visibility: ['group-hover'],
        }
    }
};