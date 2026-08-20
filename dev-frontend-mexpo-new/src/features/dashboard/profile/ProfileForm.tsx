"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Save } from "lucide-react";

import Input from "@/shared/components/form/Input";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth.store";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getProfile, updateProfile } from "@/services/user.service";

/**
 * Profile edit form — reused by the Profile popup (ProfileModal).
 * Kept as a plain card body so it fits inside a dialog without PageShell.
 */
export default function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    organization: user?.organization ?? "",
  });
  const [photo, setPhoto] = useState<File | null>(null);

  // Server-backed profile fetch (getProfile returns the raw User).
  const { isLoading: loading } = useApiQuery(keys.profile.me, getProfile, {
    onSuccess: (profile) => {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        organization: profile.organization ?? "",
      });
    },
  });

  const update = useApiMutation(
    async () =>
      updateProfile(
        {
          full_name: form.full_name || undefined,
          phone: form.phone || undefined,
          organization: form.organization || undefined,
        },
        photo ?? undefined,
      ),
    {
      invalidate: [keys.profile.me],
      successMessage: "Profil diperbarui.",
      errorMessage: "Gagal menyimpan profil.",
      notify: toast,
      onSuccess: async () => {
        // Refresh the zustand store so the navbar/avatar update immediately.
        setUser(await getProfile());
        setPhoto(null);
      },
    },
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  const photoPreview = photo ? URL.createObjectURL(photo) : user?.photo;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4">
        {photoPreview ? (
           
          <Image src={photoPreview} alt="Foto profil" width={80} height={80} unoptimized className="h-20 w-20 rounded-full object-cover" />
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
        name="full_name"
        id="profile_full_name"
        required
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <Input
        label="No. HP"
        name="phone"
        id="profile_phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="Organisasi"
        name="organization"
        id="profile_organization"
        value={form.organization}
        onChange={(e) => setForm({ ...form, organization: e.target.value })}
      />

      <button
        type="submit"
        disabled={update.isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
      >
        {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Simpan Profil
      </button>
    </form>
  );
}