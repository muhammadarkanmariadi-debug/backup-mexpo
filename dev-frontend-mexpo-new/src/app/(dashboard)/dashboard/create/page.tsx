import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EventForm from "@/features/dashboard/event-form/EventForm";
import PageShell from "@/shared/components/ui/PageShell";

export const metadata = {
  title: "Buat Event",
};

export default function CreateEventPage() {
  return (
    <PageShell className="py-6 sm:py-8 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-brand-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Page Title & Subtitle matching the design */}
      <div className="mb-8">
        <h1 className="font-extrabold text-2xl sm:text-3xl text-gray-900 tracking-tight">
          Buat Event Baru
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500">
          Lengkapi informasi event untuk mulai membuat event di Mexpo.
        </p>
      </div>

      {/* Main Stepper Form */}
      <EvevntForm />
    </PageShell>
  );
}
