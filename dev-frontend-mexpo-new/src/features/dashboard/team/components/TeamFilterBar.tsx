import SearchBar from "@/shared/components/form/SearchBar";
import SortMenu from "@/shared/components/ui/SortMenu";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS, labelFor } from "@/shared/data/labels";

const ROLES = ["OWNER", "COMMITTEE"] as const;
const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

interface Props {
  search: string;
  onSearch: (s: string) => void;
  roleFilter: string;
  statusFilter: string;
  onFilter: (key: string, value: string) => void;
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (key: string, dir: "asc" | "desc") => void;
}

export function TeamFilterBar({ search, onSearch, roleFilter, statusFilter, onFilter, sortBy, sortDir, onSort }: Props) {
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-white p-4">
      <SearchBar search={search} setSearch={onSearch} placeholder="Cari nama/email..." />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Role:</span>
        <button
          onClick={() => onFilter("role", "")}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${!roleFilter ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Semua
        </button>
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => onFilter("role", r)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleFilter === r ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {labelFor(ROLE_LABELS, r, r)}
          </button>
        ))}

        <span className="ml-2 text-xs font-medium text-gray-500">Status:</span>
        <button
          onClick={() => onFilter("status", "")}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${!statusFilter ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Semua
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onFilter("status", s)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusFilter === s ? "bg-secondary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {labelFor(APPROVAL_STATUS_LABELS, s, s)}
          </button>
        ))}

        <span className="ml-2 inline-flex items-center">
          <SortMenu
            options={[
              { key: "full_name", label: "Nama" },
              { key: "role", label: "Peran" },
              { key: "created_at", label: "Terdaftar" },
            ]}
            sortBy={sortBy}
            sortDir={sortDir}
            onChange={onSort}
          />
        </span>
      </div>
    </div>
  );
}
