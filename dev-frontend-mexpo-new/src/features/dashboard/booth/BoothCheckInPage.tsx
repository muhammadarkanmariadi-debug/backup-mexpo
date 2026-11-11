"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { CheckCircle2, Store } from "lucide-react";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import SearchableSelect from "@/shared/components/form/SearchableSelect";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyTenants } from "@/services/event-data.service";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import { checkInTenant } from "@/services/attendance.service";
import { Event } from "@/entities/event/event.entity";
import { Tenant } from "@/entities/event/tenant.entity";
import { Loader2 } from "lucide-react";
import { soundEffects } from "@/shared/utils/sound";

interface Props {
  event: Event;
}

export default function BoothCheckInPage({ event }: Props) {
  const [tenantId, setTenantId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Tenant list for the booth selector — server-backed via TanStack Query.
  const { data: myTenants, isLoading: loadingTenants } = useApiQuery<Tenant[]>(
    keys.tenants.mine({ event: event.uuid }),
    () => getMyTenants(event.uuid),
  );
  const tenants = myTenants ?? [];
  const activeTenantId = tenantId || tenants[0]?.uuid || "";

  /**
   * Direct instant booth check-in pipeline (Zero-touch).
   */
  const handleExecuteDirectBoothCheckIn = useCallback(
    async (codeToProcess?: string) => {
      const code = (codeToProcess ?? qrCode).trim();
      if (!code) {
        toast.error("Masukkan atau scan QR code pengunjung.");
        return;
      }
      if (!activeTenantId) {
        toast.error("Pilih penyewa / booth terlebih dahulu.");
        return;
      }

      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }

      setIsProcessing(true);
      setResult(null);

      try {
        // 1. Resolve QR
        const resolveRes = await resolveQr(code);
        if (!resolveRes.status || !resolveRes.data) {
          throw new Error(resolveRes.message || "QR Code tidak dikenali.");
        }
        const resolvedData = resolveRes.data;
        setResolved(resolvedData);

        // 2. Record booth visit
        const visitRes = (await checkInTenant(
          activeTenantId,
          resolvedData.user_id,
        )) as unknown as { status: boolean; message?: string };

        const msg = visitRes?.message || "";
        const isAlready =
          msg.toLowerCase().includes("already") ||
          msg.toLowerCase().includes("sudah");

        if (isAlready) {
          soundEffects.playWarning();
          setResult({
            ok: true,
            message: `Kunjungan ${resolvedData.user.full_name} sudah tercatat sebelumnya.`,
          });
        } else {
          soundEffects.playSuccess();
          setResult({
            ok: true,
            message: `Kunjungan booth berhasil dicatat: ${resolvedData.user.full_name}`,
          });
        }

        setQrCode("");
      } catch (err) {
        soundEffects.playError();
        setResolved(null);
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal mencatat kunjungan booth.",
        });
      } finally {
        setIsProcessing(false);
        // Auto-dismiss the preview after 3 seconds
        clearTimerRef.current = setTimeout(() => {
          setResolved(null);
          setResult(null);
        }, 3000);
      }
    },
    [activeTenantId, qrCode],
  );

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Scan Kunjungan Booth"
        subtitle={event.name}
        icon={{
          node: <Store className="h-5 w-5" />,
          className: "bg-teal-50 text-teal-700",
        }}
      />

      {loadingTenants ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          Kamu belum terdaftar sebagai penyewa yang disetujui di event ini.
        </div>
      ) : (
        <div className="space-y-4">
          <SearchableSelect
            value={activeTenantId}
            onChange={setTenantId}
            label="Booth / Penyewa"
            placeholder="Pilih booth…"
            options={tenants.map((t) => ({
              value: t.uuid,
              label: t.name,
              hint: t.booth_number ? `Booth ${t.booth_number}` : undefined,
            }))}
          />

          <QrScanPanel
            containerId="booth-qr-reader"
            accent="teal"
            qrValue={qrCode}
            onQrChange={setQrCode}
            searching={isProcessing}
            onSearch={(scannedCode) => void handleExecuteDirectBoothCheckIn(scannedCode)}
            resolved={resolved}
            result={result}
            scannerOptions={{
              continuous: true,
              cooldownMs: 3500,
            }}
            searchButtonLabel="Catat Kunjungan Langsung"
            renderUserAction={() => (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Kunjungan Tercatat
              </span>
            )}
          />
        </div>
      )}
    </PageShell>
  );
}
