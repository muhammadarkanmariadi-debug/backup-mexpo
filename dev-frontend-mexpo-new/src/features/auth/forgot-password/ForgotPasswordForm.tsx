"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";

import Input from "@/shared/components/form/Input";
import { requestResetPassword } from "@/services/user.service";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await requestResetPassword(email);
      if (!res.status) throw new Error();
      setSent(true);
    } catch {
      toast.error("Gagal mengirim email atur ulang. Periksa kembali email kamu.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <MailCheck className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">Cek Email Kamu</h1>
        <p className="mb-6 text-sm text-gray-500">
          Jika email terdaftar, kami sudah mengirim tautan untuk mengatur ulang
          kata sandi ke <strong>{email}</strong>.
        </p>
        <Link href="/auth" className="text-sm font-semibold text-secondary hover:underline">
          Kembali ke Halaman Masuk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Lupa Kata Sandi</h1>
      <p className="mb-6 text-sm text-gray-500">
        Masukkan email terdaftar kamu, kami akan mengirimkan tautan reset.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Surel"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-5 py-3 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Kirim Tautan Atur Ulang
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Ingat kata sandi?{" "}
        <Link href="/auth" className="font-semibold text-secondary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
