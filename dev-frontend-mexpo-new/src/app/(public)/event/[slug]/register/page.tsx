import { notFound } from "next/navigation";
import { Event, TicketType } from "@/entities/event/event.entity";
import { getEventByUuid } from "@/services/public.service";
import { getRegistrationFields, getTicketTypes } from "@/services/registration.service";
import RegistrationForm from "@/features/public/registration/RegistrationForm";

export const metadata = {
  title: "Registrasi Event",
};

export default async function RegisterEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventRes = await getEventByUuid(slug);
  const event: Event | null = eventRes.data ?? null;
  if (!event || eventRes.status === false) notFound();

  const fieldsRes = await getRegistrationFields(event.uuid);
  const fields = fieldsRes.data ?? [];

  let ticketTypes: TicketType[] = [];
  if (event.ticket_mode === "PAID" || event.features?.paidTicket === true) {
    const ttRes = await getTicketTypes(event.uuid);
    ticketTypes = ttRes.data ?? [];
  }

  return (
    <RegistrationForm event={event} fields={fields} ticketTypes={ticketTypes} />
  );
}
