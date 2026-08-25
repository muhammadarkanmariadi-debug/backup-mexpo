export interface FAQItem {
  category:
    | 'Umum'
    | 'Akun'
    | 'Event'
    | 'Lokakarya'
    | 'Penyewa & Pembicara'
    | 'Pembayaran'
    | 'Kehadiran & Sertifikat';
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  // ── UMUM ──
  {
    category: 'Umum',
    question: 'Apa itu MEXPO?',
    answer:
      'MEXPO adalah platform all-in-one Event Operating System yang memudahkan penyelenggara mengelola pendaftaran peserta, tiket & pembayaran online (Midtrans Snap), check-in QR instan, portal tenant & POS kasir, lokakarya/seminar, penukaran souvenir, sertifikat digital dinamis, hingga laporan analitik.',
  },
  {
    category: 'Umum',
    question: 'Jenis event apa saja yang didukung oleh MEXPO?',
    answer:
      'MEXPO mendukung berbagai jenis acara mulai dari Expo & Pameran, Bursa Kerja (Career Fair), Seminar & Konferensi, Acara Kelulusan (Graduation), Marketplace/Bazaar, Acara Kampus & Sekolah, hingga acara instansi pemerintah.',
  },
  {
    category: 'Umum',
    question: 'Siapa saja yang dapat menggunakan MEXPO?',
    answer:
      'Platform ini dirancang untuk Pengunjung (Visitor), Pemilik Booth/Tenant (dan Staff), Pembicara, Panitia Pelaksana (Committee), Pemilik Event (Owner), dan Superadmin.',
  },

  // ── AKUN ──
  {
    category: 'Akun',
    question: 'Bagaimana cara membuat akun di MEXPO?',
    answer:
      'Klik tombol "Masuk" di navigasi atas. Anda dapat mendaftar cepat menggunakan akun Google (1-klik Masuk dengan Google) atau mengisi formulir nama, email, nomor telepon, dan kata sandi.',
  },
  {
    category: 'Akun',
    question: 'Apakah verifikasi email wajib?',
    answer:
      'Untuk pendaftaran via email, Anda perlu melakukan verifikasi melalui tautan yang dikirimkan. Pengguna yang mendaftar via Google Sign-In langsung terverifikasi secara otomatis.',
  },
  {
    category: 'Akun',
    question: 'Bagaimana jika saya lupa kata sandi?',
    answer:
      'Klik tautan "Lupa kata sandi" pada halaman Masuk, masukkan alamat email terdaftar, dan ikuti instruksi pada email untuk menyetel ulang kata sandi Anda.',
  },

  // ── EVENT & PENDAFTARAN ──
  {
    category: 'Event',
    question: 'Bagaimana cara membuat dan mempublikasikan event baru?',
    answer:
      'Setelah login, buat event baru melalui dashboard Anda. Event akan berada pada status DRAFT. Setelah melengkapi rincian (jadwal, lokasi, tiket, modul), ajukan permohonan publikasi untuk ditinjau dan disetujui oleh Superadmin agar tayang secara publik.',
  },
  {
    category: 'Event',
    question: 'Bagaimana cara mendaftar sebagai pengunjung ke sebuah event?',
    answer:
      'Buka halaman event yang ingin Anda ikuti, klik "Daftar Event", lengkapi formulir pendaftaran yang disediakan panitia, dan pilih tiket (Gratis atau Berbayar). Tiket dan QR Code Anda akan otomatis aktif.',
  },
  {
    category: 'Event',
    question: 'Apakah formulir pendaftaran setiap event berbeda-beda?',
    answer:
      'Ya. Penyelenggara dapat mengatur kolom pendaftaran dinamis (teks, angka, pilihan ganda, tanggal, upload berkas) dengan aturan kondisi tampilan sesuai kebutuhan registrasi acara masing-masing.',
  },

  // ── PEMBAYARAN ──
  {
    category: 'Pembayaran',
    question: 'Metode pembayaran apa saja yang didukung untuk event berbayar?',
    answer:
      'MEXPO terintegrasi dengan Payment Gateway Midtrans Snap yang mendukung berbagai metode instan: QRIS (GoPay, ShopeePay, OVO, Dana), Virtual Account bank (BCA, Mandiri, BNI, BRI, Permata), dan transfer bank. Selain itu panitia juga dapat menerima pembayaran tunai (Cash) di kasir onsite.',
  },
  {
    category: 'Pembayaran',
    question: 'Kapan tiket saya aktif setelah melakukan pembayaran?',
    answer:
      'Setelah transaksi selesai diverifikasi oleh payment gateway, status pembayaran otomatis menjadi "PAID" dan e-tiket beserta QR Code langsung aktif di dashboard Anda.',
  },
  {
    category: 'Pembayaran',
    question: 'Bagaimana kebijakan pengembalian dana (refund)?',
    answer:
      'Kebijakan pengembalian dana ditentukan langsung oleh masing-masing penyelenggara event. Silakan hubungi kontak panitia resmi yang tertera pada halaman event terkait.',
  },

  // ── KEHADIRAN & SERTIFIKAT ──
  {
    category: 'Kehadiran & Sertifikat',
    question: 'Bagaimana cara melakukan check-in di lokasi event?',
    answer:
      'Buka menu tiket di akun Anda untuk menampilkan QR Code unik. Tunjukkan QR Code tersebut kepada panitia di pintu masuk atau sesi seminar untuk dipindai secara instan menggunakan scanner kamera panitia.',
  },
  {
    category: 'Kehadiran & Sertifikat',
    question: 'Bagaimana cara mendapatkan dan mengunduh sertifikat digital?',
    answer:
      'Bagi peserta yang telah melakukan check-in kehadiran pada sesi seminar/lokakarya, sertifikat digital resmi dapat langsung dilihat dan diunduh dalam format PDF resolusi tinggi melalui dashboard akun Anda.',
  },
  {
    category: 'Kehadiran & Sertifikat',
    question: 'Bagaimana cara mendapatkan souvenir event?',
    answer:
      'Beberapa event menyediakan hadiah souvenir yang dapat diklaim jika Anda memenuhi syarat kunjungan stan (misal mengunjungi minimal 5 booth tenant) dan/atau menghadiri seminar. Tunjukkan QR Code Anda ke meja souvenir untuk validasi.',
  },

  // ── LOKAKARYA ──
  {
    category: 'Lokakarya',
    question: 'Bagaimana cara mengikuti lokakarya atau seminar di event?',
    answer:
      'Buka tab "Lokakarya" pada halaman event, pilih sesi yang diminati, dan klik "Daftar Lokakarya". Sistem akan memesan kuota tempat Anda secara otomatis.',
  },
  {
    category: 'Lokakarya',
    question: 'Apa yang terjadi jika kuota lokakarya sudah penuh?',
    answer:
      'Jika kuota telah terpenuhi, tombol pendaftaran akan menandakan "Kuota Penuh". Penyelenggara dapat mengatur batas kuota atau membuka kuota tanpa batas.',
  },

  // ── PENYEWA & PEMBICARA ──
  {
    category: 'Penyewa & Pembicara',
    question: 'Bagaimana cara mendaftar sebagai tenant/booth di sebuah event?',
    answer:
      'Penyelenggara dapat membagikan formulir pendaftaran tenant. Setelah disetujui, tenant mendapatkan akses ke Portal Tenant untuk mengelola katalog produk, tim kasir, pencatatan transaksi POS, dan laporan penjualan.',
  },
  {
    category: 'Penyewa & Pembicara',
    question: 'Fitur apa saja yang didapatkan tenant di MEXPO?',
    answer:
      'Tenant mendapatkan halaman profil stan, katalog produk, pencatatan transaksi kasir POS (termasuk mencatat pengunjung via QR), check-in kunjungan stan booth, serta laporan transaksi lengkap yang dapat diekspor ke Excel.',
  },
];