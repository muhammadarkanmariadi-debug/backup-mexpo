"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import Input from "@/shared/components/form/Input";
import Button from "@/shared/components/button/Button";
import { Event } from "@/entities/event/event.entity";
import { applyTenant } from "@/services/tenant.service";
import { getTenantCategories, TenantCategory } from "@/services/tenant-category.service";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import Image from "next/image";

export default function TenantApplyForm({ event }: { event: Event }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    phone: "",
    category_id: "",
  });

  const { data: categories = [], isLoading: loadingCategories } = useApiQuery<TenantCategory[]>(
    keys.tenantCategories(),
    async () => {
      const res = await getTenantCategories();
      return res.data;
    }
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id) {
      toast.error("Silakan pilih kategori");
      return;
    }

    setBusy(true);
    try {
      const res = await applyTenant(event.uuid, form, photo ?? undefined);
      if (!res.status) throw new Error(res.message || "Terjadi kesalahan yang tidak diketahui");
      
      toast.success("Pengajuan penyewa berhasil dikirim.");
      router.push(`/dashboard/${event.slug ?? event.uuid}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan tenant.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nama Tenant"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori Tenant <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full h-11 px-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm bg-white"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            required
            disabled={loadingCategories}
          >
            <option value="" disabled>Pilih Kategori</option>
            {categories.map(c => (
              <option key={c.uuid} value={c.uuid}>{c.name}</option>
            ))}
          </select>
        </div>

        <Input
          label="No. Telepon / WhatsApp"
          required
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <Input
          label="Email (Opsional)"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <Input
          label="Website / Instagram (Opsional)"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Deskripsi</label>
        <textarea
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm min-h-[100px] resize-y"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Jelaskan produk atau layanan Anda..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo Tenant</label>
        <div className="flex items-center gap-4">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 bg-gray-50/50 overflow-hidden relative">
            {photoPreview ? (
               
              <Image src={photoPreview} alt="Logo" fill unoptimized className="object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                <span className="text-xs">Upload Logo</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button
          type="submit"
          disabled={busy || loadingCategories}
          startIcon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          className="px-8"
        >
          {busy ? "Mengirim..." : "Kirim Pengajuan"}
        </Button>
      </div>
    </form>
  );
}
