import { notFound } from "next/navigation";
import { Event } from "@/entities/event/event.entity";
import { getEventByUuidByMe } from "@/services/event.service";
import BoothCheckInPage from "@/features/dashboard/booth/BoothCheckInPage";

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Scan Booth",
};

export default async function BoothCheckinRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return <BoothCheckInPage event={event} />;
}
