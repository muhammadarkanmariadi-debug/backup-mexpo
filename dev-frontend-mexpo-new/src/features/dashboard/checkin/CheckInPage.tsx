"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarClock, CheckCircle2, Loader2 } from "lucide-react";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import SegmentedTabs from "@/shared/components/ui/SegmentedTabs";
import SearchableSelect from "@/shared/components/form/SearchableSelect";
import { useResolveQr } from "@/lib/hooks/useResolveQr";
import { useApiMutation } from "@/lib/hooks/useApi";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { ResolvedQr } from "@/services/qr.service";
import { checkInEvent, checkInWorkshop } from "@/services/attendance.service";

type Mode = "venue" | "workshop";

interface Props {
  event: Event;
  workshops: Workshop[];
}

const MODES: { key: Mode; label: string; icon: React.ElementType }[] = [
  { key: "venue", label: "Check-in Lokasi", icon: Building2 },
  { key: "workshop", label: "Check-in Lokakarya", icon: CalendarClock },
];

export default function CheckInPage({ event, workshops }: Props) {
  const [mode, setMode] = useState<Mode>("venue");
  const [workshopId, setWorkshopId] = useState(workshops[0]?.uuid ?? "");
  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

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
      if (mode === "workshop") {
        if (!workshopId) throw new Error("Pilih workshop terlebih dahulu.");
        return checkInWorkshop(workshopId, resolved.user_id);
      }
      return checkInEvent(event.uuid, resolved.user_id);
    },
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : "Check-in berhasil.";
        setResult({ ok: true, message });
        setResolved(null);
        setQrCode("");
      },
      onError: (err) => {
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Check-in gagal",
        });
      },
    },
  );

  const handleSearch = (code?: string) => {
    const value = (code ?? qrCode).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR code terlebih dahulu.");
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
      <PageHeader title="Check-in" subtitle={event.name} />

      {/* Mode tabs */}
      <SegmentedTabs<Mode>
        items={MODES.map(({ key, label, icon }) => ({ id: key, label, icon }))}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setResult(null);
          setResolved(null);
        }}
        className="mb-6"
      />

      {/* Target selectors */}
      {mode === "workshop" && (
        <div className="mb-4">
          <SearchableSelect
            value={workshopId}
            onChange={setWorkshopId}
            options={workshops.map((w) => ({ value: w.uuid, label: w.title }))}
            label="Pilih Lokakarya"
            placeholder="Pilih lokakarya…"
            emptyText="Belum ada lokakarya."
          />
        </div>
      )}

      <QrScanPanel
        containerId="qr-reader"
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
                <CheckCircle2 className="h-4 w-4" />
              )
            }
          >
            Konfirmasi
          </Button>
        )}
      />
    </PageShell>
  );
}