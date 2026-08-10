// src/app/(dashboard)/layout.tsx
// Dashboard shell — uses the public Navbar + Footer on a plain white surface.

import Navbar from "@/widgets/Navbar";
import Footer from "@/widgets/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen text-gray-900">
      <Navbar />

      <main className="flex-1 bg-white w-full max-w-7xl mx-auto mt-8 px-4 sm:px-6 py-6">
        {children}
      </main>

      <Footer />
    </div>
  );
}
