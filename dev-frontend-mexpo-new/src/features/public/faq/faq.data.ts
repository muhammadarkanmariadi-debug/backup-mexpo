// FAQ diselaraskan dengan kondisi aktual website (2026):
// - Pembayaran berbayar = manual (CASH/QRIS/TRANSFER + referensi), TANPA gateway.
// - Tidak ada fitur refund.
// - Pendaftaran penyewa/pembicara via URL /dashboard/[uuid]/apply/* (belum ada tombol publik).
// - Pembatalan lokakarya tidak tersedia untuk pengunjung (tidak ada tombol batal di UI).
export const faqData = [
    {
        category: 'Umum',
        question: 'Apa itu MEXPO?',
        answer: 'MEXPO adalah platform manajemen event dan pameran yang memudahkan penyelenggara mengelola event, penyewa (tenant), lokakarya, pendaftaran pengunjung, kehadiran berbasis QR, sertifikat, dan laporan dalam satu tempat.'
    },
    {
        category: 'Umum',
        question: 'Siapa saja yang bisa memakai MEXPO?',
        answer: 'Pengunjung dapat mendaftar ke event, penyewa dan pembicara dapat mengisi aplikasi per event, panitia/owner mengelola event, dan admin menyetujui publikasi event.'
    },
    {
        category: 'Akun',
        question: 'Bagaimana cara membuat akun?',
        answer: 'Klik tombol "Masuk" di navbar, lalu pilih "Daftar". Isi nama lengkap, email, nomor HP, dan kata sandi, kemudian selesaikan verifikasi email Anda.'
    },
    {
        category: 'Akun',
        question: 'Apakah verifikasi email wajib?',
        answer: 'Ya. Setelah mendaftar, Anda diarahkan ke halaman verifikasi untuk mengonfirmasi alamat email Anda sebelum dapat menggunakan akun.'
    },
    {
        category: 'Akun',
        question: 'Bagaimana jika saya lupa kata sandi?',
        answer: 'Gunakan menu "Lupa kata sandi" di halaman Masuk. Tautan untuk mengatur ulang kata sandi akan dikirim ke email Anda.'
    },
    {
        category: 'Event',
        question: 'Bagaimana cara membuat event baru?',
        answer: 'Setelah login, buka halaman "Event Saya", lalu klik tombol buat event. Isi informasi yang diperlukan seperti nama, deskripsi, lokasi, jadwal, kuota, fitur, dan tipe tiket.'
    },
    {
        category: 'Event',
        question: 'Bagaimana event saya bisa tampil publik?',
        answer: 'Event dibuat dengan status Draft. Pemilik mengajukan publikasi, status berubah menjadi Menunggu (Pending), lalu disetujui oleh admin menjadi Terbit. Jika ditolak, statusnya menjadi Ditolak.'
    },
    {
        category: 'Event',
        question: 'Berapa lama proses persetujuan event?',
        answer: 'Tidak ada jangka waktu pasti karena disetujui secara manual oleh admin. Pantau status event Anda di halaman "Event Saya" (Draft, Menunggu, Terbit, Ditolak, Selesai).'
    },
    {
        category: 'Event',
        question: 'Bagaimana cara mendaftar ke sebuah event?',
        answer: 'Buka halaman event, lalu klik "Daftar" dan pastikan Anda sudah login. Isi formulir pendaftaran yang disiapkan panitia. Untuk event berbayar, pilih tipe tiket dan metode pembayaran, lalu menunggu konfirmasi panitia.'
    },
    {
        category: 'Event',
        question: 'Di mana saya melihat QR, ID badge, dan sertifikat?',
        answer: 'Setelah terdaftar sebagai pengunjung, buka event Anda di dashboard. Tab "Tiket & Kehadiran" menampilkan QR untuk check-in, tombol "ID Badge" untuk mencetak badge, dan tombol "Sertifikat" untuk sertifikat lokakarya yang sudah diikuti.'
    },
    {
        category: 'Lokakarya',
        question: 'Bagaimana cara mengikuti lokakarya?',
        answer: 'Buka halaman event, pilih tab "Lokakarya", lalu klik tombol "Daftar Lokakarya Sekarang". Setelah berhasil, tombol berubah menjadi "Anda Sudah Terdaftar".'
    },
    {
        category: 'Lokakarya',
        question: 'Apakah lokakarya bisa penuh?',
        answer: 'Bisa. Jika kuota sudah tercapai, tombol pendaftaran berubah menjadi "Kuota Penuh". Kuota 0 berarti tanpa batas.'
    },
    {
        category: 'Lokakarya',
        question: 'Bagaimana cara mendapatkan sertifikat lokakarya?',
        answer: 'Sertifikat diterbitkan setelah Anda check-in ke lokakarya. Sertifikat tersebut dapat dilihat dan dicetak dari halaman "Sertifikat" di dashboard event.'
    },
    {
        category: 'Lokakarya',
        question: 'Bisakah saya membatalkan pendaftaran lokakarya?',
        answer: 'Saat ini belum tersedia tombol batal untuk pengunjung. Hubungi panitia event untuk pembatalan secara manual.'
    },
    {
        category: 'Penyewa & Pembicara',
        question: 'Bagaimana cara menjadi penyewa di sebuah event?',
        answer: 'Login terlebih dahulu, lalu buka tautan pendaftaran penyewa yang dibagikan panitia (halaman /dashboard/[uuid]/apply/tenant). Isi formulir dengan lengkap dan tunggu persetujuan panitia.'
    },
    {
        category: 'Penyewa & Pembicara',
        question: 'Bagaimana cara menjadi pembicara?',
        answer: 'Login, lalu isi formulir pendaftaran pembicara di halaman /dashboard/[uuid]/apply/speaker yang dibagikan panitia, kemudian tunggu persetujuan.'
    },
    {
        category: 'Penyewa & Pembicara',
        question: 'Apakah ada biaya untuk menjadi penyewa?',
        answer: 'Saat ini platform tidak menyediakan mekanisme biaya. Keputusan diterima atau tidaknya aplikasi ditentukan oleh panitia setiap event.'
    },
    {
        category: 'Pembayaran',
        question: 'Bagaimana metode pembayaran untuk event berbayar?',
        answer: 'Pembayaran bersifat manual: pilih Cash, QRIS, atau Transfer, lalu isi referensi pembayaran Anda. Belum ada pembayaran otomatis/gateway; panitia mengonfirmasi secara manual.'
    },
    {
        category: 'Pembayaran',
        question: 'Apakah saya mendapat email berisi tiket?',
        answer: 'Belum. Setelah pendaftaran terkonfirmasi, tiket dan QR Anda dapat dilihat di dashboard event.'
    },
    {
        category: 'Pembayaran',
        question: 'Bagaimana proses refund?',
        answer: 'Platform belum menyediakan proses refund. Untuk pengembalian dana, silakan hubungi panitia event terkait.'
    }
]