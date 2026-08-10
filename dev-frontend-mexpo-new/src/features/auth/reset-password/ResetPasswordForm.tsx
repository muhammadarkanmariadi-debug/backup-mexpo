"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { verifyResetPassword } from "@/services/user.service";

export default function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-red-600">
        Tautan reset tidak valid. Minta tautan baru dari halaman lupa kata sandi.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      const res = await verifyResetPassword(token, password, confirm);
      if (!res.status) throw new Error();
      setDone(true);
      setTimeout(() => router.push("/auth"), 1500);
    } catch {
      toast.error("Gagal mengatur ulang kata sandi. Tautan mungkin kedaluwarsa.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h1 className="mb-2 text-xl font-bold text-gray-900">Berhasil!</h1>
        <p className="text-sm text-gray-500">Kata sandi kamu sudah diubah. Mengarahkan ke login...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Atur Ulang Kata Sandi</h1>
      <p className="mb-6 text-sm text-gray-500">Masukkan kata sandi baru kamu.</p>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Kata Sandi Baru"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Konfirmasi Kata Sandi"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Simpan Kata Sandi
        </button>
      </form>
    </div>
  );
}
