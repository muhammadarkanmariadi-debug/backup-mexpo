"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useList } from "@/shared/hooks/useList";
import { useApiMutation } from "@/lib/hooks/useApi";
import {
  TenantCategory,
  getTenantCategories,
  createTenantCategory,
  updateTenantCategory,
  deleteTenantCategory,
} from "@/services/tenant-category.service";
import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Modal } from "@/shared/components/ui/Modal";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import PageHeader from "@/shared/components/ui/PageHeader";
import Button from "@/shared/components/button/Button";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";

export default function TenantCategoryManager() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { confirm, dialogs } = useConfirm();
  
  const list = useList<TenantCategory>((q: Record<string, string>) => getTenantCategories(q.search), []);

  const create = useApiMutation(
    () => createTenantCategory(form),
    {
      successMessage: "Kategori berhasil dibuat.",
      errorMessage: "Gagal membuat kategori.",
      notify: toast,
      onSuccess: () => {
        setForm({ name: "", description: "" });
        setIsModalOpen(false);
        list.refetch();
      },
    }
  );

  const update = useApiMutation(
    () => updateTenantCategory(editingId!, form),
    {
      successMessage: "Kategori diperbarui.",
      errorMessage: "Gagal memperbarui kategori.",
      notify: toast,
      onSuccess: () => {
        setEditingId(null);
        setForm({ name: "", description: "" });
        setIsModalOpen(false);
        list.refetch();
      },
    }
  );

  const remove = async (id: string) => {
    if (!(await confirm("Hapus kategori ini? Pastikan tidak ada tenant yang masih menggunakan kategori ini."))) return;
    try {
      await deleteTenantCategory(id);
      toast.success("Kategori dihapus.");
      list.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kategori.");
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      update.mutate();
    } else {
      create.mutate();
    }
  };

  const startEdit = (c: TenantCategory) => {
    setEditingId(c.uuid);
    setForm({ name: c.name, description: c.description || "" });
    setIsModalOpen(true);
  };

  const busy = create.isPending || update.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori Tenant"
        subtitle="Kelola kategori untuk booth dan produk tenant."
        action={
          <Button
            size="xs"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", description: "" });
              setIsModalOpen(true);
            }}
          >
            Tambah Kategori
          </Button>
        }
      />

      <div className="space-y-4">
          <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
            <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari kategori..." />
          </div>

          {list.loading ? (
            <div className="bg-white p-12 border border-gray-100 rounded-xl shadow-sm flex justify-center items-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : list.items.length === 0 ? (
            <div className="bg-white p-12 border border-gray-100 rounded-xl shadow-sm text-center">
              <p className="text-gray-500 text-sm">Tidak ada kategori yang ditemukan.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {list.items.map((c: TenantCategory) => (
                  <div key={c.uuid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{c.name}</h4>
                      {c.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{c.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEdit(c)} 
                        className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-600 transition-colors" 
                        title="Ubah"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => remove(c.uuid)} 
                        className="flex items-center justify-center bg-red-50 hover:bg-red-100 p-2 rounded-lg text-red-600 transition-colors" 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {list.total > list.pageSize && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <DataPagination
                    currentPage={list.page}
                    totalPages={list.totalPages}
                    itemsPerPage={list.pageSize}
                    totalItems={list.total}
                    onPageChange={list.setPage}
                    onItemsPerPageChange={list.setPageSize}
                  />
                </div>
              )}
            </div>
          )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Kategori" : "Tambah Kategori Baru"} maxWidth="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <Input 
            label="Nama Kategori" 
            required 
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            placeholder="Misal: Kuliner, Edukasi, dll."
          />
          <Input 
            label="Deskripsi" 
            type="text-area"
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })} 
            placeholder="Deskripsi kategori..."
          />
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={busy} 
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-2 rounded-lg font-semibold text-white text-sm transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {editingId ? "Simpan" : "Tambah"}
            </button>
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)} 
              className="px-4 py-2 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      {dialogs}
    </div>
  );
}
