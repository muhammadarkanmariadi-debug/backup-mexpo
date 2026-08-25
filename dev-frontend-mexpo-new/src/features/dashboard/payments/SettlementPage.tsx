"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Event } from "@/entities/event/event.entity";
import { SettlementSummary } from "@/entities/payment/payment.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getSettlementSummary, settleEvent } from "@/services/payment.service";
import PageShell from "@/shared/components/ui/PageShell";
import { useAuthStore } from "@/stores/auth.store";
import { formatPrice } from "@/shared/utils/format";
import { SettlementSummaryStats } from "./components/SettlementSummaryStats";
import { SettlementForm } from "./components/SettlementForm";

export default function SettlementPage({ event }: { event: Event }) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const queryClient = useQueryClient();
  const summaryKey = keys.payments.summary(event.uuid);

  const { data: summary, isLoading: loadingSummary } = useApiQuery<
    SettlementSummary | null
  >(summaryKey, () => getSettlementSummary(event.uuid), { retry: 0 });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: summaryKey });
  };

  const handleSettle = async (amount: number, note: string, proof: File | null) => {
    if (!summary) return;
    if (!Number.isFinite(amount) || amount !== summary.net) {
      toast.error(`Jumlah harus sama persis dengan dana bersih (${formatPrice(summary.net)})`);
      return;
    }
    if (!window.confirm("Konfirmasi transfer manual ke rekening organizer?")) {
      return;
    }
    
    try {
      const res = await settleEvent(
        event.uuid,
        { amount_transferred: amount, note: note || undefined },
        proof,
      );
      if (!res.status) throw new Error(res.message ?? "Gagal mencatat settlement");
      toast.success("Settlement tercatat");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mencatat settlement");
    }
  };

  if (!isSuperAdmin) {
    return (
      <PageShell className="py-10">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Wallet className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
          <p className="text-gray-500 mt-2">Hanya Superadmin yang dapat mengakses halaman pencairan dana.</p>
          <Link href={`/dashboard/${event.slug ?? event.uuid}`} className="mt-6 inline-flex items-center gap-2 text-brand-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/settlements" className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Settlement Pembayaran</h1>
          <p className="text-sm text-gray-500">Event: {event.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SettlementSummaryStats summary={summary ?? null} loading={loadingSummary} />
        <SettlementForm summary={summary ?? null} loading={loadingSummary} onSettle={handleSettle} />
      </div>
    </PageShell>
  );
}
