import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getBoothReport, downloadTenantExport, BoothReportRow } from "@/services/report.service";
import { getTransactions, Transaction } from "@/services/transaction.service";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";
import { CHART_PRIMARY } from "@/shared/data/chart-colors";

export function TenantReportsTab({ eventId, tenantId }: { eventId: string; tenantId: string }) {
  const [exporting, setExporting] = useState(false);

  const { data: boothData } = useApiQuery<BoothReportRow[]>(
    keys.reports.all(eventId),
    () => getBoothReport(eventId),
  );
  const { data: txns, isLoading: loading } = useApiQuery<Transaction[]>(
    keys.transactions.all(tenantId),
    () => getTransactions(tenantId),
  );

  const boothVisits =
    (boothData ?? []).find((r) => r.uuid === tenantId)?.counts ?? 0;

  const totalAmount = (txns ?? []).reduce((s, t) => s + t.amount, 0);
  const chartData = [...(txns ?? [])]
    .slice(0, 8)
    .reverse()
    .map((t) => ({
      date: new Date(t.transaction_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
      amount: t.amount,
    }));

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadTenantExport(eventId, tenantId);
      toast.success("Laporan Excel diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh laporan.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSpinner className="py-10" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Pengunjung Booth</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{boothVisits}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Transaksi</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{(txns ?? []).length}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5">
            <p className="text-xs text-gray-500">Total (Rp)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {totalAmount?.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 disabled:opacity-50 px-5 py-3 rounded-lg font-semibold text-white transition-colors"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Unduh Excel
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-700">Transaksi Terbaru</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip formatter={(v) => `Rp ${Number(v ?? 0)?.toLocaleString("id-ID")}`} />
              <Bar dataKey="amount" name="Nominal" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {(txns ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-gray-500">Belum ada transaksi.</p>
      )}
    </div>
  );
}
