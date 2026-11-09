"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
} from "lucide-react";

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
import {
  checkInEvent,
  checkInWorkshop,
  checkOutEvent,
  checkOutWorkshop,
} from "@/services/attendance.service";

type Action = "in" | "out";
type Mode = "venue" | "workshop";

interface Props {
  event: Event;
  workshops: Workshop[];
}

const ACTIONS: { key: Action; label: string; icon: React.ElementType }[] = [
  { key: "in", label: "Check-in (Masuk)", icon: LogIn },
  { key: "out", label: "Check-out (Keluar)", icon: LogOut },
];

const MODES: { key: Mode; label: string; icon: React.ElementType }[] = [
  { key: "venue", label: "Lokasi Acara", icon: Building2 },
  { key: "workshop", label: "Lokakarya / Seminar", icon: CalendarClock },
];

export default function CheckInPage({ event, workshops }: Props) {
  const [action, setAction] = useState<Action>("in");
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

  const attendanceMutation = useApiMutation(
    () => {
      if (!resolved) throw new Error("Pengunjung belum di-resolve.");
      if (action === "out") {
        if (mode === "workshop") {
          if (!workshopId) throw new Error("Pilih workshop terlebih dahulu.");
          return checkOutWorkshop(workshopId, resolved.user_id);
        }
        return checkOutEvent(event.uuid, resolved.user_id);
      } else {
        if (mode === "workshop") {
          if (!workshopId) throw new Error("Pilih workshop terlebih dahulu.");
          return checkInWorkshop(workshopId, resolved.user_id);
        }
        return checkInEvent(event.uuid, resolved.user_id);
      }
    },
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : action === "out"
              ? "Check-out berhasil dicatat."
              : "Check-in berhasil.";
        setResult({ ok: true, message });
        setResolved(null);
        setQrCode("");
      },
      onError: (err) => {
        setResult({
          ok: false,
          message:
            err instanceof Error
              ? err.message
              : action === "out"
                ? "Check-out gagal"
                : "Check-in gagal",
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

  const handleConfirm = () => {
    if (!resolved) return;
    setResult(null);
    attendanceMutation.mutate();
  };

  return (
    <PageShell className="py-8">
      <PageHeader
        title={action === "out" ? "Check-out" : "Check-in"}
        subtitle={event.name}
      />

      {/* Action switcher */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Tipe Aksi
        </label>
        <SegmentedTabs<Action>
          items={ACTIONS.map(({ key, label, icon }) => ({ id: key, label, icon }))}
          value={action}
          onChange={(next) => {
            setAction(next);
            setResult(null);
            setResolved(null);
          }}
        />
      </div>

      {/* Target Mode tabs */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Target
        </label>
        <SegmentedTabs<Mode>
          items={MODES.map(({ key, label, icon }) => ({ id: key, label, icon }))}
          value={mode}
          onChange={(next) => {
            setMode(next);
            setResult(null);
            setResolved(null);
          }}
        />
      </div>

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
            variant={action === "out" ? "primary" : "success"}
            disabled={attendanceMutation.isPending}
            onClick={handleConfirm}
            startIcon={
              attendanceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : action === "out" ? (
                <LogOut className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )
            }
          >
            {action === "out" ? "Konfirmasi Check-out" : "Konfirmasi Check-in"}
          </Button>
        )}
      />
    </PageShell>
  );
}
