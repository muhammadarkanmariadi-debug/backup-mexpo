"use client";

import React from "react";
import {
  Camera,
  CheckCircle2,
  Loader2,
  ScanLine,
  Search,
  XCircle,
} from "lucide-react";

import Input from "@/shared/components/form/Input";
import Button from "@/shared/components/button/Button";
import Image from "next/image";
import { useQrScanner } from "@/shared/hooks/useQrScanner";
import { ResolvedQr } from "@/services/qr.service";
import { cn } from "@/shared/utils/cn";

type Accent = "brand" | "teal" | "fuchsia";

/** Tint the scanner panel per flow (venue = brand, booth = teal, souvenir = fuchsia). */
const ACCENT_CLASSES: Record<Accent, { tile: string; avatar: string }> = {
  brand: { tile: "bg-brand-50 text-brand-600", avatar: "bg-brand-100 text-brand-700" },
  teal: { tile: "bg-teal-50 text-teal-600", avatar: "bg-teal-100 text-teal-700" },
  fuchsia: { tile: "bg-fuchsia-50 text-fuchsia-600", avatar: "bg-fuchsia-100 text-fuchsia-700" },
};

interface QrScanPanelProps {
  /** Unique id of the camera preview container (html5-qrcode requirement). */
  containerId: string;
  accent?: Accent;
  /** Controlled QR code input. */
  qrValue: string;
  onQrChange: (value: string) => void;
  /** Busy state while resolving a QR (search button spinner). */
  searching: boolean;
  /** Run the resolve flow. Called with the decoded text after a scan. */
  onSearch: (code?: string) => void;
  /** Resolved participant — renders the identity tile. */
  resolved: ResolvedQr | null;
  /** Optional action rendered inside the identity tile (e.g. Konfirmasi). */
  renderUserAction?: (resolved: ResolvedQr) => React.ReactNode;
  /** Optional secondary block under the identity (e.g. souvenir eligibility). */
  renderUserDetails?: (resolved: ResolvedQr) => React.ReactNode;
  /** Success/error banner. */
  result?: { ok: boolean; message: string } | null;
}

/**
 * Shared QR input + scanner + resolved-user panel, used by the check-in,
 * booth check-in and souvenir counter flows (previously triplicated).
 */
export function QrScanPanel({
  containerId,
  accent = "brand",
  qrValue,
  onQrChange,
  searching,
  onSearch,
  resolved,
  renderUserAction,
  renderUserDetails,
  result,
}: QrScanPanelProps) {
  const { scanning, startScan, stopScan } = useQrScanner(containerId);
  const palette = ACCENT_CLASSES[accent];

  const handleDecoded = (text: string) => {
    onQrChange(text);
    onSearch(text);
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5">
      <Input
        label="QR Code Pengunjung"
        value={qrValue}
        onChange={(e) => {
          onQrChange(e.target.value);
        }}
        placeholder="Scan atau tempel kode QR"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="xs"
          disabled={searching}
          onClick={() => onSearch()}
          startIcon={
            searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )
          }
        >
          Cari Pengunjung
        </Button>

        {!scanning ? (
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => void startScan(handleDecoded)}
            startIcon={<Camera className="h-4 w-4" />}
          >
            Scan Kamera
          </Button>
        ) : (
          <Button
            type="button"
            size="xs"
            variant="danger"
            onClick={() => void stopScan()}
            startIcon={<Camera className="h-4 w-4" />}
          >
            Hentikan Scan
          </Button>
        )}
      </div>

      {scanning && (
        <div
          id={containerId}
          className="w-full max-w-xs overflow-hidden rounded-lg border border-gray-200"
        />
      )}

      {resolved && (
        <div className={cn("rounded-lg p-4", palette.tile)}>
          <div className="flex items-center gap-3">
            {resolved.user.photo ? (
              <Image
                src={resolved.user.photo}
                alt={resolved.user.full_name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  palette.avatar,
                )}
              >
                <ScanLine className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900">
                {resolved.user.full_name}
              </p>
              <p className="text-xs text-gray-500">{resolved.user.email}</p>
            </div>
            {renderUserAction?.(resolved)}
          </div>
          {renderUserDetails?.(resolved)}
        </div>
      )}

      {result && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg p-4 text-sm",
            result.ok ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700",
          )}
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
  );
}