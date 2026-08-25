import { SettlementSummary } from "@/entities/payment/payment.entity";
import { formatPrice } from "@/shared/utils/format";
import LoadingState from "@/shared/components/ui/LoadingState";

export function SettlementSummaryStats({ summary, loading }: { summary: SettlementSummary | null; loading: boolean }) {
  if (loading) return <LoadingState type="skeleton-card" count={2} />;

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Informasi Rekening Organizer</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Bank</span>
            <span className="font-medium text-gray-900">{summary?.payout.bank_name || "-"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">No. Rekening</span>
            <span className="font-mono text-gray-900">{summary?.payout.account_number || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Atas Nama</span>
            <span className="font-medium text-gray-900">{summary?.payout.account_holder || "-"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-brand-100 bg-brand-50 p-5">
        <p className="text-sm font-medium text-brand-600">Total Dana Bersih (Net)</p>
        <p className="mt-1 text-3xl font-bold text-brand-700">
          {formatPrice(summary?.net ?? 0)}
        </p>
        <p className="mt-1 text-xs text-brand-500">Dari {summary?.paid_transactions ?? 0} transaksi berhasil</p>
      </div>
    </section>
  );
}
