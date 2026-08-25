import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { getEventUsers, verifyEventUser, EventUser } from "@/services/event-users.service";
import { useList } from "@/shared/hooks/useList";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS, labelFor } from "@/shared/data/labels";
import LoadingState from "@/shared/components/ui/LoadingState";
import EmptyState from "@/shared/components/ui/EmptyState";

interface Props {
  event: Event;
}

const REQUEST_TABS = ["", "PENDING", "APPROVED", "REJECTED"] as const;

function tabLabel(tab: string) {
  return tab === "" ? "Semua" : labelFor(APPROVAL_STATUS_LABELS, tab, tab);
}

export function UsersTab({ event }: Props) {
  const requests = useList<EventUser>(
    (q) => getEventUsers(event.uuid, { ...q, role: "VISITOR" }),
    [event.uuid],
  );

  const decideUser = useApiMutation(
    (args: { u: EventUser; status: "APPROVED" | "REJECTED" }) =>
      verifyEventUser(args.u.uuid, args.status),
    {
      successMessage: "",
      errorMessage: "",
      notify: toast,
      onSuccess: (_data, { status }) => {
        toast.success(
          status === "APPROVED" ? "Permintaan disetujui." : "Permintaan ditolak.",
        );
        requests.refetch();
      },
      onError: () => toast.error("Gagal memperbarui status."),
    },
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {REQUEST_TABS.map((t) => (
          <button
            key={t}
            onClick={() => requests.applyFilter("status", t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${(requests.filters.status || "") === t ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {tabLabel(t)}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <SearchBar search={requests.search} setSearch={requests.applySearch} placeholder="Cari nama/email..." />
        </div>
      </div>
      
      {requests.loading ? (
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : requests.items.length === 0 ? (
        <EmptyState title="Tidak ada permintaan." />
      ) : (
        <>
          <div className="space-y-3">
            {requests.items.map((u) => (
              <div key={u.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl transition-shadow hover:shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{u.user?.full_name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {u.user?.email} • {labelFor(ROLE_LABELS, u.role, u.role)} • {labelFor(APPROVAL_STATUS_LABELS, u.status, u.status)}
                  </p>
                </div>
                {u.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => decideUser.mutate({ u, status: "APPROVED" })}
                      disabled={decideUser.isPending}
                      className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Setujui
                    </button>
                    <button
                      onClick={() => decideUser.mutate({ u, status: "REJECTED" })}
                      disabled={decideUser.isPending}
                      className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DataPagination
              currentPage={requests.page}
              totalPages={requests.totalPages}
              itemsPerPage={requests.pageSize}
              totalItems={requests.total}
              onPageChange={requests.setPage}
              onItemsPerPageChange={(size) => { requests.setPageSize(size); requests.setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
}
