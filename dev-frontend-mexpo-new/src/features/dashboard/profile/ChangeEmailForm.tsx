"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { useAuthStore } from "@/stores/auth.store";
import { changeEmail } from "@/services/user.service";

/**
 * Change email panel for the Profile popup. Requires the current password;
 * the account is set inactive again until the new address is verified.
 */
export default function ChangeEmailForm() {
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [current_password, setCurrent] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!current_password) {
      toast.error("Masukkan kata sandi saat ini.");
      return;
    }
    setBusy(true);
    try {
      const res = await changeEmail(email, current_password);
      if (!res.status) throw new Error(res.message || "Gagal mengubah email.");
      toast.success(res.message || "Tautan verifikasi dikirim ke email baru.");
      setEmail("");
      setCurrent("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-gray-700">
        Email saat ini: <strong>{user?.email ?? "-"}</strong>. Mengganti email akan membuat akun
        menunggu verifikasi ulang — tautan verifikasi dikirim ke alamat baru Anda.
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Email Baru"
          name="email"
          id="email"
          type="email"
          required
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Kata Sandi Saat Ini"
          name="current_password"
          id="email_cur_password"
          type="password"
          required
          value={current_password}
          onChange={(e) => setCurrent(e.target.value)}
        />

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
          Simpan Email
        </button>
      </form>
    </div>
  );
}