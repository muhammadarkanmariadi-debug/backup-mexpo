import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import Input from "@/shared/components/form/Input";
import Image from "next/image";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { createTenant, TenantProfilePayload } from "@/services/tenant.service";
import { httpGet } from "@/shared/utils/http-client";
import { META_DYNAMIC } from "@/shared/utils/http-meta";

export function CreateTenantForm({ eventId, onSuccess }: { eventId: string; onSuccess: () => void }) {
  const [logo, setLogo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [form, setForm] = useState<TenantProfilePayload>({
    name: "",
    description: "",
    phone: "",
    website: "",
    email: "",
    booth_number: "",
    category_id: "",
  });

  const { data: categories } = useApiQuery<{ uuid: string; name: string }[]>(
    ["tenant-categories"],
    async () => {
      const res = await httpGet("tenant-categories", "token", META_DYNAMIC);
      return { data: (res.data as { uuid: string; name: string }[]) ?? [], status: res.status, message: res.message };
    }
  );

  const create = useApiMutation(
    () => createTenant(eventId, form, logo ?? undefined),
    {
      successMessage: "Profil penyewa berhasil dibuat.",
      errorMessage: "Gagal membuat profil penyewa.",
      notify: toast,
      onSuccess: onSuccess,
    }
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate();
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

  return (
    <form onSubmit={submit} className="space-y-5 bg-white p-6 border border-gray-100 rounded-xl max-w-3xl">
      <div>
        <label className="block mb-2 font-medium text-gray-700 text-sm">
          Logo Tenant
        </label>
        <div className="flex items-start gap-4">
          <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl w-32 h-32 overflow-hidden">
            {photoPreview ? (
               
              <Image src={photoPreview} alt="Preview" fill unoptimized className="object-cover" />
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

      <Input label="Nama Tenant" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Input label="Deskripsi" type="text-area" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700 text-sm">Kategori</label>
        <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="h-11 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm bg-white text-gray-800 focus:border-brand-300 focus:ring-brand-500/10 focus:outline-hidden transition-colors">
          <option value="">Pilih kategori...</option>
          {(categories ?? []).map((c) => (
            <option key={c.uuid} value={c.uuid}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
        <Input label="Telepon" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Nomor Booth" value={form.booth_number} onChange={(e) => setForm({ ...form, booth_number: e.target.value })} />
        <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <button type="submit" disabled={create.isPending} className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-3.5 rounded-lg font-semibold text-white transition-colors w-full sm:w-auto">
        {create.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Buat Profil
      </button>
    </form>
  );
}
