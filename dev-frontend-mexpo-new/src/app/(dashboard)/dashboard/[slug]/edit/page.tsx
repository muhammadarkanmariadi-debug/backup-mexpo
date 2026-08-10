import { notFound } from "next/navigation";
import { Event } from "@/entities/event/event.entity";
import { getEventByUuidByMe } from "@/services/event.service";
import EventForm from "@/features/dashboard/event-form/EventForm";
import BackLink from "@/features/dashboard/shared/BackLink";

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Edit Event",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <div className="mx-auto px-4 py-8 max-w-7xl">
      <BackLink href={`/dashboard/${slug}`} />
      <h1 className="mb-6 font-bold text-gray-900 text-2xl">Edit Event</h1>
      <EventForm event={event} />
    </div>
  );
}
