"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Gift,
  ImagePlus,
  Loader2,
  Package,
  Pencil,
  Plus,
  QrCode,
  Settings2,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import Input from "@/shared/components/form/Input";
import FormattedNumberInput from "@/shared/components/form/FormattedNumberInput";
import CurrencyInput from "@/shared/components/form/CurrencyInput";
import { Modal } from "@/shared/components/ui/Modal";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import { useResolveQr } from "@/lib/hooks/useResolveQr";
import { useApiMutation } from "@/lib/hooks/useApi";
import { Event, SouvenirRules, SouvenirTier } from "@/entities/event/event.entity";
import { ResolvedQr } from "@/services/qr.service";
import {
  checkSouvenir,
  collectSouvenir,
  grantSouvenir,
  listSouvenirs,
  normalizeVoucherCode,
  resolveSouvenirVoucher,
  updateSouvenirRules,
  uploadSouvenirImage,
  SouvenirCheckResult,
  SouvenirRecord,
  SouvenirVoucher,
} from "@/services/souvenir.service";
import { normalizeCatalog } from "./SouvenirCatalogEditor";

export default function SouvenirCounterPage({ event }: { event: Event }) {
  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"CATALOG" | "COUNTER">("CATALOG");

  // State for Souvenir Rules & Catalog Items
  const initialRules = event.souvenir_rules ?? {};
  const [rules, setRules] = useState<SouvenirRules>(initialRules);
  const [tiers, setTiers] = useState<SouvenirTier[]>(initialRules.tiers ?? []);

  // Settings State for Points
  const [boothOn, setBoothOn] = useState(initialRules.boothVisitPoint?.enabled ?? true);
  const [boothPts, setBoothPts] = useState(initialRules.boothVisitPoint?.pointsPerVisit ?? 10);
  const [semOn, setSemOn] = useState(initialRules.seminarPoint?.enabled ?? true);
  const [semPts, setSemPts] = useState(initialRules.seminarPoint?.pointsPerSeminar ?? 25);
  const [txOn, setTxOn] = useState(initialRules.transactionPoint?.enabled ?? false);
  const [txPts, setTxPts] = useState(initialRules.transactionPoint?.pointsPerTransaction ?? 0);
  const [txStep, setTxStep] = useState(initialRules.transactionPoint?.amountStep ?? 50000);
  const [txStepPts, setTxStepPts] = useState(initialRules.transactionPoint?.pointsPerAmountStep ?? 10);
  const [savingRules, setSavingRules] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  // Modals state
  const [selectedDetailItem, setSelectedDetailItem] = useState<SouvenirTier | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SouvenirTier | null>(null);

  // Form modal field state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    minPoints: number;
    hasStockLimit: boolean;
    stock: number;
    image?: string;
  }>({
    name: "",
    description: "",
    minPoints: 0,
    hasStockLimit: false,
    stock: 0,
    image: undefined,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const { confirm, dialogs } = useConfirm();

  // History state for Counter tab
  const [history, setHistory] = useState<SouvenirRecord[]>([]);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    let active = true;
    listSouvenirs(event.uuid)
      .then((res) => {
        if (active && res.status) setHistory(res.data);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
  }, [event.uuid, historyKey]);

  // QR Counter scan & check state
  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [checkResult, setCheckResult] = useState<SouvenirCheckResult | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [voucher, setVoucher] = useState<SouvenirVoucher | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

  // -------------------------------------------------------------
  // Souvenir Point Settings Save Handler
  // -------------------------------------------------------------
  const handleSavePointRules = async () => {
    setSavingRules(true);
    try {
      const updatedRules: SouvenirRules = {
        ...rules,
        usePointSystem: true,
        boothVisitPoint: { enabled: boothOn, pointsPerVisit: Number(boothPts) || 0 },
        seminarPoint: { enabled: semOn, pointsPerSeminar: Number(semPts) || 0 },
        transactionPoint: {
          enabled: txOn,
          pointsPerTransaction: Number(txPts) || 0,
          amountStep: Number(txStep) || 0,
          pointsPerAmountStep: Number(txStepPts) || 0,
        },
        tiers: normalizeCatalog(tiers),
      };

      const res = await updateSouvenirRules(event.uuid, updatedRules);
      if (!res.status) throw new Error(res.message || "Gagal menyimpan pengaturan syarat");
      setRules(updatedRules);
      toast.success("Pengaturan syarat poin suvenir berhasil disimpan.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan");
    } finally {
      setSavingRules(false);
    }
  };

  // -------------------------------------------------------------
  // Souvenir Catalog Item Add / Edit / Delete Handlers
  // -------------------------------------------------------------
  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      minPoints: 10,
      hasStockLimit: false,
      stock: 0,
      image: undefined,
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: SouvenirTier) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description ?? "",
      minPoints: item.minPoints ?? 0,
      hasStockLimit: item.stock !== null && item.stock !== undefined,
      stock: item.stock ?? 0,
      image: item.image,
    });
    setSelectedDetailItem(null);
    setIsFormModalOpen(true);
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadSouvenirImage(event.uuid, file);
      setFormData((prev) => ({ ...prev, image: url }));
      toast.success("Foto suvenir berhasil diunggah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama suvenir wajib diisi");
      return;
    }

    setSavingItem(true);
    try {
      const itemPayload: SouvenirTier = {
        id: editingItem ? editingItem.id : crypto.randomUUID(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        minPoints: Math.max(0, Number(formData.minPoints) || 0),
        image: formData.image || undefined,
        stock: formData.hasStockLimit ? Math.max(0, Math.trunc(Number(formData.stock) || 0)) : null,
      };

      let newTiers: SouvenirTier[];
      if (editingItem) {
        newTiers = tiers.map((t) => (t.id === editingItem.id ? itemPayload : t));
      } else {
        newTiers = [...tiers, itemPayload];
      }

      const updatedRules: SouvenirRules = {
        ...rules,
        usePointSystem: true,
        tiers: normalizeCatalog(newTiers),
      };

      const res = await updateSouvenirRules(event.uuid, updatedRules);
      if (!res.status) throw new Error(res.message || "Gagal menyimpan suvenir");

      setTiers(newTiers);
      setRules(updatedRules);
      toast.success(editingItem ? "Suvenir berhasil diperbarui" : "Suvenir berhasil ditambahkan ke katalog");
      setIsFormModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan item");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!(await confirm(`Hapus "${itemName}" dari katalog suvenir?`))) return;
    try {
      const newTiers = tiers.filter((t) => t.id !== itemId);
      const updatedRules: SouvenirRules = {
        ...rules,
        usePointSystem: true,
        tiers: normalizeCatalog(newTiers),
      };

      const res = await updateSouvenirRules(event.uuid, updatedRules);
      if (!res.status) throw new Error(res.message || "Gagal menghapus suvenir");

      setTiers(newTiers);
      setRules(updatedRules);
      if (selectedDetailItem?.id === itemId) setSelectedDetailItem(null);
      toast.success("Suvenir berhasil dihapus");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus item");
    }
  };

  // -------------------------------------------------------------
  // Scan & Voucher Mutations for Counter Tab
  // -------------------------------------------------------------
  const resolveVoucher = useApiMutation<SouvenirVoucher, string>(
    (code) => resolveSouvenirVoucher(event.uuid, code),
    {
      onSuccess: (data) => {
        setVoucher(data);
        setResolved({ event_id: event.uuid, user_id: data.user.uuid, user: data.user });
      },
      onError: (err) => {
        setVoucher(null);
        setResolved(null);
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Voucher tidak ditemukan",
        });
      },
    },
  );

  const collect = useApiMutation<unknown, string>(
    (code) => collectSouvenir(event.uuid, code),
    {
      onSuccess: (res, code) => {
        const message =
          res && typeof res === "object" && "message" in res && res.message
            ? String((res as { message: unknown }).message)
            : "Souvenir diserahkan.";
        toast.success(message);
        setResult({ ok: true, message });
        setHistoryKey((k) => k + 1);
        if (voucher) resolveVoucher.mutate(code);
        else if (resolved) check.mutate({ eventId: event.uuid, userId: resolved.user_id });
      },
      onError: (err) => {
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal menyerahkan souvenir",
        });
        if (voucher) resolveVoucher.mutate(voucher.code);
      },
    },
  );

  const check = useApiMutation<SouvenirCheckResult, { eventId: string; userId: string }>(
    ({ eventId, userId }) => checkSouvenir(eventId, userId),
    {
      onSuccess: (data) => {
        setCheckResult(data);
      },
      onError: (err) => {
        setCheckResult(null);
        setResolved(null);
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal mengecek syarat",
        });
      },
    },
  );

  const resolve = useResolveQr({
    onSuccess: (data) => {
      setResolved(data);
      setCheckResult(null);
      check.mutate({ eventId: event.uuid, userId: data.user_id });
    },
    onError: (err) => {
      setResolved(null);
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "QR tidak dikenali",
      });
    },
  });

  const grant = useApiMutation(
    () =>
      grantSouvenir(
        event.uuid,
        checkResult?.user.uuid ?? "",
        selectedTierId ?? checkResult?.recommendedTier?.id,
      ),
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : "Souvenir diberikan.";
        toast.success(message);
        setResult({ ok: true, message });
        setSelectedTierId(null);
        setHistoryKey((k) => k + 1);
        if (resolved) {
          check.mutate({ eventId: event.uuid, userId: resolved.user_id });
          return;
        }
        setCheckResult(null);
        setResolved(null);
        setQrCode("");
      },
      onError: (err) => {
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal memberikan souvenir",
        });
      },
    },
  );

  const handleSearch = (code?: string) => {
    const value = (code ?? qrCode).trim();
    if (!value) {
      setResult({
        ok: false,
        message: "Masukkan atau scan QR code pengunjung.",
      });
      return;
    }
    setResult(null);
    setResolved(null);
    setCheckResult(null);
    setVoucher(null);
    const voucherCode = normalizeVoucherCode(value);
    if (voucherCode) resolveVoucher.mutate(voucherCode);
    else resolve.mutate(value);
  };

  const onGrant = () => {
    if (!checkResult) return;
    setResult(null);
    grant.mutate();
  };

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Syarat &amp; Katalog Souvenir"
        subtitle={event.name}
      />

      {/* ── Sub Navigation Tabs ── */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveSubTab("CATALOG")}
            className={`inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-semibold transition-colors cursor-pointer ${
              activeSubTab === "CATALOG"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Katalog &amp; Syarat Suvenir</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 font-bold">
              {tiers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("COUNTER")}
            className={`inline-flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-semibold transition-colors cursor-pointer ${
              activeSubTab === "COUNTER"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Meja Penukaran (Scan QR)</span>
            {history.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 font-bold">
                {history.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 1: KATALOG & SYARAT SUVENIR                         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === "CATALOG" && (
        <div className="space-y-6">

          {/* Card: Pengaturan Syarat Perolehan Poin */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                  <Settings2 className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                    Pengaturan Syarat Perolehan Poin
                  </h3>
                  <p className="text-xs text-gray-500">
                    Aturan pengumpulan poin dari aktivitas pengunjung untuk ditukarkan dengan suvenir.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesExpanded((prev) => !prev)}
                className="text-xs font-semibold text-secondary hover:text-secondary/80 cursor-pointer self-start sm:self-auto"
              >
                {isRulesExpanded ? "Sembunyikan Pengaturan ▲" : "Ubah Syarat Poin ▼"}
              </button>
            </div>

            {/* Point Rules Summary Pills when Collapsed */}
            {!isRulesExpanded && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  Booth: {boothOn ? `Aktif (${boothPts} Poin)` : "Nonaktif"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  Seminar: {semOn ? `Aktif (${semPts} Poin)` : "Nonaktif"}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                  Transaksi: {txOn ? `Aktif (${txPts} Poin / Transaksi)` : "Nonaktif"}
                </span>
              </div>
            )}

            {/* Point Rules Form when Expanded */}
            {isRulesExpanded && (
              <div className="mt-4 space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Booth Visits */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={boothOn}
                        onChange={(e) => setBoothOn(e.target.checked)}
                        className="w-4 h-4 accent-secondary rounded"
                      />
                      Kunjungan Booth
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Poin otomatis ditambahkan saat pengunjung check-in di booth tenant.
                    </p>
                    {boothOn && (
                      <FormattedNumberInput
                        label="Poin per Kunjungan"
                        value={boothPts}
                        onChange={(v) => setBoothPts(Number(v))}
                        suffix="Poin"
                        placeholder="10"
                      />
                    )}
                  </div>

                  {/* Seminar / Workshop */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={semOn}
                        onChange={(e) => setSemOn(e.target.checked)}
                        className="w-4 h-4 accent-secondary rounded"
                      />
                      Seminar &amp; Workshop
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Poin diberikan setelah pengunjung menghadiri sesi lokakarya/seminar.
                    </p>
                    {semOn && (
                      <FormattedNumberInput
                        label="Poin per Sesi"
                        value={semPts}
                        onChange={(v) => setSemPts(Number(v))}
                        suffix="Poin"
                        placeholder="25"
                      />
                    )}
                  </div>

                  {/* Transaction Points */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={txOn}
                        onChange={(e) => setTxOn(e.target.checked)}
                        className="w-4 h-4 accent-secondary rounded"
                      />
                      Transaksi Pembelian
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Poin berdasarkan transaksi pembelanjaan produk di tenant expo.
                    </p>
                    {txOn && (
                      <div className="space-y-2">
                        <FormattedNumberInput
                          label="Poin per Transaksi"
                          value={txPts}
                          onChange={(v) => setTxPts(Number(v))}
                          suffix="Poin"
                          placeholder="0"
                        />
                        <CurrencyInput
                          label="Kelipatan Nominal"
                          value={txStep}
                          onChange={(v) => setTxStep(Number(v))}
                          placeholder="50000"
                          hint="0 = nonaktif"
                        />
                        <FormattedNumberInput
                          label="Poin per Kelipatan"
                          value={txStepPts}
                          onChange={(v) => setTxStepPts(Number(v))}
                          suffix="Poin"
                          placeholder="10"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingRules}
                    onClick={handleSavePointRules}
                    startIcon={savingRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  >
                    {savingRules ? "Menyimpan..." : "Simpan Syarat Poin"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Section: List Katalog Suvenir */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  Daftar Katalog Suvenir ({tiers.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Klik pada item suvenir untuk melihat detail lengkap atau gunakan tombol aksi untuk mengubah.
                </p>
              </div>

              <Button
                size="sm"
                onClick={openAddModal}
                startIcon={<Plus className="w-4 h-4" />}
              >
                Tambah Suvenir
              </Button>
            </div>

            {/* Empty State */}
            {tiers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/60 p-12 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 text-secondary flex items-center justify-center mb-3">
                  <Package className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base">Belum Ada Item Suvenir</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                  Tambahkan suvenir menarik seperti kaos, totebag, stiker, atau merchandise lainnya yang dapat ditukarkan pengunjung.
                </p>
                <Button size="sm" onClick={openAddModal} startIcon={<Plus className="w-4 h-4" />}>
                  Tambah Item Pertama
                </Button>
              </div>
            ) : (
              /* Grid List Katalog Suvenir */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {tiers.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedDetailItem(item)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-3.5 shadow-xs hover:border-secondary/50 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                  >
                    <div>
                      {/* Photo Thumbnail */}
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300 group-hover:text-secondary/60 transition-colors">
                            <Gift className="w-10 h-10" />
                          </div>
                        )}

                        {/* Point Badge */}
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                            {item.minPoints} Poin
                          </span>
                        </div>
                      </div>

                      {/* Stock Pill */}
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        {item.stock !== null && item.stock !== undefined ? (
                          item.stock === 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                              Stok Habis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Stok: {item.stock}
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            Stok Tak Terbatas
                          </span>
                        )}
                      </div>

                      {/* Item Name */}
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-secondary transition-colors">
                        {item.name}
                      </h4>

                      {/* Item Short Description */}
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {item.description || "Tidak ada deskripsi."}
                      </p>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-secondary group-hover:underline">
                        Lihat Detail →
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-secondary hover:bg-blue-50 transition-colors"
                          title="Ubah Suvenir"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Suvenir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SUB-TAB 2: MEJA PENUKARAN (SCAN QR & RIWAYAT)               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeSubTab === "COUNTER" && (
        <div className="space-y-6">
          <QrScanPanel
            containerId="souvenir-qr-reader"
            accent="brand"
            qrValue={qrCode}
            onQrChange={setQrCode}
            searching={resolve.isPending || check.isPending || resolveVoucher.isPending}
            onSearch={handleSearch}
            inputLabel="QR Pengunjung / QR Penukaran Souvenir"
            inputPlaceholder="Scan QR penukaran (SV-…), QR pengunjung, atau ketik email pengunjung"
            searchButtonLabel="Cari"
            resolved={resolved}
            result={result}
            renderUserDetails={() =>
              voucher ? (
                <div className="mt-3 rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400">
                      {voucher.item.image ? (
                        <Image src={voucher.item.image} alt={voucher.item.name} fill sizes="56px" className="object-cover" />
                      ) : (
                        <Package className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-gray-900">{voucher.item.name}</p>
                      <p className="text-xs text-gray-500">
                        {voucher.item.points} poin · ditukar {formatDateTime(voucher.redeemedAt)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">{voucher.code}</p>
                    </div>
                  </div>
                  {voucher.status === "COLLECTED" ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-success-50 p-3 text-sm text-success-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" /> Sudah diserahkan
                      {voucher.collectedAt ? ` pada ${formatDateTime(voucher.collectedAt)}` : ""}. QR ini tidak berlaku lagi.
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="success"
                      className="mt-3 w-full"
                      disabled={collect.isPending}
                      onClick={() => collect.mutate(voucher.code)}
                      startIcon={
                        collect.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Gift className="h-4 w-4" />
                        )
                      }
                    >
                      Serahkan Souvenir
                    </Button>
                  )}
                </div>
              ) : checkResult ? (
                <>
                  {checkResult.usePointSystem ? (
                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      <p className="text-sm font-bold text-gray-900">
                        Sisa Poin: {checkResult.availablePoints}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (Total {checkResult.totalPoints} − Terpakai {checkResult.spentPoints})
                        </span>
                      </p>
                      {checkResult.pointBreakdown.booth.enabled && (
                        <p>
                          Booth: {checkResult.pointBreakdown.booth.count} → +
                          {checkResult.pointBreakdown.booth.points} poin
                        </p>
                      )}
                      {checkResult.pointBreakdown.seminar.enabled && (
                        <p>
                          Seminar: {checkResult.pointBreakdown.seminar.count} → +
                          {checkResult.pointBreakdown.seminar.points} poin
                        </p>
                      )}
                      {checkResult.pointBreakdown.transaction.enabled && (
                        <p>
                          Transaksi: {checkResult.pointBreakdown.transaction.count}x (Rp{" "}
                          {checkResult.pointBreakdown.transaction.totalAmount.toLocaleString("id-ID")}) → +
                          {checkResult.pointBreakdown.transaction.points} poin
                        </p>
                      )}
                      {checkResult.tiers.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="font-semibold text-gray-700">Pilih Item dari Katalog</p>
                          {checkResult.tiers.map((tier) => {
                            const redeemable = tier.unlocked && !tier.soldOut;
                            const selected =
                              redeemable &&
                              (selectedTierId ?? checkResult.recommendedTier?.id) === tier.id;
                            return (
                              <button
                                key={tier.id}
                                type="button"
                                disabled={!redeemable || checkResult.alreadyClaimed}
                                onClick={() => setSelectedTierId(tier.id)}
                                className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left ${
                                  selected ? "border-success-500 bg-success-50" : "border-gray-200 bg-white"
                                } ${redeemable ? "cursor-pointer" : "opacity-50"}`}
                              >
                                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-gray-400">
                                  {tier.image ? (
                                    <Image src={tier.image} alt={tier.name} fill sizes="40px" className="object-cover" />
                                  ) : (
                                    <Package className="h-4 w-4" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-semibold text-gray-800">{tier.name}</span>
                                  <span className="block text-gray-500">
                                    {tier.minPoints} poin
                                    {tier.remaining != null ? ` · sisa ${tier.remaining}` : ""}
                                  </span>
                                </span>
                                <span className="shrink-0 font-semibold">
                                  {tier.soldOut
                                    ? "Stok habis"
                                    : tier.unlocked
                                      ? "Tersedia"
                                      : `Kurang ${tier.missingPoints} poin`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-gray-500">
                      Booth: {checkResult.boothVisits} · Seminar:{" "}
                      {checkResult.joinedSeminar ? "ya" : "belum"}
                    </p>
                  )}

                  {checkResult.alreadyClaimed ? (
                    checkResult.claimedSouvenir?.status === "READY" && checkResult.claimedSouvenir.code ? (
                      <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                        <p className="flex items-center gap-2 font-semibold">
                          <QrCode className="h-4 w-4 shrink-0" /> Souvenir sudah ditukar, menunggu diambil
                        </p>
                        <p className="mt-1 text-xs">
                          {checkResult.claimedSouvenir.souvenir_name} · ditukar {formatDateTime(checkResult.claimedSouvenir.claimed_at)}
                        </p>
                        <Button
                          type="button"
                          variant="success"
                          className="mt-3 w-full"
                          disabled={collect.isPending}
                          onClick={() => collect.mutate(checkResult.claimedSouvenir!.code!)}
                          startIcon={
                            collect.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Gift className="h-4 w-4" />
                            )
                          }
                        >
                          Serahkan Souvenir
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm text-brand-700">
                        <XCircle className="h-4 w-4 shrink-0" /> Souvenir sudah diserahkan
                        {checkResult.claimedSouvenir?.souvenir_name
                          ? ` (${checkResult.claimedSouvenir.souvenir_name}`
                          : ""}
                        {checkResult.claimedSouvenir
                          ? `, ${formatDateTime(checkResult.claimedSouvenir.collected_at ?? checkResult.claimedSouvenir.claimed_at)})`
                          : ""}
                        . Tidak bisa menukar lagi.
                      </div>
                    )
                  ) : checkResult.eligible ? (
                    <Button
                      type="button"
                      variant="success"
                      className="mt-3 w-full"
                      disabled={grant.isPending}
                      onClick={onGrant}
                      startIcon={
                        grant.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Gift className="h-4 w-4" />
                        )
                      }
                    >
                      Berikan Souvenir
                    </Button>
                  ) : (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {checkResult.usePointSystem
                          ? `${checkResult.reasons.join(", ") || "Poin kurang"}`
                          : `Belum memenuhi syarat: ${checkResult.reasons.join(", ")}`}
                      </span>
                    </div>
                  )}
                </>
              ) : null
            }
          />

          {/* Tabel Riwayat */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <h4 className="mb-3 text-sm font-bold text-gray-900">
              Riwayat Penerima Souvenir ({history.length})
            </h4>
            {history.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Belum ada penukaran souvenir di meja ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-500 bg-gray-50/70 border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Penerima</th>
                      <th className="py-2.5 px-3 font-semibold">Jenis Souvenir</th>
                      <th className="py-2.5 px-3 font-semibold">Poin Dipakai</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          {row.users?.full_name}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">{row.souvenir_name || "-"}</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-600">
                          {row.points_spent} Poin
                        </td>
                        <td className="py-2.5 px-3">
                          {row.collected_at ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Diserahkan
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              Menunggu diambil
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">
                          {new Date(row.created_at).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL 1: DETAIL SUVENIR                                    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedDetailItem && (
        <Modal
          isOpen={!!selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          title="Detail Suvenir"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Foto Besar */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
              {selectedDetailItem.image ? (
                <Image
                  src={selectedDetailItem.image}
                  alt={selectedDetailItem.name}
                  fill
                  sizes="500px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <Gift className="w-16 h-16" />
                </div>
              )}

              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-md">
                  ⭐ {selectedDetailItem.minPoints} Poin
                </span>
              </div>
            </div>

            {/* Nama & Status */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{selectedDetailItem.name}</h3>
                {selectedDetailItem.stock !== null && selectedDetailItem.stock !== undefined ? (
                  selectedDetailItem.stock === 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      Stok Habis
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Tersedia: {selectedDetailItem.stock} Unit
                    </span>
                  )
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    Stok Tak Terbatas
                  </span>
                )}
              </div>
            </div>

            {/* Deskripsi Lengkap */}
            <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Deskripsi Suvenir
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedDetailItem.description || "Tidak ada deskripsi detail untuk item ini."}
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailItem(null)}
              >
                Tutup
              </Button>
              <Button
                size="sm"
                onClick={() => openEditModal(selectedDetailItem)}
                startIcon={<Pencil className="w-4 h-4" />}
              >
                Ubah Suvenir
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL 2: FORM TAMBAH / UBAH SUVENIR                        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!savingItem) {
            setIsFormModalOpen(false);
            setEditingItem(null);
          }
        }}
        title={editingItem ? "Ubah Item Suvenir" : "Tambah Item Suvenir Baru"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {/* Unggah Foto */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Foto Suvenir (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-secondary hover:text-secondary transition-colors">
                {uploadingImage ? (
                  <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                ) : formData.image ? (
                  <Image
                    src={formData.image}
                    alt="Preview"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-center p-2">
                    <ImagePlus className="w-6 h-6 text-gray-400" />
                    <span className="text-[10px]">Upload</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={uploadingImage}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>

              {formData.image && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image: undefined }))}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Hapus Foto
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Format JPG, PNG, atau WebP (Maks. 4MB).</p>
          </div>

          {/* Nama Suvenir */}
          <Input
            label="Nama Suvenir"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Misal: Totebag Kanvas, Kaos Mexpo 2026, dll."
          />

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Deskripsi Suvenir
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan spesifikasi, bahan, atau rincian suvenir ini..."
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/20 transition-all"
            />
          </div>

          {/* Harga Poin */}
          <FormattedNumberInput
            label="Harga Poin Penukaran"
            value={formData.minPoints}
            onChange={(val) => setFormData({ ...formData, minPoints: Number(val) })}
            suffix="Poin"
            placeholder="10"
            hint="Jumlah poin yang diperlukan pengunjung untuk menukarkan suvenir ini."
          />

          {/* Pengaturan Stok */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasStockLimit}
                onChange={(e) =>
                  setFormData({ ...formData, hasStockLimit: e.target.checked })
                }
                className="w-4 h-4 accent-secondary rounded"
              />
              Batasi Jumlah Stok
            </label>

            {formData.hasStockLimit && (
              <FormattedNumberInput
                label="Jumlah Stok Tersedia"
                value={formData.stock}
                onChange={(val) => setFormData({ ...formData, stock: Number(val) })}
                suffix="Unit"
                placeholder="50"
              />
            )}
          </div>

          {/* Tombol Simpan Form */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={savingItem}
              onClick={() => {
                setIsFormModalOpen(false);
                setEditingItem(null);
              }}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={savingItem || uploadingImage}
              startIcon={savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            >
              {savingItem ? "Menyimpan..." : (editingItem ? "Simpan Perubahan" : "Tambah ke Katalog")}
            </Button>
          </div>
        </form>
      </Modal>

      {dialogs}
    </PageShell>
  );
}
