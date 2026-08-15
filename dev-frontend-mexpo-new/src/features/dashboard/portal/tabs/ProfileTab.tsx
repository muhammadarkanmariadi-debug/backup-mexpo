import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Pencil } from "lucide-react";
import Input from "@/shared/components/form/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { Tenant } from "@/entities/event/tenant.entity";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  getTenantDetail,
  updateTenant,
  TenantProfilePayload,
} from "@/services/tenant.service";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

export function ProfileTab({ tenantId }: { tenantId: string }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [form, setForm] = useState<TenantProfilePayload>({
    name: "",
    description: "",
    phone: "",
    website: "",
    email: "",
    booth_number: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tenant, isLoading: loading } = useApiQuery<Tenant | null>(
    keys.tenants.detail(tenantId),
    () => getTenantDetail(tenantId),
    {
      onSuccess: (data) => {
        if (data) {
          setForm({
            name: data.name,
            description: data.description,
            phone: data.phone,
            website: data.website,
            email: data.email,
            booth_number: data.booth_number,
          });
          if (data.logo) {
            setPhotoPreview(data.logo);
          }
        }
      },
    },
  );

  const update = useApiMutation(
    () => updateTenant(tenantId, form, logo ?? undefined),
    {
      invalidate: [keys.tenants.detail(tenantId)],
      successMessage: "Profil diperbarui.",
      errorMessage: "Gagal menyimpan profil.",
      notify: toast,
      onSuccess: () => {
        setIsModalOpen(false);
      }
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate();
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
    setLogo(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  if (loading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start gap-6">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
          {tenant?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant?.logo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Belum Ada Logo</div>
          )}
        </div>
        <div className="flex-1 space-y-2 w-full">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
             <h2 className="text-xl font-bold text-gray-900">{tenant?.name}</h2>
             <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors shrink-0">
               <Pencil className="w-4 h-4" /> Edit Profil
             </button>
          </div>
          <p className="text-gray-500 text-sm whitespace-pre-wrap">{tenant?.description || "Belum ada deskripsi"}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 pt-4 border-t border-gray-100">
            <div>
               <span className="block text-gray-500 mb-1 text-xs">Telepon</span>
               <span className="font-medium text-gray-900 text-sm">{tenant?.phone || "—"}</span>
            </div>
            <div>
               <span className="block text-gray-500 mb-1 text-xs">Surel</span>
               <span className="font-medium text-gray-900 text-sm">{tenant?.email || "—"}</span>
            </div>
            <div>
               <span className="block text-gray-500 mb-1 text-xs">Website</span>
               <span className="font-medium text-gray-900 text-sm">{tenant?.website || "—"}</span>
            </div>
            <div>
               <span className="block text-gray-500 mb-1 text-xs">Nomor Booth</span>
               <span className="font-medium text-gray-900 text-sm">{tenant?.booth_number || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Profil Penyewa" maxWidth="max-w-2xl">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-sm">
              Logo Penyewa
            </label>
            <div className="flex items-start gap-4">
              <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl w-32 h-32 overflow-hidden shrink-0">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    Belum ada logo
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Pilih Logo
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
                      setLogo(null);
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
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
            <Input label="Telepon" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Nomor Booth" value={form.booth_number} onChange={(e) => setForm({ ...form, booth_number: e.target.value })} />
            <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Surel" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={update.isPending} className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-2.5 rounded-lg font-semibold text-white transition-colors w-full sm:w-auto">
              {update.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Profil
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
    </div>
  );
}
