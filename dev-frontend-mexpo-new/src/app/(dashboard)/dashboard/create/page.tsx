import EventForm from "@/features/dashboard/event-form/EventForm";
import BackLink from "@/shared/components/ui/BackLink";
import PageShell from "@/shared/components/ui/PageShell";

export const metadata = {
  title: "Buat Event",
};

export default function CreateEventPage() {
  return (
    <PageShell className="py-8">
      <BackLink href="/dashboard" />
      <h1 className="mb-6 font-bold text-gray-900 text-2xl">Buat Event Baru</h1>
      <EventForm />
    </PageShell>
  );
}
