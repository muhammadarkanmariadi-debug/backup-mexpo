import { notFound } from "next/navigation";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { getEventByUuidByMe } from "@/services/event.service";
import { getEventWorkshops } from "@/services/event-data.service";
import CheckInPage from "@/features/dashboard/checkin/CheckInPage";

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Check-in",
};

export default async function EventCheckInPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const workshopsRes = await getEventWorkshops(event.uuid);
  const workshops: Workshop[] = workshopsRes.data ?? [];

  return <CheckInPage event={event} workshops={workshops} />;
}
