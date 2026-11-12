import { notFound } from "next/navigation";
import { Event, getEventRole, getRoleRoute } from "@/entities/event/event.entity";
import OwnerView from "@/features/dashboard/owner/OwnerView";
import CommitteeView from "@/features/dashboard/committee/CommitteeView";
import TenantView from "@/features/dashboard/tenant/TenantView";
import VisitorView from "@/features/dashboard/visitor/VisitorView";
import { getEventByUuidByMe } from "@/services/event.service";
import { getProfile } from "@/services/user.service";

async function getEvent(slug: string): Promise<Event | null> {
  const res = await getEventByUuidByMe(slug);
  if (res.status) return res.data ?? null;
  // A missing event is a 404; anything else (backend down, DB error) must not
  // masquerade as "not found" or as an empty event.
  if (res.code === 404) return null;
  throw new Error(res.message || "Gagal memuat event");
}

export default async function EventDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, user] = await Promise.all([
    getEvent(slug),
    getProfile().catch(() => null),
  ]);
  if (!event) notFound();

  // Superadmin has full master management access across all events
  if (user?.role === "SUPERADMIN") {
    return <OwnerView event={event} />;
  }

  const role = getEventRole(event);
  const roleRoute = getRoleRoute(role);

  if (roleRoute === "committee") {
    if (role === "OWNER") return <OwnerView event={event} />;
    return <CommitteeView event={event} />;
  }

  if (roleRoute === "tenant") return <TenantView event={event} />;
  return <VisitorView event={event} />;
}