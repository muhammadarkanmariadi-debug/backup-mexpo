"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store } from "lucide-react";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import SearchableSelect from "@/shared/components/form/SearchableSelect";
import { useResolveQr } from "@/lib/hooks/useResolveQr";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyTenants } from "@/services/event-data.service";
import { ResolvedQr } from "@/services/qr.service";
import { checkInTenant } from "@/services/attendance.service";
import { Event } from "@/entities/event/event.entity";
import { Tenant } from "@/entities/event/tenant.entity";
import { Loader2 } from "lucide-react";

interface Props {
  event: Event;
}

export default function BoothCheckInPage({ event }: Props) {
  const [tenantId, setTenantId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Tenant list for the booth selector — server-backed via TanStack Query.
  const { data: myTenants, isLoading: loadingTenants } = useApiQuery<Tenant[]>(
    keys.tenants.mine({ event: event.uuid }),
    () => getMyTenants(event.uuid),
  );
  const tenants = myTenants ?? [];
  // Fall back to the first tenant while the user hasn't picked one yet.
  const activeTenantId = tenantId || tenants[0]?.uuid || "";

  const resolve = useResolveQr({
    onSuccess: (data) => {
      setResolved(data);
    },
    onError: (err) => {
      setResolved(null);
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "QR tidak dikenali",
      });
    },
  });

  const checkIn = useApiMutation(
    () => {
      if (!resolved) throw new Error("Pengunjung belum di-resolve.");
      if (!activeTenantId) throw new Error("Pilih penyewa/booth terlebih dahulu.");
      return checkInTenant(activeTenantId, resolved.user_id);
    },
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : "Booth visit tercatat.";
        setResult({ ok: true, message });
        setResolved(null);
        setQrCode("");
      },
      onError: (err) => {
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Check-in booth gagal",
        });
      },
    },
  );

  const handleSearch = (code?: string) => {
    const value = (code ?? qrCode).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR code pengunjung.");
      return;
    }
    setResult(null);
    setResolved(null);
    resolve.mutate(value);
  };

  const handleCheckIn = () => {
    if (!resolved) return;
    setResult(null);
    checkIn.mutate();
  };

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Scan Booth"
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
            searching={resolve.isPending}
            onSearch={handleSearch}
            resolved={resolved}
            result={result}
            renderUserAction={() => (
              <Button
                type="button"
                size="xs"
                variant="success"
                disabled={checkIn.isPending}
                onClick={handleCheckIn}
                startIcon={
                  checkIn.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )
                }
              >
                Catat Kunjungan
              </Button>
            )}
          />
        </div>
      )}
    </PageShell>
  );
}