"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Gift,
  Loader2,
  Lock,
  Package,
  Sparkles,
  Store,
  BookOpen,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Event } from "@/entities/event/event.entity";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  EarnRule,
  getMySouvenir,
  MySouvenir,
  MySouvenirItem,
  PointLedgerEntry,
  redeemSouvenir,
} from "@/services/souvenir.service";
import LoadingState from "@/shared/components/ui/LoadingState";

/** Where each way of earning points happens, so a shortcut can jump there. */
const EARN_SHORTCUTS: Record<EarnRule["source"], { groupId: string; label: string; icon: typeof Store }> = {
  BOOTH: { groupId: "penyewa", label: "Lihat penyewa", icon: Store },
  SEMINAR: { groupId: "lokakarya", label: "Lihat lokakarya", icon: BookOpen },
  TRANSACTION: { groupId: "penyewa", label: "Lihat penyewa", icon: Store },
};

const HISTORY_PREVIEW = 6;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

interface Props {
  event: Event;
  /** Jump to another tab group of the visitor dashboard (e.g. "penyewa"). */
  onNavigate?: (groupId: string) => void;
}

/**
 * Visitor "Souvenir" tab: point balance + history, the catalog with locked /
 * unavailable states, how to earn points, and a confirm-before-redeem flow.
 * One souvenir per account per event (enforced by the backend).
 */
export default function VisitorSouvenirSection({ event, onNavigate }: Props) {
  const { data, isLoading, isError, error, refetch } = useApiQuery<MySouvenir>(
    keys.souvenir.my(event.uuid),
    () => getMySouvenir(event.uuid),
    { retry: 0 },
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const redeem = useApiMutation((tierId: string) => redeemSouvenir(event.uuid, tierId), {
    invalidate: [keys.souvenir.my(event.uuid)],
    notify: toast,
    errorMessage: "Gagal menukar souvenir.",
    onSuccess: (res) => {
      const message =
        res && typeof res === "object" && "message" in res && res.message
          ? String(res.message)
          : "Souvenir berhasil ditukar.";
      toast.success(message);
      setConfirmOpen(false);
      setSelectedId(null);
    },
    // A stale page (stock sold out, already redeemed elsewhere): show the server's reason and resync.
    onError: () => {
      setConfirmOpen(false);
      void refetch();
    },
  });

  // Close the confirm sheet with Escape.
  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !redeem.isPending) setConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen, redeem.isPending]);

  if (isLoading) return <LoadingState type="skeleton-list" count={3} className="py-6" />;

  if (isError || !data) {
    return (
      <div role="alert" className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center text-sm text-error-700">
        <p className="font-semibold">Souvenir gagal dimuat</p>
        <p className="mt-1 text-xs">{error instanceof Error ? error.message : "Coba lagi beberapa saat."}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded-lg border border-error-200 bg-white px-4 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-100"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (!data.enabled) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
        <Gift className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        Event ini belum memakai sistem poin souvenir.
      </div>
    );
  }

  const { availablePoints, totalPoints, spentPoints, ledger, earnRules, items, canRedeem, redeemed } = data;
  const selected: MySouvenirItem | null =
    canRedeem && selectedId
      ? (items.find((i) => i.id === selectedId && i.state === "REDEEMABLE") ?? null)
      : null;
  const visibleLedger = showAllHistory ? ledger : ledger.slice(0, HISTORY_PREVIEW);

  return (
    <div className="mt-4 space-y-6 pb-24">
      {/* ── Point balance ── */}
      <section className="rounded-2xl bg-secondary p-6 text-white shadow-sm">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-100">
          <Coins className="h-4 w-4" /> Poin kamu
        </p>
        <p className="mt-1 text-5xl font-extrabold tracking-tight">{availablePoints}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">Diperoleh {totalPoints}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Terpakai {spentPoints}</span>
        </div>
      </section>

      {/* ── Already redeemed ── */}
      {redeemed && (
        <section className="flex items-center gap-4 rounded-2xl border border-success-200 bg-success-50 p-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-success-500">
            {redeemed.image ? (
              <Image src={redeemed.image} alt={redeemed.name} fill sizes="64px" className="object-cover" />
            ) : (
              <CheckCircle2 className="h-7 w-7" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-success-700">Souvenir sudah ditukar</p>
            <p className="truncate text-base font-bold text-gray-900">{redeemed.name}</p>
            <p className="text-xs text-gray-600">
              {redeemed.pointsSpent} poin · {formatDateTime(redeemed.at)}. Tunjukkan QR-mu di meja souvenir untuk mengambilnya.
            </p>
          </div>
        </section>
      )}

      {/* ── How to earn points ── */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
          <Sparkles className="h-4 w-4 text-secondary" /> Cara mendapatkan poin
        </h3>
        {earnRules.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
            Penyelenggara belum mengatur cara mendapatkan poin.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earnRules.map((rule) => {
              const shortcut = EARN_SHORTCUTS[rule.source];
              return (
                <div key={rule.source} className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{rule.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{rule.description}</p>
                  </div>
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate(shortcut.groupId)}
                      className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-brand-100"
                    >
                      <shortcut.icon className="h-3.5 w-3.5" /> {shortcut.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Catalog ── */}
      <section>
        <h3 className="text-base font-bold text-gray-900">Tukarkan dengan poin</h3>
        <p className="mb-3 mt-0.5 text-xs text-gray-500">
          Setiap akun hanya bisa menukar satu souvenir per event, dan poin hanya berlaku untuk satu item.
        </p>
        {items.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
            Penyelenggara belum menambahkan item souvenir.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((item) => (
              <SouvenirCard
                key={item.id}
                item={item}
                canRedeem={canRedeem}
                selected={selected?.id === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Point history ── */}
      <section>
        <h3 className="mb-3 text-base font-bold text-gray-900">Riwayat poin</h3>
        {ledger.length === 0 ? (
          <p className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
            Belum ada riwayat poin. Kunjungi booth atau ikuti lokakarya untuk mulai mengumpulkan poin.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white">
              {visibleLedger.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </ul>
            {ledger.length > HISTORY_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllHistory((v) => !v)}
                className="mt-2 text-xs font-semibold text-secondary hover:underline"
              >
                {showAllHistory ? "Tampilkan lebih sedikit" : `Tampilkan semua (${ledger.length})`}
              </button>
            )}
          </>
        )}
      </section>

      {/* ── Redeem bar (appears once an item is selected) ── */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-[900] px-4 pb-4 sm:pb-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
            <div className="min-w-0 flex-1 pl-2">
              <p className="truncate text-sm font-bold text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-500">{selected.points} poin</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-xl bg-secondary px-8 py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-600"
            >
              Tukar
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm sheet ── */}
      {confirmOpen && selected && (
        <div
          className="fixed inset-0 z-[1100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => !redeem.isPending && setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="redeem-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <button
              type="button"
              aria-label="Tutup"
              disabled={redeem.isPending}
              onClick={() => setConfirmOpen(false)}
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-secondary">
              <Gift className="h-6 w-6" />
            </div>
            <h4 id="redeem-title" className="text-xl font-extrabold text-gray-900">
              Tukarkan poin?
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Kamu akan menukar <strong>{selected.points} poin</strong> dengan <strong>{selected.name}</strong>. Poin akan
              langsung dikurangi dan tidak dapat dikembalikan. Setiap akun hanya bisa menukar satu souvenir per event.
            </p>
            <p className="mt-4 flex items-center gap-2 text-lg font-bold text-gray-900">
              <Coins className="h-5 w-5 text-secondary" /> {selected.points} poin
              <span className="ml-auto text-xs font-medium text-gray-500">sisa {availablePoints - selected.points} poin</span>
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={redeem.isPending}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={redeem.isPending}
                onClick={() => redeem.mutate(selected.id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {redeem.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Tukar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SouvenirCard({
  item,
  canRedeem,
  selected,
  onSelect,
}: {
  item: MySouvenirItem;
  canRedeem: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const unavailable = item.state === "UNAVAILABLE";
  const locked = item.state === "LOCKED";
  const redeemedHere = item.state === "REDEEMED";
  const selectable = canRedeem && item.state === "REDEEMABLE";

  return (
    <button
      type="button"
      disabled={!selectable}
      aria-pressed={selected}
      onClick={onSelect}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
        selected ? "border-secondary ring-2 ring-secondary" : "border-gray-100"
      } ${selectable ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}`}
    >
      <div className={`relative aspect-square bg-gray-50 ${unavailable || locked ? "opacity-60" : ""}`}>
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={`object-cover ${locked || unavailable ? "grayscale" : ""}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Package className="h-10 w-10" />
          </div>
        )}
      </div>

      {unavailable && (
        <span className="absolute left-1/2 top-[38%] -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900/90 px-3 py-1.5 text-xs font-semibold text-white">
          Item unavailable
        </span>
      )}
      {redeemedHere && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-success-500 px-2.5 py-1 text-[11px] font-semibold text-white">
          <CheckCircle2 className="h-3 w-3" /> Ditukar
        </span>
      )}

      <div className="flex flex-1 flex-col items-center gap-2 p-3 text-center">
        <span
          className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-0.5 text-sm font-bold ${
            selectable || redeemedHere
              ? "border-secondary text-gray-900"
              : "border-gray-300 text-gray-500"
          }`}
        >
          {(locked || (!selectable && !redeemedHere && !unavailable)) && <Lock className="h-3.5 w-3.5" />}
          {item.points} poin
        </span>
        <p className="line-clamp-2 text-sm font-bold text-gray-900">{item.name}</p>
        {item.description && <p className="line-clamp-2 text-xs text-gray-500">{item.description}</p>}
        {locked && <p className="text-[11px] font-medium text-gray-500">Kurang {item.missingPoints} poin</p>}
        {item.remaining != null && !unavailable && (
          <p className="text-[11px] text-gray-400">Sisa {item.remaining}</p>
        )}
      </div>
    </button>
  );
}

function LedgerRow({ entry }: { entry: PointLedgerEntry }) {
  const earn = entry.type === "EARN";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          earn ? "bg-success-50 text-success-600" : "bg-error-50 text-error-600"
        }`}
      >
        {earn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{entry.label}</p>
        <p className="text-xs text-gray-500">{formatDateTime(entry.at)}</p>
      </div>
      <span className={`text-sm font-bold ${earn ? "text-success-600" : "text-error-600"}`}>
        {earn ? "+" : "−"}
        {entry.points}
      </span>
    </li>
  );
}
