"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanLine,
  Search,
  Store,
  XCircle,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import Input from "@/shared/components/form/Input";
import { Event } from "@/entities/event/event.entity";
import { Tenant } from "@/entities/event/tenant.entity";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyTenants } from "@/services/event-data.service";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import { checkInTenant } from "@/services/attendance.service";
import BackLink from "@/features/dashboard/shared/BackLink";

interface Props {
  event: Event;
}

export default function BoothCheckInPage({ event }: Props) {
  const [qrCode, setQrCode] = useState("");
  const [resolved, setResolved] = useState<ResolvedQr | null>(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Tenant list for the booth selector — server-backed via TanStack Query.
  const { data: myTenants, isLoading: loadingTenants } = useApiQuery<Tenant[]>(
    keys.tenants.mine({ event: event.uuid }),
    () => getMyTenants(event.uuid),
  );
  const tenants = myTenants ?? [];
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    if (tenantId === "" && tenants.length > 0) {
      setTenantId(tenants[0].uuid);
    }
  }, [tenants, tenantId]);

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
    // html5-qrcode requires the element to exist AND be visible.
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      const scanner = new Html5Qrcode("booth-qr-reader");
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
      if (!tenantId) throw new Error("Pilih tenant/booth terlebih dahulu.");
      return checkInTenant(tenantId, resolved.user_id);
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

  const handleCheckIn = () => {
    if (!resolved) return;
    setResult(null);
    checkIn.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackLink href={`/dashboard/${event.slug ?? event.uuid}`} />
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Store className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Scan Booth</h1>
          <p className="text-sm text-gray-500">{event.name}</p>
        </div>
      </div>

      {loadingTenants ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
          Kamu belum terdaftar sebagai tenant yang disetujui di event ini.
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Booth / Tenant
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800"
            >
              {tenants.map((t) => (
                <option key={t.uuid} value={t.uuid}>
                  {t.name}
                  {t.booth_number ? ` (${t.booth_number})` : ""}
                </option>
              ))}
            </select>
          </div>

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
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
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
            <div
              id="booth-qr-reader"
              className="w-full max-w-xs overflow-hidden rounded-lg border border-gray-200"
            />
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
                  <ScanLine className="h-5 w-5" />
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
                {checkIn.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Catat Kunjungan
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
      )}
    </div>
  );
}
