import { Suspense } from "react";
import ResetPasswordForm from "@/features/auth/reset-password/ResetPasswordForm";

export const metadata = {
  title: "Atur Ulang Kata Sandi",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Memuat...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
