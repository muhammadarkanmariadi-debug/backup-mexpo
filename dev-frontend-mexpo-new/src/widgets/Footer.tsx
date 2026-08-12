"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { footerData } from "@/shared/data/footer.data";

const Footer = () => {
  const pathname = usePathname();

  const hideRoutes = [
    "/auth",
    "/verification",
    "/forgot-passwords",
    "/profile",
    "/choose-role",
    "/stats",
    "/onsite-register",
  ];

  if (hideRoutes.some((route) => pathname.startsWith(route))) return null;
  if (pathname.includes("/report")) return null;

  return (
    <footer className="relative bg-secondary dark:bg-gray-900 mt-20 text-white overflow-hidden">
      
      {/* Pattern kiri */}
      <div className="top-0 bottom-0 left-0 absolute opacity-30 dark:opacity-5 w-32 md:w-60 pointer-events-none">
        <Image
          src="/images/shape/Pattern 2.png"
          alt=""
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="w-full object-left"
        />
      </div>

      {/* Pattern kanan */}
      <div className="top-0 right-0 bottom-0 absolute opacity-30 dark:opacity-5 w-32 md:w-60 pointer-events-none">
        <Image
          src="/images/shape/Pattern 3.png"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-right"
        />
      </div>

      <div className="relative z-10 mx-auto px-6 md:px-12 lg:px-24 py-16 lg:py-20 container">
        
        {/* ── Top section: Logo/Tagline (Left) & Nav Columns (Right) ── */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-24 mb-16">
          
          {/* Left Column: Logo + Tagline */}
          <div className="flex flex-col gap-6 max-w-sm">
            <Link href="/" className="inline-block">
              <Image
                src="/logo/logo-m.svg"
                alt="Mexpo"
                width={120}
                height={50}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="font-jakarta text-white/80 dark:text-gray-400 text-sm md:text-base leading-relaxed">
              {footerData.tagline}
            </p>
          </div>

          {/* Right Columns: Navigation */}
          <div className="flex flex-wrap lg:flex-nowrap gap-10 md:gap-16 lg:gap-20">
            {footerData.navigation.map((section) => (
              <div key={section.title} className="min-w-[120px]">
                <h3 className="mb-6 font-public-sans font-bold text-white text-base md:text-lg">
                  {section.title}
                </h3>
                <ul className="space-y-4">
                  {section.links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={`text-sm md:text-base transition-all ${
                            isActive
                              ? "text-white font-semibold underline underline-offset-4"
                              : "text-white/80 dark:text-gray-400 hover:text-white"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/20 dark:border-gray-800" />

        {/* ── Bottom bar: Copyright (Left) & Social Media (Right) ── */}
        <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-8">
          <p className="font-jakarta text-white/70 dark:text-gray-500 text-sm text-center md:text-left">
            {footerData.copyright}
          </p>
          
          <div className="flex items-center gap-5">
            {footerData.socialMedia.map((social) => (
              <Link
                key={social.platform}
                href={social.href}
                target="_blank"
                aria-label={social.platform}
                className="text-white/80 dark:text-gray-400 hover:text-white transition-colors"
              >
                {/* SVG for Instagram */}
                {social.icon === "instagram" && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                )}
                {/* SVG for WhatsApp */}
                {social.icon === "whatsapp" && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                )}
                {/* SVG for TikTok */}
                {social.icon === "tiktok" && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;