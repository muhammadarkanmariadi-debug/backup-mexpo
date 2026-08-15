"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import Input from "@/shared/components/form/Input";
import Button from "@/shared/components/button/Button";
import { Event } from "@/entities/event/event.entity";
import { applySpeaker } from "@/services/event-content.service";

export default function SpeakerApplyForm({ event }: { event: Event }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    bio: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setBusy(true);
    try {
      const res = await applySpeaker(event.uuid, form, photo ?? undefined);
      if (!res.status) throw new Error(res.message || "Terjadi kesalahan yang tidak diketahui");
      
      toast.success("Pengajuan pembicara berhasil dikirim.");
      router.push(`/dashboard/${event.slug ?? event.uuid}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengajukan pembicara.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <Input
          label="Nama Lengkap"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">Biografi Singkat</label>
        <textarea
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-sm min-h-[100px] resize-y"
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tuliskan biografi singkat tentang diri Anda..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Foto Profil (Opsional)</label>
        <div className="flex items-center gap-4">
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 bg-gray-50/50 overflow-hidden relative">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <Upload className="w-6 h-6 mb-2 text-gray-400" />
                <span className="text-xs">Upload Foto</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-end">
        <Button
          type="submit"
          disabled={busy}
          startIcon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          className="px-8"
        >
          {busy ? "Mengirim..." : "Kirim Pengajuan"}
        </Button>
      </div>
    </form>
  );
}
