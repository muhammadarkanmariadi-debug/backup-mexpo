"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

import Input from "@/shared/components/form/Input";
import { changePassword } from "@/services/user.service";

/** Change password panel for the Profile popup — requires current password. */
export default function ChangePasswordForm() {
  const [current_password, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (current_password.length < 6) {
      toast.error("Kata sandi saat ini minimal 6 karakter.");
      return;
    }
    if (password.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setBusy(true);
    try {
      const res = await changePassword(current_password, password, confirm);
      if (!res.status) throw new Error(res.message || "Gagal mengubah kata sandi.");
      toast.success("Kata sandi berhasil diubah.");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah kata sandi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Kata Sandi Saat Ini"
        name="cur_password"
        id="cur_password"
        type="password"
        required
        value={current_password}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <Input
        label="Kata Sandi Baru"
        name="password"
        id="password"
        type="password"
        required
        placeholder="Minimal 6 karakter"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Konfirmasi Kata Sandi Baru"
        name="confirm_password"
        id="confirm_password"
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        Simpan Kata Sandi
      </button>
    </form>
  );
}