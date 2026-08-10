import { notFound } from "next/navigation";
import { Event } from "@/entities/event/event.entity";
import { getEventByUuidByMe } from "@/services/event.service";
import RegistrationManager from "@/features/dashboard/registration/RegistrationManager";

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Atur Registrasi",
};

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return <RegistrationManager event={event} />;
}
