import Image from "next/image";
import { CheckCircle2, XCircle } from "lucide-react";

import { EventUser } from "@/services/event-users.service";
import RoleBadge from "@/shared/components/ui/RoleBadge";
import Badge from "@/shared/components/ui/Badge";
import RowActions, { deleteAction } from "@/shared/components/ui/RowActions";
import { APPROVAL_STATUS_LABELS, labelFor } from "@/shared/data/labels";

interface Props {
  m: EventUser;
  busy: boolean;
  onChangeRole: (m: EventUser, role: EventUser["role"]) => void;
  onDecide: (m: EventUser, status: "APPROVED" | "REJECTED") => void;
  onRemove: (m: EventUser) => void;
}

export function TeamMemberRow({ m, busy, onChangeRole, onDecide, onRemove }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 hover:shadow-sm transition-shadow">
      {m.user?.photo ? (
        <Image src={m.user.photo} alt={m.user.full_name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 font-medium">
          {(m.user?.full_name ?? "?")[0]}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 text-sm">{m.user?.full_name}</p>
        <p className="truncate text-xs text-gray-500">{m.user?.email}</p>
      </div>
      
      <RoleBadge role={m.role} />
      
      {m.status === "PENDING" ? (
        <Badge tone="warning">Menunggu</Badge>
      ) : (
        <Badge tone="success">{labelFor(APPROVAL_STATUS_LABELS, m.status, m.status)}</Badge>
      )}

      {m.role !== "OWNER" && (
        <>
          <select
            value={m.role}
            onChange={(e) => onChangeRole(m, e.target.value as EventUser["role"])}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-600 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
            disabled={busy}
          >
            <option value="COMMITTEE">Panitia</option>
            <option value="VISITOR">Pengunjung</option>
            <option value="TENANT">Penyewa</option>
          </select>
          {m.status === "PENDING" && (
            <>
              <button
                onClick={() => onDecide(m, "APPROVED")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Setujui
              </button>
              <button
                onClick={() => onDecide(m, "REJECTED")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" /> Tolak
              </button>
            </>
          )}
          <RowActions actions={[deleteAction(() => onRemove(m))]} busy={busy} />
        </>
      )}
    </div>
  );
}
