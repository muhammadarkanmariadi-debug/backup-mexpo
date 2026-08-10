import { notFound } from "next/navigation";
import { Event } from "@/entities/event/event.entity";
import { getEventByUuidByMe } from "@/services/event.service";
import AttendancePage from "@/features/dashboard/attendance/AttendancePage";

async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export const metadata = {
  title: "Attendance",
};

export default async function AttendanceRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return <AttendancePage event={event} />;
}
