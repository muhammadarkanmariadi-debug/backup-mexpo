"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Gift, Loader2, Package, XCircle } from "lucide-react";

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
  grantSouvenir,
  listSouvenirs,
  SouvenirCheckResult,
  SouvenirRecord,
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
        if (checkResult?.usePointSystem && resolved) {
          // Point balance is spendable: refresh the balance so the committee
          // can redeem the remaining points right away.
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
    resolve.mutate(value);
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
        accent="fuchsia"
        qrValue={qrCode}
        onQrChange={setQrCode}
        searching={resolve.isPending || check.isPending}
        onSearch={handleSearch}
        resolved={resolved}
        result={result}
        renderUserDetails={() =>
          checkResult ? (
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
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-700">
                  <XCircle className="h-4 w-4 shrink-0" /> Sudah mengambil souvenir
                  {checkResult.claimedSouvenir?.souvenir_name
                    ? ` (${checkResult.claimedSouvenir.souvenir_name}`
                    : ""}
                  {checkResult.claimedSouvenir
                    ? `, ${new Date(checkResult.claimedSouvenir.claimed_at).toLocaleString("id-ID")})`
                    : ""}
                  . Tidak bisa mengambil lagi.
                </div>
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