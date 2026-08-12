// src/app/(dashboard)/layout.tsx
// Dashboard shell — uses the public Navbar + Footer on a plain white surface.
//
// Server-side auth guard (second layer, on top of src/proxy.ts):
// The proxy only runs on full (hard) navigations — it does NOT protect
// client-side transitions (next/link, router.push). This layout is a Server
// Component that re-renders on every navigation (hard AND soft), so it reads
// the httpOnly `token` cookie here and redirects to /auth when missing.
// This covers every route in the (dashboard) group: /dashboard/* and /profile.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/widgets/Navbar";
import Footer from "@/widgets/Footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/auth");
  }

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
