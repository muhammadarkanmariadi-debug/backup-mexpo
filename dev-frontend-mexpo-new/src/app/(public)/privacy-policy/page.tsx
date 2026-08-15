// src/app/(public)/privacy-policy/page.tsx
// Halaman statis — Kebijakan Privasi

import React from "react";

export const metadata = {
  title: "Kebijakan Privasi",
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mb-8">
    <h2 className="mb-2 font-public-sans font-bold text-gray-900 text-xl sm:text-2xl">
      {title}
    </h2>
    <div className="text-gray-600 text-sm sm:text-base leading-relaxed space-y-2">
      {children}
    </div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full max-w-4xl">
      <h1 className="mb-8 font-public-sans font-extrabold text-gray-900 text-3xl sm:text-4xl">
        Kebijakan Privasi
      </h1>

      <Section title="1. Informasi yang Kami Kumpulkan">
        <p>
          Kami mengumpulkan data yang Anda berikan saat mendaftar atau
          menggunakan layanan Mexpo, seperti nama, email, nomor telepon, dan
          informasi profil lainnya yang diperlukan untuk penyelenggaraan event.
        </p>
      </Section>

      <Section title="2. Penggunaan Informasi">
        <p>
          Informasi Anda digunakan untuk memproses pendaftaran event,
          mengelola akses dashboard, mengirim notifikasi terkait event, dan
          meningkatkan kualitas layanan kami.
        </p>
      </Section>

      <Section title="3. Keamanan Data">
        <p>
          Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi
          data Anda dari akses yang tidak sah, perubahan, atau penghapusan.
        </p>
      </Section>

      <Section title="4. Berbagi Data">
        <p>
          Data Anda hanya dibagikan kepada penyelenggara event terkait
          seperlunya, dan tidak akan dijual kepada pihak ketiga.
        </p>
      </Section>

      <Section title="5. Kontak">
        <p>
          Jika Anda memiliki pertanyaan mengenai kebijakan privasi ini,
          silakan hubungi kami melalui halaman{" "}
          <a href="/contact" className="text-secondary hover:underline">
            Hubungi Kami
          </a>
          .
        </p>
      </Section>
    </div>
  );
}
