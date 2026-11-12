"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Gift, Loader2, Package, QrCode, XCircle } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import { useResolveQr } from "@/lib/hooks/useResolveQr";
import { useApiMutation } from "@/lib/hooks/useApi";
import { Event } from "@/entities/event/event.entity";
import { ResolvedQr } from "@/services/qr.service";
import {
  checkSouvenir,
  collectSouvenir,
  grantSouvenir,
  listSouvenirs,
  normalizeVoucherCode,
  resolveSouvenirVoucher,
  SouvenirCheckResult,
  SouvenirRecord,
  SouvenirVoucher,
} from "@/services/souvenir.service";
import SouvenirQuickSettings from "./SouvenirQuickSettings";

export default function SouvenirCounterPage({ event }: { event: Event }) {
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

  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [checkResult, setCheckResult] = useState<SouvenirCheckResult | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  // A redemption voucher scanned at the counter (visitor's QR after redeeming).
  const [voucher, setVoucher] = useState<SouvenirVoucher | null>(null);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

  // Voucher QR → who redeemed what, and whether it was handed over already.
  const resolveVoucher = useApiMutation<SouvenirVoucher, string>(
    (code) => resolveSouvenirVoucher(event.uuid, code),
    {
      onSuccess: (data) => {
        setVoucher(data);
        // Reuse the identity tile of the scan panel.
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

  // Hand the item over: marks the voucher collected (once).
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
        // Refresh whichever card is open so it shows "Sudah diserahkan".
        if (voucher) resolveVoucher.mutate(code);
        else if (resolved) check.mutate({ eventId: event.uuid, userId: resolved.user_id });
      },
      onError: (err) => {
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal menyerahkan souvenir",
        });
        // Probably already handed over elsewhere: show the current state.
        if (voucher) resolveVoucher.mutate(voucher.code);
      },
    },
  );

  // 2) Check the visitor's souvenir eligibility (server-side rules).
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

  // 1) QR → participant identity, then run the eligibility check.
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

  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  // 3) Grant the souvenir (one per event).
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
        setResult({ ok: true, message });
        setSelectedTierId(null);
        setHistoryKey((k) => k + 1);
        if (resolved) {
          // One souvenir per account per event: re-check so the visitor's card
          // shows "sudah mengambil" with the redeemed item and the new balance.
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
    // A redemption voucher (SV-XXXXXXXXXX) is looked up directly; anything else
    // is a visitor identity (QR / email) as before.
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
        title="Souvenir"
        subtitle={event.name}
      />

      <SouvenirQuickSettings event={event} />

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
                      <p className="font-semibold text-gray-700">Katalog Souvenir</p>
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
                  // Redeemed in the app, item not handed over yet: staff can hand it over here too.
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

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-gray-800">
          Riwayat Penerima Souvenir ({history.length})
        </p>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400">Belum ada penerima souvenir.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-2 pr-3">Penerima</th>
                  <th className="py-2 pr-3">Jenis Souvenir</th>
                  <th className="py-2 pr-3">Poin Dipakai</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-800">
                      {row.users?.full_name}
                    </td>
                    <td className="py-2 pr-3">{row.souvenir_name || "-"}</td>
                    <td className="py-2 pr-3">{row.points_spent}</td>
                    <td className="py-2 pr-3">
                      {row.collected_at ? (
                        <span className="font-semibold text-success-700">Diserahkan</span>
                      ) : (
                        <span className="font-semibold text-brand-700">Menunggu diambil</span>
                      )}
                    </td>
                    <td className="py-2">
                      {new Date(row.created_at).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}