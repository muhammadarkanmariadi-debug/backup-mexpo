// src/app/(public)/terms/page.tsx
// Halaman statis — Syarat & Ketentuan

import React from "react";

export const metadata = {
  title: "Syarat & Ketentuan",
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

export default function TermsPage() {
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full max-w-4xl">
      <h1 className="mb-8 font-public-sans font-extrabold text-gray-900 text-3xl sm:text-4xl">
        Syarat & Ketentuan
      </h1>

      <Section title="1. Penerimaan Ketentuan">
        <p>
          Dengan menggunakan platform Mexpo, Anda menyetujui seluruh syarat dan
          ketentuan yang berlaku di bawah ini.
        </p>
      </Section>

      <Section title="2. Penggunaan Layanan">
        <p>
          Anda bertanggung jawab atas keakuratan data yang Anda berikan saat
          mendaftar event atau menggunakan dashboard penyelenggara.
        </p>
      </Section>

      <Section title="3. Akun dan Keamanan">
        <p>
          Anda wajib menjaga kerahasiaan kredensial akun Anda. Segala aktivitas
          yang terjadi menggunakan akun Anda menjadi tanggung jawab Anda.
        </p>
      </Section>

      <Section title="4. Kebijakan Event">
        <p>
          Setiap event yang dibuat melalui platform ini tunduk pada proses
          persetujuan (approval) dan aturan penyelenggaraan yang ditetapkan
          penyelenggara.
        </p>
      </Section>

      <Section title="5. Perubahan Ketentuan">
        <p>
          Kami dapat memperbarui syarat dan ketentuan ini sewaktu-waktu.
          Perubahan akan diinformasikan melalui platform.
        </p>
      </Section>
    </div>
  );
}
