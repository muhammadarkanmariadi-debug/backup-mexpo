"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Save } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { useAuthStore } from "@/stores/auth.store";
import { getProfile, updateProfile } from "@/services/user.service";
import BackLink from "@/features/dashboard/shared/BackLink";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    organization: user?.organization ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        if (cancelled) return;
        setForm({
          full_name: profile.full_name ?? "",
          phone: profile.phone ?? "",
          organization: profile.organization ?? "",
        });
      } catch {
        // keep current store data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updateProfile(
        {
          full_name: form.full_name || undefined,
          phone: form.phone || undefined,
          organization: form.organization || undefined,
        },
        photo ?? undefined,
      );
      if (!res.status) throw new Error();
      toast.success("Profil diperbarui.");
      const fresh = await getProfile();
      setUser(fresh);
      setPhoto(null);
    } catch {
      toast.error("Gagal menyimpan profil.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const photoPreview = photo ? URL.createObjectURL(photo) : user?.photo;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <BackLink href="/dashboard" />
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Profil Saya</h1>

      <form onSubmit={submit} className="space-y-5 rounded-xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Foto profil" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-500">
              {(form.full_name ?? "?")[0]}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <Camera className="h-4 w-4" /> {photo ? "Ganti foto" : "Upload foto"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <Input
          label="Nama Lengkap"
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
          />
        </div>
        <Input
          label="No. HP"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          label="Organisasi"
          value={form.organization}
          onChange={(e) => setForm({ ...form, organization: e.target.value })}
        />

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Profil
        </button>
      </form>
    </div>
  );
}
