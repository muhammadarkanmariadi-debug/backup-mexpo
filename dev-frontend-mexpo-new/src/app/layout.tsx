// src/app/layout.tsx
// Root layout Mexpo — fonts, metadata, dan globals

import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans, Public_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import QueryProvider from '@/lib/providers/QueryProvider';
import { Toaster } from 'sonner';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Mexpo — Platform Event & Expo Management',
    template: '%s | Mexpo',
  },
  description:
    'Platform manajemen event, pameran, dan expo berbasis QR Code. Kelola pendaftaran, check-in, dan sertifikat digital dalam satu platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${outfit.variable} ${plusJakartaSans.variable} ${publicSans.variable} h-full antialiased`}
    >
      <QueryProvider>
        <AuthProvider>
          <body className="flex flex-col min-h-full">
            <ThemeProvider>
              {children}
              {/* Global toasts (FIX-15) — mounted once here, not per template. */}
              <Toaster richColors position="top-left" />
            </ThemeProvider>
          </body>
        </AuthProvider>
      </QueryProvider>
    </html>
  );
}
