"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import PageShell from "@/shared/components/ui/PageShell";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [targetSlug] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mexpo_payment_redirect");
    }
    return null;
  });

  useEffect(() => {
    if (countdown <= 0) {
      router.push(targetSlug || "/dashboard");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router, targetSlug]);

  return (
    <PageShell className="py-20 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-md w-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
        <p className="text-gray-500 text-sm mb-8">
          Terima kasih, pembayaran tiket kamu telah berhasil dikonfirmasi. Kamu akan diarahkan ke dashboard event dalam <strong>{countdown} detik</strong>.
        </p>
        
        <Link 
          href={targetSlug || "/dashboard"}
          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 px-6 py-3 rounded-xl font-semibold text-white transition-colors"
        >
          Ke Dashboard Sekarang
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </PageShell>
  );
}
