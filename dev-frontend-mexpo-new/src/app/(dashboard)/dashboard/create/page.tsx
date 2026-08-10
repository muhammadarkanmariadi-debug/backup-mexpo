import EventForm from "@/features/dashboard/event-form/EventForm";
import BackLink from "@/features/dashboard/shared/BackLink";

export const metadata = {
  title: "Buat Event",
};

export default function CreateEventPage() {
  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href="/dashboard" />
      <h1 className="mb-6 font-bold text-gray-900 text-2xl">Buat Event Baru</h1>
      <EventForm />
    </div>
  );
}
