import { notFound } from "next/navigation";
import { BASE_API_URL } from "@/global";
import { Event, getEventRole, getRoleRoute } from "@/entities/event/event.entity";
import { getCookies } from "@/shared/utils/cookies";
import OwnerView from "@/features/dashboard/owner/OwnerView";
import CommitteeView from "@/features/dashboard/committee/CommitteeView";
import TenantView from "@/features/dashboard/tenant/TenantView";
import VisitorView from "@/features/dashboard/visitor/VisitorView";
import { getEventByUuidByMe } from "@/services/event.service";





async function getEvent(slug: string): Promise<Event | null> {
  try {
    const res = await getEventByUuidByMe(slug);

    return res.data ?? null;
  } catch {
    return null;
  }
}

export default async function EventDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);  // ✅ pass string langsung
  if (!event) notFound();

  const role = getEventRole(event);
  const roleRoute = getRoleRoute(role);

  if (roleRoute === "committee") {
    if (role === "OWNER") return <OwnerView event={event} />;
    return <CommitteeView event={event} />;
  }

  if (roleRoute === "tenant") return <TenantView event={event} />;
  return <VisitorView event={event} />;
}