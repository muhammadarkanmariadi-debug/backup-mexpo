"use client";

import { useState } from "react";
import { Gift, Loader2, XCircle } from "lucide-react";

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
  SouvenirCheckResult,
} from "@/services/souvenir.service";

export default function SouvenirCounterPage({ event }: { event: Event }) {
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

  // 3) Grant the souvenir (one per event).
  const grant = useApiMutation(
    () => grantSouvenir(event.uuid, checkResult?.user.uuid ?? ""),
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : "Souvenir diberikan.";
        setResult({ ok: true, message });
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
              <p className="mt-3 text-xs text-gray-500">
                Booth: {checkResult.boothVisits} · Seminar:{" "}
                {checkResult.joinedSeminar ? "ya" : "belum"}
              </p>

              {checkResult.alreadyClaimed ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-warning-50 p-3 text-sm text-warning-700">
                  <XCircle className="h-4 w-4 shrink-0" /> Sudah pernah klaim
                  souvenir.
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
                    Belum memenuhi syarat: {checkResult.reasons.join(", ")}
                  </span>
                </div>
              )}
            </>
          ) : null
        }
      />
    </PageShell>
  );
}