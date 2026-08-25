import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Upload } from "lucide-react";
import Input from "@/shared/components/form/Input";
import SearchBar from "@/shared/components/form/SearchBar";
import Image from "next/image";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { Modal } from "@/shared/components/ui/Modal";
import { TenantProduct } from "@/entities/event/tenant.entity";
import { useList } from "@/shared/hooks/useList";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  ProductPayload,
} from "@/services/product.service";
import LoadingState from "@/shared/components/ui/LoadingState";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import RowActions, { editAction, deleteAction } from "@/shared/components/ui/RowActions";
import EmptyState from "@/shared/components/ui/EmptyState";

export function ProductsTab({ tenantId }: { tenantId: string }) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { confirm, dialogs } = useConfirm();

  const list = useList<TenantProduct>((q) => getProducts(tenantId, q), [tenantId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload: ProductPayload = { name: form.name, description: form.description, price: Number(form.price) || 0 };
      const res = editingId
        ? await updateProduct(editingId, payload, photo ?? undefined)
        : await createProduct(tenantId, payload, photo ?? undefined);
      if (!res.status) throw new Error();
      toast.success(editingId ? "Produk diperbarui." : "Produk ditambahkan.");
      setForm({ name: "", description: "", price: "" });
      setPhoto(null);
      setPhotoPreview("");
      setEditingId(null);
      setIsModalOpen(false);
      list.refetch();
    } catch {
      toast.error("Gagal menyimpan produk.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (p: TenantProduct) => {
    setEditingId(p.uuid);
    setForm({ name: p.name, description: p.description, price: String(p.price) });
    setPhotoPreview(p.photo ?? "");
    setIsModalOpen(true);
  };

  const remove = async (p: TenantProduct) => {
    if (!(await confirm(`Hapus produk "${p.name}"?`))) return;
    const res = await deleteProduct(p.uuid);
    if (!res.status) {
      toast.error("Gagal menghapus produk.");
      return;
    }
    toast.success("Produk dihapus.");
    list.refetch();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|jpg)$/.test(file.type)) {
      toast.error("Hanya file gambar (JPG/PNG/GIF) yang diizinkan.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 w-full max-w-md rounded-xl border border-gray-100 bg-white p-2">
          <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari produk..." />
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm({ name: "", description: "", price: "" });
            setPhotoPreview("");
            setPhoto(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-lg font-semibold text-white transition-colors h-10"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Produk</span>
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setForm({ name: "", description: "", price: "" });
          setPhotoPreview("");
        }}
        title={editingId ? "Edit Produk" : "Tambah Produk"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Foto Produk (opsional)
            </label>
            <div className="flex items-start gap-4">
              <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl w-32 h-32 overflow-hidden shrink-0">
                {photoPreview ? (
                   
                  <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    Belum ada foto
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Pilih Foto
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview("");
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Hapus
                  </button>
                )}
                <p className="text-[11px] text-gray-400">
                  JPG/PNG/GIF, maks 5 MB
                </p>
              </div>
            </div>
          </div>
          <Input label="Nama" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Deskripsi" type="text-area" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Harga (Rp)" type="number" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors w-full sm:w-auto">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Simpan" : "Tambah"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingId(null);
                setForm({ name: "", description: "", price: "" });
                setPhotoPreview("");
              }}
              className="hover:bg-gray-100 px-4 py-2 text-gray-600 text-sm font-semibold rounded-lg w-full sm:w-auto"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      <div className="mb-4 rounded-xl border border-gray-100 bg-white p-3">
        <SearchBar search={list.search} setSearch={list.applySearch} placeholder="Cari produk..." />
      </div>

      {list.loading ? (
        <LoadingState type="skeleton-list" count={4} className="py-4" />
      ) : list.items.length === 0 ? (
        <EmptyState title="Belum ada produk." className="py-8" />
      ) : (
        <>
          <div className="space-y-2">
            {list.items.map((p) => (
              <div key={p.uuid} className="flex items-center gap-3 bg-white px-4 py-3 border border-gray-100 rounded-xl">
                {p.photo && (
                   
                  <Image src={p.photo} alt={p.name} width={44} height={44} className="rounded-lg w-11 h-11 object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                  <p className="text-gray-500 text-xs">Rp {p.price?.toLocaleString("id-ID")}</p>
                </div>
                <RowActions actions={[editAction(() => startEdit(p)), deleteAction(() => remove(p))]} busy={busy} />
              </div>
            ))}
          </div>
          <div className="mt-3">
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

      {dialogs}
    </div>
  );
}
