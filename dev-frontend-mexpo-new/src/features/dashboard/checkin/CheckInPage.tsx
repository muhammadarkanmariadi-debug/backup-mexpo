"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  LogIn,
  LogOut,
  Maximize2,
  User,
} from "lucide-react";
import Image from "next/image";

import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import Button from "@/shared/components/button/Button";
import { QrScanPanel } from "@/shared/components/qr/QrScanPanel";
import SegmentedTabs from "@/shared/components/ui/SegmentedTabs";
import SearchableSelect from "@/shared/components/form/SearchableSelect";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import {
  checkInEvent,
  checkInWorkshop,
  checkOutEvent,
  checkOutWorkshop,
} from "@/services/attendance.service";
import { soundEffects } from "@/shared/utils/sound";
import KioskCheckInModal from "./KioskCheckInModal";

type Action = "in" | "out";
type Mode = "venue" | "workshop";

interface Props {
  event: Event;
  workshops: Workshop[];
}

interface RecentCheckInItem {
  id: string;
  name: string;
  email: string;
  photo?: string;
  time: string;
  action: Action;
  mode: Mode;
  workshopTitle?: string;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentCheckInItem[]>([]);
  const [isKioskOpen, setIsKioskOpen] = useState(false);

  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);
  const selectedWorkshop = workshops.find((w) => w.uuid === workshopId);

  /**
   * Instant direct check-in pipeline:
   * Resolves QR and immediately executes attendance recording in a single step (Zero-touch).
   */
  const handleExecuteDirectCheckIn = useCallback(
    async (codeToProcess?: string) => {
      const code = (codeToProcess ?? qrCode).trim();
      if (!code) {
        toast.error("Masukkan atau scan QR code terlebih dahulu.");
        return;
      }

      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
      }

      setIsProcessing(true);
      setResult(null);

      try {
        // 1. Resolve identity
        const resolveRes = await resolveQr(code);
        if (!resolveRes.status || !resolveRes.data) {
          throw new Error(resolveRes.message || "QR Code tidak dikenali.");
        }
        const resolvedData = resolveRes.data;
        setResolved(resolvedData);

        // 2. Immediate record check-in / check-out
        let attRes: { status: boolean; message: string } | null = null;
        if (action === "out") {
          if (mode === "workshop") {
            if (!workshopId) throw new Error("Pilih workshop terlebih dahulu.");
            attRes = (await checkOutWorkshop(
              workshopId,
              resolvedData.user_id,
            )) as unknown as { status: boolean; message: string };
          } else {
            attRes = (await checkOutEvent(
              event.uuid,
              resolvedData.user_id,
            )) as unknown as { status: boolean; message: string };
          }
        } else {
          if (mode === "workshop") {
            if (!workshopId) throw new Error("Pilih workshop terlebih dahulu.");
            attRes = (await checkInWorkshop(
              workshopId,
              resolvedData.user_id,
            )) as unknown as { status: boolean; message: string };
          } else {
            attRes = (await checkInEvent(
              event.uuid,
              resolvedData.user_id,
            )) as unknown as { status: boolean; message: string };
          }
        }

        const msg = attRes?.message || "";
        const isAlready =
          msg.toLowerCase().includes("already saved") ||
          msg.toLowerCase().includes("sudah");

        if (isAlready) {
          soundEffects.playWarning();
          setResult({
            ok: true,
            message: `Sudah Check-in: Kehadiran ${resolvedData.user.full_name} sudah tercatat hari ini.`,
          });
        } else {
          soundEffects.playSuccess();
          const successMsg =
            action === "out"
              ? `Check-out berhasil: ${resolvedData.user.full_name}`
              : `Check-in berhasil: ${resolvedData.user.full_name}`;
          setResult({ ok: true, message: successMsg });

          // Add to recent activity log
          const nowStr = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          setRecentLogs((prev) => [
            {
              id: `${resolvedData.user_id}-${Date.now()}`,
              name: resolvedData.user.full_name,
              email: resolvedData.user.email,
              photo: resolvedData.user.photo,
              time: nowStr,
              action,
              mode,
              workshopTitle: mode === "workshop" ? selectedWorkshop?.title : undefined,
            },
            ...prev.slice(0, 4), // keep last 5
          ]);
        }

        setQrCode("");
      } catch (err) {
        soundEffects.playError();
        setResolved(null);
        setResult({
          ok: false,
          message: err instanceof Error ? err.message : "Gagal memproses check-in.",
        });
      } finally {
        setIsProcessing(false);
        // Auto-dismiss the hero result card after 3 seconds so the station resets cleanly
        clearTimerRef.current = setTimeout(() => {
          setResolved(null);
          setResult(null);
        }, 3000);
      }
    },
    [action, event.uuid, mode, qrCode, selectedWorkshop?.title, workshopId],
  );

  return (
    <PageShell className="py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={action === "out" ? "Check-out" : "Check-in"}
          subtitle={event.name}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsKioskOpen(true)}
          startIcon={<Maximize2 className="h-4 w-4 text-emerald-600" />}
          className="self-start sm:self-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          Mode Kiosk (Self Check-in)
        </Button>
      </div>

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

      {/* Instant Scan & Check-in Panel (Without manual confirmation button) */}
      <QrScanPanel
        containerId="qr-reader"
        qrValue={qrCode}
        onQrChange={setQrCode}
        searching={isProcessing}
        onSearch={(scannedCode) => void handleExecuteDirectCheckIn(scannedCode)}
        resolved={resolved}
        result={result}
        scannerOptions={{
          continuous: true,
          cooldownMs: 3500,
        }}
        searchButtonLabel={action === "out" ? "Check-out Langsung" : "Check-in Langsung"}
        renderUserAction={() => (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Check-in Terverifikasi
          </span>
        )}
      />

      {/* Recent Check-in Activity Feed */}
      {recentLogs.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-100 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <History className="h-4 w-4 text-brand-600" />
              <span>Aktivitas Check-in Terbaru</span>
            </div>
            <span className="text-xs text-gray-400">
              {recentLogs.length} orang tercatat sesi ini
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {recentLogs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="flex items-center gap-3">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={item.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.workshopTitle ? `${item.workshopTitle} • ` : ""}
                      {item.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.action === "out"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Kiosk Self Check-in Modal */}
      <KioskCheckInModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        event={event}
        action={action}
        mode={mode}
        workshop={selectedWorkshop}
        onSuccessCheckIn={(res) => {
          const nowStr = new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
          setRecentLogs((prev) => [
            {
              id: `${res.user_id}-${Date.now()}`,
              name: res.user.full_name,
              email: res.user.email,
              photo: res.user.photo,
              time: nowStr,
              action,
              mode,
              workshopTitle: mode === "workshop" ? selectedWorkshop?.title : undefined,
            },
            ...prev.slice(0, 4),
          ]);
        }}
      />
    </PageShell>
  );
}
