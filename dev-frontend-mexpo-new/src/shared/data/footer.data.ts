export const footerData = {
  tagline: "Manage your event exhibition or expo easily with MEXPO!.",

  socialMedia: [
    {
      platform: "Instagram",
      icon: "instagram",
      href: "https://instagram.com/namabrand",
    },
    {
      platform: "WhatsApp",
      icon: "whatsapp",
      href: "https://wa.me/6281234567890",
    },
    {
      platform: "TikTok",
      icon: "tiktok",
      href: "https://tiktok.com/@namabrand",
    },
  ],

  navigation: [
    {
      title: "Mexpo",
      links: [
        { label: "About Mexpo", href: "/about" },
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Events",
      links: [
        { label: "All Events", href: "/" },
        { label: "On Going", href: "/?filter=On Going" },
        { label: "Upcoming", href: "/?filter=Upcoming" },
        { label: "Past Events", href: "/?filter=Past" },
      ],
    },

  ],

  legalLinks: [
    {
      label: "Kebijakan Privasi",
      href: "/privacy-policy",
    },
    {
      label: "Syarat & Ketentuan",
      href: "/terms",
    },
  ],

  copyright: `© ${new Date().getFullYear()} Mexpo. All rights reserved.`,
};