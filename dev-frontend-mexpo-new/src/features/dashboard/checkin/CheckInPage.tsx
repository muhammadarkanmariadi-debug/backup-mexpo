"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarClock,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  Search,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import Input from "@/shared/components/form/Input";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import { checkInEvent, checkInWorkshop } from "@/services/attendance.service";
import BackLink from "@/features/dashboard/shared/BackLink";

type Mode = "venue" | "workshop";

interface Props {
  event: Event;
  workshops: Workshop[];
}

const MODES: { key: Mode; label: string; icon: React.ElementType }[] = [
  { key: "venue", label: "Check-in Venue", icon: Building2 },
  { key: "workshop", label: "Check-in Workshop", icon: CalendarClock },
];

export default function CheckInPage({ event, workshops }: Props) {
  const [mode, setMode] = useState<Mode>("venue");
  const [workshopId, setWorkshopId] = useState(workshops[0]?.uuid ?? "");
  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScan = async () => {
    setResult(null);
    setScanning(true);
    // html5-qrcode requires the #qr-reader element to exist AND be visible.
    // Wait for React to flush the render before initializing the scanner.
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          setQrCode(decodedText);
          void stopScan();
          void handleSearch(decodedText);
        },
        () => {},
      );
    } catch (error) {
      setScanning(false);
      toast.error(
        error instanceof Error ? error.message : "Tidak bisa mengakses kamera.",
      );
    }
  };

  const handleSearch = async (code?: string) => {
    const value = (code ?? qrCode).trim();
    if (!value) {
      toast.error("Masukkan atau scan QR code terlebih dahulu.");
      return;
    }
    setSearching(true);
    setResult(null);
    try {
      const res = await resolveQr(value);
      if (!res.status || !res.data) throw new Error(res.message || "QR tidak dikenali");
      setResolved(res.data as ResolvedQr);
    } catch (err) {
      setResolved(null);
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "QR tidak dikenali",
      });
    } finally {
      setSearching(false);
    }
  };

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

  const handleCheckIn = () => {
    if (!resolved) return;
    setResult(null);
    checkIn.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Check-in</h1>
      <p className="mb-6 text-sm text-gray-500">{event.name}</p>

      {/* Mode tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setMode(key);
              setResult(null);
              setResolved(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              mode === key
                ? "bg-secondary text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {/* Target selectors */}
      {mode === "workshop" && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">Pilih Workshop</label>
          <select
            value={workshopId}
            onChange={(e) => setWorkshopId(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800"
          >
            {workshops.length === 0 && <option value="">Belum ada workshop</option>}
            {workshops.map((w) => (
              <option key={w.uuid} value={w.uuid}>
                {w.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QR input */}
      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5">
        <Input
          label="QR Code Pengunjung"
          value={qrCode}
          onChange={(e) => {
            setQrCode(e.target.value);
            setResult(null);
          }}
          placeholder="Scan atau tempel kode QR"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleSearch()}
            disabled={searching}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Cari Pengunjung
          </button>
          {!scanning ? (
            <button
              onClick={() => void startScan()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Camera className="h-4 w-4" /> Scan Kamera
            </button>
          ) : (
            <button
              onClick={() => void stopScan()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Hentikan Scan
            </button>
          )}
        </div>

        {scanning && (
          <div id="qr-reader" className="w-full max-w-xs overflow-hidden rounded-lg border border-gray-200" />
        )}
        {resolved && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
            {resolved.user.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolved.user.photo}
                alt={resolved.user.full_name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <QrCode className="h-5 w-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{resolved.user.full_name}</p>
              <p className="text-xs text-gray-500">{resolved.user.email}</p>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={checkIn.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {checkIn.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Konfirmasi
            </button>
          </div>
        )}

        {result && (
          <div
            className={`flex items-start gap-2 rounded-lg p-4 text-sm ${
              result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
