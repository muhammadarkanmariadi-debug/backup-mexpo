"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Gift,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import Input from "@/shared/components/form/Input";
import { Event } from "@/entities/event/event.entity";
import { useApiMutation } from "@/lib/hooks/useApi";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import {
  checkSouvenir,
  grantSouvenir,
  SouvenirCheckResult,
} from "@/services/souvenir.service";
import BackLink from "@/features/dashboard/shared/BackLink";

export default function SouvenirCounterPage({ event }: { event: Event }) {
  const [qrCode, setQrCode] = useState("");
  const [check, setCheck] = useState<SouvenirCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
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
    setScanning(true);
    setResult(null);
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const scanner = new Html5Qrcode("souvenir-qr-reader");
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
      toast.error("Masukkan atau scan QR code pengunjung.");
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await resolveQr(value);
      if (!res.status || !res.data) throw new Error(res.message || "QR tidak dikenali");
      const resolved = res.data as ResolvedQr;
      const ck = await checkSouvenir(event.uuid, resolved.user_id);
      if (!ck.status || !ck.data) throw new Error(ck.message || "Gagal mengecek");
      setCheck(ck.data as SouvenirCheckResult);
    } catch (err) {
      setCheck(null);
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Gagal mengecek",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleGrant = useApiMutation(
    () => grantSouvenir(event.uuid, check?.user.uuid ?? ""),
    {
      onSuccess: (res) => {
        const message =
          typeof res === "object" && res && "message" in res && res.message
            ? String(res.message)
            : "Souvenir diberikan.";
        setResult({ ok: true, message });
        setCheck(null);
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

  const onGrant = () => {
    if (!check) return;
    setResult(null);
    handleGrant.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-700">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Souvenir</h1>
          <p className="text-sm text-gray-500">{event.name}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5">
        <Input
          label="QR Code Pengunjung"
          value={qrCode}
          onChange={(e) => {
            setQrCode(e.target.value);
            setResult(null);
            setCheck(null);
          }}
          placeholder="Scan atau tempel kode QR"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleSearch()}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
          >
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Cek Pengunjung
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
          <div id="souvenir-qr-reader" className="w-full max-w-xs overflow-hidden rounded-lg border border-gray-200" />
        )}

        {check && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              {check.user.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={check.user.photo} alt={check.user.full_name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700">
                  <Gift className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{check.user.full_name}</p>
                <p className="text-xs text-gray-500">{check.user.email}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Booth: {check.boothVisits} Â· Seminar: {check.joinedSeminar ? "ya" : "belum"}
                </p>
              </div>
            </div>

            {check.alreadyClaimed ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                <XCircle className="h-4 w-4 shrink-0" /> Sudah pernah klaim souvenir.
              </div>
            ) : check.eligible ? (
              <button
                onClick={onGrant}
                disabled={handleGrant.isPending}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 disabled:opacity-50"
              >
                {handleGrant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
                Berikan Souvenir
              </button>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Belum memenuhi syarat: {check.reasons.join(", ")}</span>
              </div>
            )}
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


