"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  TrendingUp,
  Wallet,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { Event } from "@/entities/event/event.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import SortMenu from "@/shared/components/ui/SortMenu";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useClientList } from "@/shared/hooks/useClientList";
import { CHART_COLORS, CHART_PRIMARY, CHART_SUCCESS } from "@/shared/data/chart-colors";
import {
  getBoothReport,
  getCategoryReport,
  getAmountBoothReport,
  getAmountCategoryReport,
  getVisitorReport,
  getAmountReport,
  downloadReportExport,
  BoothReportRow,
  CategoryReportRow,
  AmountReportRow,
  AmountCategoryRow,
} from "@/services/report.service";

const PIE_COLORS = CHART_COLORS;

function toInputValue(d?: Date): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ReportsPage({ event }: { event: Event }) {
  const [from, setFrom] = useState<Date | null>(null);
  const [to, setTo] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  // Date range is part of the query key â€” changing the filters refetches
  // every report automatically (no manual load()/useEffect).
  const rangeKey = keys.reports.range(
    event.uuid,
    from?.toISOString(),
    to?.toISOString(),
  );

  const { data: boothRows, isLoading: loading } = useApiQuery<BoothReportRow[]>(
    [...rangeKey, "booth"],
    () => getBoothReport(event.uuid, from ?? undefined, to ?? undefined),
  );
  const { data: categoryRows } = useApiQuery<CategoryReportRow[]>(
    [...rangeKey, "category"],
    () => getCategoryReport(event.uuid, from ?? undefined, to ?? undefined),
  );
  const { data: amountRows } = useApiQuery<AmountReportRow[]>(
    [...rangeKey, "amount"],
    () => getAmountBoothReport(event.uuid, from ?? undefined, to ?? undefined),
  );
  const { data: amountCategoryRows } = useApiQuery<AmountCategoryRow[]>(
    [...rangeKey, "amount-category"],
    () => getAmountCategoryReport(event.uuid, from ?? undefined, to ?? undefined),
  );
  const { data: visitorData } = useApiQuery<unknown>(
    [...rangeKey, "visitor"],
    () => getVisitorReport(event.uuid, from ?? undefined, to ?? undefined),
  );
  const { data: amountData } = useApiQuery<unknown>(
    [...rangeKey, "amount-total"],
    () => getAmountReport(event.uuid, from ?? undefined, to ?? undefined),
  );

  const totalVisitors =
    (visitorData as { counts?: number } | null | undefined)?.counts ?? 0;
  const totalAmount =
    (amountData as { amounts?: number } | null | undefined)?.amounts ?? 0;

  const totalTransactions = (amountRows ?? []).reduce(
    (s, r) => s + (r.count_transaction || 0),
    0,
  );

  // Normalize possibly-undefined query results for the JSX below.
  const boothList = boothRows ?? [];
  const categoryList = categoryRows ?? [];
  const amountList = amountRows ?? [];
  const amountCategoryList = amountCategoryRows ?? [];

  // The tenant table is paginated + sortable client-side (charts keep the full set).
  const boothTable = useClientList<BoothReportRow>({
    items: boothList,
    getSearch: (r) => r.name,
    getSortValue: (r, field) => (field === "counts" ? r.counts : r.name),
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadReportExport(event.uuid, from ?? undefined, to ?? undefined);
      toast.success("Laporan Excel diunduh.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh laporan.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Laporan"
        subtitle={event.name}
        action={
          <Button
            type="button"
            size="xs"
            variant="success"
            disabled={exporting || loading}
            onClick={() => void handleExport()}
            startIcon={
              exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )
            }
          >
            Unduh Excel
          </Button>
        }
      />

      {/* Date range filter */}
      <div className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Dari</label>
          <input
            type="date"
            value={toInputValue(from ?? undefined)}
            onChange={(e) => setFrom(e.target.value ? new Date(e.target.value) : null)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Sampai</label>
          <input
            type="date"
            value={toInputValue(to ?? undefined)}
            onChange={(e) => setTo(e.target.value ? new Date(e.target.value) : null)}
            className="h-10 rounded-lg border border-gray-300 px-3 text-sm"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => {
              setFrom(null);
              setTo(null);
            }}
            className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            Atur Ulang
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {loading ? "Memuat..." : "Filter berlaku untuk seluruh bagian"}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : (
        <div className="space-y-10">
          {/* â•â•â• Section 1 â€” Attendance â•â•â• */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Users className="h-5 w-5 text-secondary" /> Kehadiran
            </h2>

            {/* Total attendance */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Kehadiran</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{totalVisitors}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Penyewa dengan kunjungan</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{boothList.length}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Kategori penyewa</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{categoryList.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Bar: attendance by tenant */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-gray-700">Kehadiran per Penyewa</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={boothList}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="counts" name="Pengunjung" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Pie: attendance by category */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-gray-700">Kehadiran per Kategori Penyewa</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryList}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(e) => e.name}
                    >
                      {categoryList.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {boothTable.total} penyewa
                </span>
                <SortMenu
                  options={[
                    { key: "name", label: "Penyewa" },
                    { key: "counts", label: "Pengunjung" },
                  ]}
                  sortBy={boothTable.sortBy}
                  sortDir={boothTable.sortDir}
                  onChange={boothTable.applySort}
                  defaultLabel="Urutkan"
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400">
                      <th className="px-5 py-2">Penyewa</th>
                      <th className="px-5 py-2">Booth</th>
                      <th className="px-5 py-2 text-right">Pengunjung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {boothTable.paged.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-6 text-center text-gray-500">
                          Belum ada data kunjungan booth.
                        </td>
                      </tr>
                    ) : (
                      boothTable.paged.map((r) => (
                        <tr key={r.uuid}>
                          <td className="px-5 py-2.5 font-medium text-gray-800">{r.name}</td>
                          <td className="px-5 py-2.5 text-gray-500">{r.booth_number || "-"}</td>
                          <td className="px-5 py-2.5 text-right font-semibold text-gray-900">{r.counts}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {boothTable.totalPages > 1 && (
                <DataPagination
                  currentPage={boothTable.page}
                  totalPages={boothTable.totalPages}
                  itemsPerPage={boothTable.itemsPerPage}
                  totalItems={boothTable.total}
                  onPageChange={boothTable.setPage}
                  onItemsPerPageChange={() => {}}
                  pageSizeOptions={[10]}
                />
              )}
            </div>
          </section>

          {/* â•â•â• Section 2 â€” Transaction â•â•â• */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-green-600" /> Transaksi
            </h2>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Transaksi</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{totalTransactions}</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Nominal (Rp)</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {totalAmount.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Penyewa bertransaksi</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{amountList.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Bar: amount by tenant */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-gray-700">Transaksi per Penyewa</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={amountList}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                    <Tooltip formatter={(v) => `Rp ${Number(v ?? 0).toLocaleString("id-ID")}`} />
                    <Bar dataKey="amount" name="Nominal" fill={CHART_SUCCESS} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Pie: amount by category */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="mb-3 text-sm font-semibold text-gray-700">Transaksi per Kategori Penyewa</p>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={amountCategoryList}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(e) => e.name}
                    >
                      {amountCategoryList.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `Rp ${Number(v ?? 0).toLocaleString("id-ID")}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-5 py-2">Penyewa</th>
                    <th className="px-5 py-2">Booth</th>
                    <th className="px-5 py-2 text-right">Transaksi</th>
                    <th className="px-5 py-2 text-right">Nominal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {amountList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                        Belum ada transaksi.
                      </td>
                    </tr>
                  ) : (
                    amountList.map((r) => (
                      <tr key={r.uuid}>
                        <td className="px-5 py-2.5 font-medium text-gray-800">{r.name}</td>
                        <td className="px-5 py-2.5 text-gray-500">{r.booth_number || "-"}</td>
                        <td className="px-5 py-2.5 text-right text-gray-700">{r.count_transaction}</td>
                        <td className="px-5 py-2.5 text-right font-semibold text-gray-900">
                          {r.amount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Wallet summary */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
            <Wallet className="h-4 w-4 text-green-600" />
            Total penjualan keseluruhan:{" "}
            <strong className="text-gray-900">Rp {totalAmount.toLocaleString("id-ID")}</strong>
          </div>
        </div>
      )}
    </PageShell>
  );
}

