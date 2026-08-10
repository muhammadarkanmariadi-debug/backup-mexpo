"use client";

import { Loader2 } from "lucide-react";

import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useAuthStore } from "@/stores/auth.store";
import { getUsers, UserListItem } from "@/services/user.service";
import BackLink from "@/features/dashboard/shared/BackLink";
import { useList } from "@/features/dashboard/shared/useList";
import RoleBadge from "@/shared/components/ui/RoleBadge";
import SortMenu from "@/shared/components/ui/SortMenu";

export default function UserManager() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const list = useList<UserListItem>((q) => getUsers(q), [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="mx-auto px-4 py-12 max-w-7xl text-center">
        <p className="text-gray-500">Halaman ini khusus Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BackLink href="/dashboard" />
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Manajemen User</h1>
      <p className="mb-6 text-sm text-gray-500">Kelola semua akun pengguna.</p>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari nama / email..." />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          {["", "true", "false"].map((v) => (
            <button
              key={v}
              onClick={() => list.applyFilter("is_active", v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                list.filters.is_active === v
                  ? "bg-secondary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {v === "" ? "Semua" : v === "true" ? "Aktif" : "Non-aktif"}
            </button>
          ))}
        </div>
        <SortMenu
          options={[
            { key: "full_name", label: "Nama" },
            { key: "email", label: "Email" },
            { key: "created_at", label: "Terdaftar" },
          ]}
          sortBy={list.sortBy}
          sortDir={list.sortDir}
          onChange={list.applySort}
        />
      </div>

      {list.loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : list.items.length === 0 ? (
        <div className="bg-white p-10 border border-gray-100 rounded-xl text-gray-500 text-sm text-center">
          Tidak ada user ditemukan.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-5 py-2.5">Nama</th>
                  <th className="px-5 py-2.5">Email</th>
                  <th className="px-5 py-2.5">Telepon</th>
                  <th className="px-5 py-2.5">Role</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.items.map((u) => (
                  <tr key={u.uuid}>
                    <td className="px-5 py-2.5 font-medium text-gray-800">{u.full_name}</td>
                    <td className="px-5 py-2.5 text-gray-500">{u.email}</td>
                    <td className="px-5 py-2.5 text-gray-500">{u.phone || "-"}</td>
                    <td className="px-5 py-2.5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                      >
                        {u.is_active ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <DataPagination
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.pageSize}
              totalItems={list.total}
              onPageChange={list.setPage}
              onItemsPerPageChange={(size) => { list.setPageSize(size); list.setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
}