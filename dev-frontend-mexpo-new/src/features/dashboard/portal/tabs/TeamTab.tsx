import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Users, Trash2 } from "lucide-react";
import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import Image from "next/image";
import { Modal } from "@/shared/components/ui/Modal";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  getTenantMembers,
  inviteTenantMember,
  removeTenantMember,
  changeTenantMemberRole,
  TenantMember,
} from "@/services/tenant.service";
import LoadingState from "@/shared/components/ui/LoadingState";
import EmptyState from "@/shared/components/ui/EmptyState";

export function TeamTab({ tenantId }: { tenantId: string }) {
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: members, isLoading: loading } = useApiQuery<TenantMember[]>(
    keys.tenants.members(tenantId),
    () => getTenantMembers(tenantId),
  );

  const invite = useApiMutation(
    () => inviteTenantMember(tenantId, email.trim()),
    {
      invalidate: [keys.tenants.members(tenantId)],
      successMessage: "Undangan dikirim.",
      errorMessage: "Gagal mengundang anggota.",
      notify: toast,
      onSuccess: () => {
        setEmail("");
        setIsModalOpen(false);
      },
    },
  );

  const changeRole = useApiMutation(
    (args: { uuid: string; role: "OWNER" | "STAFF" }) =>
      changeTenantMemberRole(args.uuid, args.role),
    {
      invalidate: [keys.tenants.members(tenantId)],
      successMessage: "Peran diperbarui.",
      errorMessage: "Gagal mengubah peran.",
      notify: toast,
    },
  );

  const remove = useApiMutation(
    (uuid: string) => removeTenantMember(uuid),
    {
      invalidate: [keys.tenants.members(tenantId)],
      successMessage: "Anggota dihapus.",
      errorMessage: "Gagal menghapus anggota.",
      notify: toast,
    },
  );

  const inviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate();
  };

  const q = search.trim().toLowerCase();
  const list = (members ?? []).filter(
    (m) =>
      !q ||
      (m.user?.full_name ?? "").toLowerCase().includes(q) ||
      (m.user?.email ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 w-full max-w-md rounded-xl border border-gray-100 bg-white p-2">
          <SearchBar search={search} setSearch={setSearch} placeholder="Cari anggota..." />
        </div>
        <button
          type="button"
          onClick={() => {
            setEmail("");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white transition-colors h-10"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Undang Anggota</span>
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Undang Anggota Tim" maxWidth="max-w-md">
        <form onSubmit={inviteSubmit} className="space-y-5">
          <Input label="Email anggota" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={invite.isPending} className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors w-full sm:w-auto">
              {invite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Undang
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="hover:bg-gray-100 px-4 py-2 text-gray-600 text-sm font-semibold rounded-lg w-full sm:w-auto"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <LoadingState type="skeleton-list" count={3} className="py-4" />
      ) : (members ?? []).length === 0 ? (
        <EmptyState title="Belum ada anggota tim." />
      ) : list.length === 0 ? (
        <EmptyState title="Tidak ada anggota yang cocok dengan pencarian." />
      ) : (
        <div className="space-y-2">
          {list.map((m) => (
            <div key={m.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
              {m.user?.photo ? (
                 
                <Image src={m.user.photo} alt={m.user.full_name} width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
              ) : (
                <div className="flex justify-center items-center bg-brand-50 rounded-full w-10 h-10 text-brand-700">
                  <Users className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{m.user?.full_name}</p>
                <p className="text-gray-500 text-xs">
                  {m.user?.email} · {m.status} · <span className="font-medium">{m.role}</span>
                </p>
              </div>
              <select
                value={m.role}
                onChange={(e) => changeRole.mutate({ uuid: m.uuid, role: e.target.value as "OWNER" | "STAFF" })}
                className="px-3 py-2 border border-gray-200 rounded-lg text-gray-700 text-sm focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors"
              >
                <option value="STAFF">Staff</option>
                <option value="OWNER">Owner</option>
              </select>
              <button onClick={() => remove.mutate(m.uuid)} className="flex items-center justify-center bg-red-50 hover:bg-red-100 p-2 rounded-lg text-red-600 transition-colors" title="Hapus">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
