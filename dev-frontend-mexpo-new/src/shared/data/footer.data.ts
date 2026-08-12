export const footerData = {
  tagline: "Platform manajemen event dan expo terintegrasi. Cepat, akurat, dan andal.",

  socialMedia: [
    {
      platform: "Instagram",
      icon: "instagram",
      href: "https://instagram.com/smktelkommalang",
    },
    {
      platform: "WhatsApp",
      icon: "whatsapp",
      href: "https://wa.me/6281234567890",
    },
    {
      platform: "TikTok",
      icon: "tiktok",
      href: "https://tiktok.com/@smktelkommalang",
    },
  ],

  navigation: [
    {
      title: "Mexpo",
      links: [
        { label: "Beranda", href: "/" },
        { label: "Tentang Kami", href: "/about" },
        { label: "FAQ", href: "/faq" },
        { label: "Hubungi Kami", href: "/contact" },
      ],
    },
    {
      title: "Penyelenggara",
      links: [
        { label: "Buat Event", href: "/dashboard/create" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Panduan", href: "/faq" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Kebijakan Privasi", href: "/privacy-policy" },
        { label: "Syarat & Ketentuan", href: "/terms" },
      ],
    }
  ],

  copyright: `© ${new Date().getFullYear()} Mexpo. Hak Cipta Dilindungi.`,
};