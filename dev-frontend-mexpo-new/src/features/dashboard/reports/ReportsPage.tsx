"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Download,
  Loader2,
  TrendingUp,
  Wallet,
  Users,
  ShoppingBag,
  Package,
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
  getTopProductsReport,
  downloadReportExport,
  BoothReportRow,
  CategoryReportRow,
  AmountReportRow,
  AmountCategoryRow,
  TopProductReportRow,
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
  const { data: topProductRows } = useApiQuery<TopProductReportRow[]>(
    [...rangeKey, "top-products"],
    () => getTopProductsReport(event.uuid, from ?? undefined, to ?? undefined),
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
  const topProductList = topProductRows ?? [];

  // Top 10 rankings for charts and summary highlights
  const top10BoothList = useMemo(
    () => [...boothList].sort((a, b) => b.counts - a.counts).slice(0, 10),
    [boothList],
  );
  const bestBooth = top10BoothList[0] ?? null;

  const top10AmountList = useMemo(
    () => [...amountList].sort((a, b) => b.amount - a.amount).slice(0, 10),
    [amountList],
  );
  const bestAmountTenant = top10AmountList[0] ?? null;

  const top10ProductList = useMemo(
    () =>
      [...topProductList]
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 10),
    [topProductList],
  );
  const bestProduct = top10ProductList[0] ?? null;

  const totalProductQty = topProductList.reduce(
    (s, r) => s + (r.total_qty || 0),
    0,
  );
  const totalProductRevenue = topProductList.reduce(
    (s, r) => s + (r.total_revenue || 0),
    0,
  );

  // Client-side tables: paginated + sortable + searchable for each section
  const boothTable = useClientList<BoothReportRow>({
    items: boothList,
    getSearch: (r) => `${r.name} ${r.booth_number}`,
    getSortValue: (r, field) => (field === "counts" ? r.counts : r.name),
  });

  const amountTable = useClientList<AmountReportRow>({
    items: amountList,
    getSearch: (r) => `${r.name} ${r.booth_number}`,
    getSortValue: (r, field) => {
      if (field === "amount") return r.amount;
      if (field === "count_transaction") return r.count_transaction;
      return r.name;
    },
  });

  const topProductTable = useClientList<TopProductReportRow>({
    items: topProductList,
    getSearch: (r) => `${r.name} ${r.tenant_name} ${r.booth_number}`,
    getSortValue: (r, field) => {
      if (field === "total_qty") return r.total_qty;
      if (field === "total_revenue") return r.total_revenue;
      if (field === "total_transactions") return r.total_transactions;
      if (field === "price") return r.price;
      return r.name;
    },
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
          {/* Section 1 — Attendance */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Users className="h-5 w-5 text-secondary" /> Kehadiran
            </h2>

            {/* Total attendance cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Penyewa Terpopuler (#1)</p>
                <p
                  className="mt-1 text-lg font-semibold text-gray-900 truncate"
                  title={bestBooth?.name || "-"}
                >
                  {bestBooth ? bestBooth.name : "-"}
                </p>
                {bestBooth && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    Booth {bestBooth.booth_number || "-"} ({bestBooth.counts.toLocaleString("id-ID")} pengunjung)
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Kehadiran</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {totalVisitors.toLocaleString("id-ID")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Total kunjungan booth</p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Penyewa &amp; Kategori</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {boothList.length}{" "}
                  <span className="text-xs font-normal text-gray-500">penyewa</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {categoryList.length} kategori terdata
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Bar: attendance by tenant (Top 10) */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700">Grafik 10 Penyewa Terpopuler (Kunjungan)</p>
                  <p className="text-xs text-gray-400">Berdasarkan total pengunjung di booth</p>
                </div>
                {top10BoothList.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Belum ada data kunjungan booth.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={top10BoothList}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(v, name) => [
                          `${Number(v ?? 0).toLocaleString("id-ID")} pengunjung`,
                          name,
                        ]}
                      />
                      <Bar dataKey="counts" name="Pengunjung" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Pie: attendance by category */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700">Kehadiran per Kategori Penyewa</p>
                  <p className="text-xs text-gray-400">Distribusi kunjungan berdasarkan kategori</p>
                </div>
                {categoryList.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Belum ada data kategori.
                  </div>
                ) : (
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
                      <Tooltip formatter={(v, name) => [`${Number(v ?? 0).toLocaleString("id-ID")} pengunjung`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {boothTable.total} penyewa terdata
                </span>
                <SortMenu
                  options={[
                    { key: "counts", label: "Jumlah Pengunjung" },
                    { key: "name", label: "Nama Penyewa" },
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
                      <th className="px-5 py-2.5 text-center w-12">#</th>
                      <th className="px-5 py-2.5">Penyewa</th>
                      <th className="px-5 py-2.5">Booth</th>
                      <th className="px-5 py-2.5 text-right">Pengunjung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {boothTable.paged.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-6 text-center text-gray-500">
                          Belum ada data kunjungan booth.
                        </td>
                      </tr>
                    ) : (
                      boothTable.paged.map((r, idx) => {
                        const rankNumber =
                          (boothTable.page - 1) * boothTable.itemsPerPage + idx + 1;
                        return (
                          <tr key={r.uuid} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                  1
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                                  2
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                                  3
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">
                                  {rankNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                            <td className="px-5 py-3 text-gray-500">{r.booth_number || "-"}</td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">
                              {r.counts.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {boothTable.total > 0 && (
                <DataPagination
                  currentPage={boothTable.page}
                  totalPages={boothTable.totalPages}
                  itemsPerPage={boothTable.itemsPerPage}
                  totalItems={boothTable.total}
                  onPageChange={boothTable.setPage}
                  onItemsPerPageChange={boothTable.setItemsPerPage}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              )}
            </div>
          </section>

          {/* â•â•â• Section 2 â€” Transaction â•â•â• */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <TrendingUp className="h-5 w-5 text-green-600" /> Transaksi &amp; Performa Penjualan Penyewa
            </h2>

            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Penyewa Terlaris (#1)</p>
                <p
                  className="mt-1 text-lg font-semibold text-gray-900 truncate"
                  title={bestAmountTenant?.name || "-"}
                >
                  {bestAmountTenant ? bestAmountTenant.name : "-"}
                </p>
                {bestAmountTenant && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    Booth {bestAmountTenant.booth_number || "-"} (Rp {bestAmountTenant.amount.toLocaleString("id-ID")})
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Transaksi</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {totalTransactions.toLocaleString("id-ID")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {amountList.length} penyewa bertransaksi
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Nominal Transaksi</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">Akumulasi seluruh booth</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Bar: amount by tenant (Top 10) */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700">Grafik 10 Penyewa dengan Transaksi Tertinggi</p>
                  <p className="text-xs text-gray-400">Berdasarkan total nominal transaksi (Rp)</p>
                </div>
                {top10AmountList.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Belum ada data transaksi.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={top10AmountList}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
                      <Tooltip formatter={(v) => `Rp ${Number(v ?? 0).toLocaleString("id-ID")}`} />
                      <Bar dataKey="amount" name="Nominal" fill={CHART_SUCCESS} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Pie: amount by category */}
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-gray-700">Transaksi per Kategori Penyewa</p>
                  <p className="text-xs text-gray-400">Distribusi nominal berdasarkan kategori</p>
                </div>
                {amountCategoryList.length === 0 ? (
                  <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                    Belum ada data kategori.
                  </div>
                ) : (
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
                )}
              </div>
            </div>

            {/* Table */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {amountTable.total} penyewa bertransaksi
                </span>
                <SortMenu
                  options={[
                    { key: "amount", label: "Total Nominal (Rp)" },
                    { key: "count_transaction", label: "Jumlah Transaksi" },
                    { key: "name", label: "Nama Penyewa" },
                  ]}
                  sortBy={amountTable.sortBy}
                  sortDir={amountTable.sortDir}
                  onChange={amountTable.applySort}
                  defaultLabel="Urutkan"
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400">
                      <th className="px-5 py-2.5 text-center w-12">#</th>
                      <th className="px-5 py-2.5">Penyewa</th>
                      <th className="px-5 py-2.5">Booth</th>
                      <th className="px-5 py-2.5 text-right">Transaksi</th>
                      <th className="px-5 py-2.5 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {amountTable.paged.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-6 text-center text-gray-500">
                          Belum ada transaksi.
                        </td>
                      </tr>
                    ) : (
                      amountTable.paged.map((r, idx) => {
                        const rankNumber =
                          (amountTable.page - 1) * amountTable.itemsPerPage + idx + 1;
                        return (
                          <tr key={r.uuid} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-5 py-3 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                  1
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                                  2
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                                  3
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">
                                  {rankNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 font-medium text-gray-800">{r.name}</td>
                            <td className="px-5 py-3 text-gray-500">{r.booth_number || "-"}</td>
                            <td className="px-5 py-3 text-right text-gray-700">
                              {r.count_transaction.toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">
                              Rp {r.amount.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {amountTable.total > 0 && (
                <DataPagination
                  currentPage={amountTable.page}
                  totalPages={amountTable.totalPages}
                  itemsPerPage={amountTable.itemsPerPage}
                  totalItems={amountTable.total}
                  onPageChange={amountTable.setPage}
                  onItemsPerPageChange={amountTable.setItemsPerPage}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              )}
            </div>
          </section>

          {/* ═════ Section 3 — Top Products ═════ */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <ShoppingBag className="h-5 w-5 text-indigo-600" /> Produk Terlaris &amp; Penjualan Produk
            </h2>

            {/* 3 Metric Cards */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Produk Terlaris (#1)</p>
                <p
                  className="mt-1 text-lg font-semibold text-gray-900 truncate"
                  title={bestProduct?.name || "-"}
                >
                  {bestProduct ? bestProduct.name : "-"}
                </p>
                {bestProduct && (
                  <p className="mt-0.5 text-xs text-gray-500 truncate">
                    {bestProduct.tenant_name} ({bestProduct.total_qty.toLocaleString("id-ID")} terjual)
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Kuantitas Terjual</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {totalProductQty.toLocaleString("id-ID")}{" "}
                  <span className="text-xs font-normal text-gray-500">unit</span>
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Dari {topProductList.length} variasi produk
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-xs text-gray-500">Total Omzet Penjualan Produk</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  Rp {totalProductRevenue.toLocaleString("id-ID")}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  Akumulasi seluruh transaksi produk
                </p>
              </div>
            </div>

            {/* Top Products Bar Chart */}
            <div className="mb-4 rounded-xl border border-gray-100 bg-white p-5">
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700">Grafik 10 Produk Terlaris (Kuantitas)</p>
                <p className="text-xs text-gray-400">Berdasarkan total unit produk yang terjual</p>
              </div>
              {top10ProductList.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                  Belum ada data penjualan produk.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={top10ProductList}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(v, name) => [
                        name === "Kuantitas Terjual"
                          ? `${Number(v ?? 0).toLocaleString("id-ID")} unit`
                          : v,
                        name,
                      ]}
                    />
                    <Bar
                      dataKey="total_qty"
                      name="Kuantitas Terjual"
                      fill="#6366F1"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top Products Table */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {topProductTable.total} produk terdata
                </span>
                <SortMenu
                  options={[
                    { key: "total_qty", label: "Jumlah Terjual (Qty)" },
                    { key: "total_revenue", label: "Total Omzet (Rp)" },
                    { key: "total_transactions", label: "Jumlah Transaksi" },
                    { key: "price", label: "Harga Satuan" },
                    { key: "name", label: "Nama Produk" },
                  ]}
                  sortBy={topProductTable.sortBy}
                  sortDir={topProductTable.sortDir}
                  onChange={topProductTable.applySort}
                  defaultLabel="Urutkan"
                />
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400">
                      <th className="px-5 py-2.5 text-center w-12">#</th>
                      <th className="px-5 py-2.5">Produk</th>
                      <th className="px-5 py-2.5">Penyewa &amp; Booth</th>
                      <th className="px-5 py-2.5 text-right">Harga Satuan</th>
                      <th className="px-5 py-2.5 text-right">Jumlah Terjual</th>
                      <th className="px-5 py-2.5 text-right">Transaksi</th>
                      <th className="px-5 py-2.5 text-right">Total Omzet (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProductTable.paged.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-6 text-center text-gray-500">
                          Belum ada data penjualan produk.
                        </td>
                      </tr>
                    ) : (
                      topProductTable.paged.map((r, idx) => {
                        const rankNumber =
                          (topProductTable.page - 1) *
                            topProductTable.itemsPerPage +
                          idx +
                          1;
                        return (
                          <tr
                            key={r.uuid}
                            className="hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-5 py-3 text-center">
                              {rankNumber === 1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                                  1
                                </span>
                              ) : rankNumber === 2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                                  2
                                </span>
                              ) : rankNumber === 3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                                  3
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">
                                  {rankNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                {r.photo ? (
                                  <img
                                    src={r.photo}
                                    alt={r.name}
                                    className="h-10 w-10 shrink-0 rounded-lg object-cover border border-gray-100"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                    <Package className="h-5 w-5" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-800">{r.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-gray-600">
                              <p className="font-medium text-gray-700">{r.tenant_name}</p>
                              <p className="text-xs text-gray-400">
                                Booth {r.booth_number || "-"}
                              </p>
                            </td>
                            <td className="px-5 py-3 text-right text-gray-600">
                              Rp {r.price.toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-indigo-600">
                              {r.total_qty.toLocaleString("id-ID")}
                            </td>
                            <td className="px-5 py-3 text-right text-gray-700">
                              {r.total_transactions}
                            </td>
                            <td className="px-5 py-3 text-right font-semibold text-gray-900">
                              Rp {r.total_revenue.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {topProductTable.total > 0 && (
                <DataPagination
                  currentPage={topProductTable.page}
                  totalPages={topProductTable.totalPages}
                  itemsPerPage={topProductTable.itemsPerPage}
                  totalItems={topProductTable.total}
                  onPageChange={topProductTable.setPage}
                  onItemsPerPageChange={topProductTable.setItemsPerPage}
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              )}
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

