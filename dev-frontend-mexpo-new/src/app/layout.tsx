// src/app/layout.tsx
// Root layout Mexpo — fonts, metadata, dan globals

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import QueryProvider from '@/lib/providers/QueryProvider';
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <QueryProvider>
        <AuthProvider>
          <body className="flex flex-col min-h-full">
            {children}
            {/* Global toasts (FIX-15) — mounted once here, not per template. */}
            <Toaster richColors position="top-left" />
          </body>
        </AuthProvider>
      </QueryProvider>
    </html>
  );
}
