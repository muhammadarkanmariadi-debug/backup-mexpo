"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Minimize2,
  ScanLine,
  User,
  Sparkles,
  SwitchCamera,
  X,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { soundEffects } from "@/shared/utils/sound";
import { resolveQr, ResolvedQr } from "@/services/qr.service";
import {
  checkInEvent,
  checkInWorkshop,
  checkOutEvent,
  checkOutWorkshop,
} from "@/services/attendance.service";
import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  action: "in" | "out";
  mode: "venue" | "workshop";
  workshop?: Workshop;
  onSuccessCheckIn?: (resolved: ResolvedQr, message: string) => void;
}

interface ScanFeedback {
  type: "success" | "warning" | "error";
  title: string;
  message: string;
  user?: ResolvedQr["user"];
}

export default function KioskCheckInModal({
  isOpen,
  onClose,
  event,
  action,
  mode,
  workshop,
  onSuccessCheckIn,
}: Props) {
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store latest props in a ref so scanner and callbacks are 100% stable
  // and do NOT re-trigger camera re-mounts on parent re-renders.
  const propsRef = useRef({ action, event, mode, workshop, onSuccessCheckIn });
  propsRef.current = { action, event, mode, workshop, onSuccessCheckIn };

  const dismissFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setFeedback(null);
    isProcessingRef.current = false;
  }, []);

  const stopCamera = useCallback(async () => {
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
  }, []);

  const handleProcessQr = useCallback(
    async (code: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }

      const { action: curAction, event: curEvent, mode: curMode, workshop: curWorkshop, onSuccessCheckIn: curOnSuccess } = propsRef.current;

      try {
        // 1. Resolve QR
        const resolveRes = await resolveQr(code);
        if (!resolveRes.status || !resolveRes.data) {
          throw new Error(resolveRes.message || "QR Code tidak dikenali.");
        }
        const resolved = resolveRes.data;

        // 2. Direct Check-in / Check-out
        let attRes: { status: boolean; message: string } | null = null;
        if (curAction === "out") {
          if (curMode === "workshop") {
            if (!curWorkshop?.uuid) throw new Error("Workshop belum dipilih.");
            attRes = (await checkOutWorkshop(curWorkshop.uuid, resolved.user_id)) as unknown as {
              status: boolean;
              message: string;
            };
          } else {
            attRes = (await checkOutEvent(curEvent.uuid, resolved.user_id)) as unknown as {
              status: boolean;
              message: string;
            };
          }
        } else {
          if (curMode === "workshop") {
            if (!curWorkshop?.uuid) throw new Error("Workshop belum dipilih.");
            attRes = (await checkInWorkshop(curWorkshop.uuid, resolved.user_id)) as unknown as {
              status: boolean;
              message: string;
            };
          } else {
            attRes = (await checkInEvent(curEvent.uuid, resolved.user_id)) as unknown as {
              status: boolean;
              message: string;
            };
          }
        }

        const msg = attRes?.message || "";
        const isAlready =
          msg.toLowerCase().includes("already saved") ||
          msg.toLowerCase().includes("sudah");

        if (isAlready) {
          soundEffects.playWarning();
          setFeedback({
            type: "warning",
            title: "Sudah Check-in",
            message: "Kehadiran Anda sudah tercatat sebelumnya untuk hari ini.",
            user: resolved.user,
          });
        } else {
          soundEffects.playSuccess();
          setFeedback({
            type: "success",
            title: curAction === "out" ? "Sampai Jumpa!" : "Selamat Datang!",
            message:
              curAction === "out"
                ? "Check-out berhasil dicatat."
                : "Check-in berhasil. Selamat menikmati acara!",
            user: resolved.user,
          });
          curOnSuccess?.(resolved, msg || "Check-in berhasil");
        }
      } catch (err) {
        soundEffects.playError();
        setFeedback({
          type: "error",
          title: "Check-in Gagal",
          message: err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
        });
      } finally {
        // Automatically dismiss feedback popup after 2.8 seconds and unlock processing
        feedbackTimeoutRef.current = setTimeout(() => {
          dismissFeedback();
        }, 1800);
      }
    },
    [dismissFeedback],
  );

  const startCamera = useCallback(
    async (targetFacing: "user" | "environment" = facingMode) => {
      await new Promise((r) => setTimeout(r, 200));
      try {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch {
            // ignore
          }
          scannerRef.current.clear();
          scannerRef.current = null;
        }

        const scanner = new Html5Qrcode("kiosk-qr-reader");
        scannerRef.current = scanner;
        setScanning(true);

        await scanner.start(
          { facingMode: targetFacing },
          { fps: 12, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const now = Date.now();
            const last = lastScannedRef.current;
            // Ignore same QR code if scanned within 3.5 seconds cooldown
            if (last && last.code === decodedText && now - last.time < 3500) {
              return;
            }
            lastScannedRef.current = { code: decodedText, time: now };
            void handleProcessQr(decodedText);
          },
          () => { },
        );
      } catch {
        // Fallback to opposite facing mode if primary failed
        const altFacing = targetFacing === "user" ? "environment" : "user";
        try {
          if (scannerRef.current) {
            await scannerRef.current.start(
              { facingMode: altFacing },
              { fps: 12, qrbox: { width: 260, height: 260 } },
              (decodedText) => {
                const now = Date.now();
                const last = lastScannedRef.current;
                if (last && last.code === decodedText && now - last.time < 3500) {
                  return;
                }
                lastScannedRef.current = { code: decodedText, time: now };
                void handleProcessQr(decodedText);
              },
              () => { },
            );
            setFacingMode(altFacing);
          }
        } catch (e) {
          console.error("Kiosk camera start failed:", e);
          setScanning(false);
        }
      }
    },
    [facingMode, handleProcessQr],
  );

  const toggleCameraFacing = useCallback(async () => {
    const nextFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacing);
    await stopCamera();
    await startCamera(nextFacing);
  }, [facingMode, startCamera, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      void startCamera();
    } else {
      void stopCamera();
      dismissFeedback();
    }
    return () => {
      void stopCamera();
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, [isOpen]); // Only run when modal opens/closes!

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 p-6 text-white sm:p-10">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {event.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {mode === "workshop" && workshop
              ? `Lokakarya: ${workshop.title} • `
              : "Gerbang Utama • "}
            {action === "out" ? "Self Check-out" : "Self Check-in Mandiri"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleCameraFacing()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title={`Ganti ke kamera ${facingMode === "user" ? "belakang" : "depan"}`}
          >
            <SwitchCamera className="h-4 w-4" />
            <span className="hidden sm:inline">
              {facingMode === "user" ? "Kamera Belakang" : "Kamera Depan"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              void stopCamera();
              onClose();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Keluar Kiosk</span>
          </button>
        </div>
      </div>

      {/* Main Viewfinder Center */}
      <div className="relative my-auto flex flex-col items-center justify-center">
        <div className="relative w-full max-w-sm">
          {/* Animated Target Frame Corners */}
          <div className="pointer-events-none absolute -inset-2 z-10 rounded-2xl border-2 border-emerald-500/30" />
          <div className="overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 shadow-2xl">
            <div id="kiosk-qr-reader" className="w-full aspect-square" />
          </div>

          {/* Scanner Overlay Line */}
          {scanning && !feedback && (
            <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="h-0.5 w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
            </div>
          )}
        </div>

        {/* Dynamic Instruction */}
        {!feedback && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-slate-200">
              Arahkan QR Code Tiket Anda ke Kamera
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Posisikan QR di tengah kotak pemindai untuk check-in instan otomatis
            </p>
          </div>
        )}

        {/* Floating Greeting & Feedback Card */}
        {feedback && (
          <div
            onClick={dismissFeedback}
            className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center p-4 backdrop-blur-xs"
            title="Klik untuk menutup"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md transition-all animate-in zoom-in-95 duration-200 ${feedback.type === "success"
                  ? "border border-emerald-500/40 bg-emerald-950/95 text-emerald-50"
                  : feedback.type === "warning"
                    ? "border border-amber-500/40 bg-amber-950/95 text-amber-50"
                    : "border border-rose-500/40 bg-rose-950/95 text-rose-50"
                }`}
            >
              <button
                type="button"
                onClick={dismissFeedback}
                className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                ) : feedback.type === "warning" ? (
                  <AlertCircle className="h-10 w-10 text-amber-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-rose-400" />
                )}
              </div>

              <h2 className="text-2xl font-bold tracking-tight">
                {feedback.title}
              </h2>

              {feedback.user && (
                <div className="my-3 flex items-center justify-center gap-3 rounded-xl bg-white/10 p-3 text-left">
                  {feedback.user.photo ? (
                    <Image
                      src={feedback.user.photo}
                      alt={feedback.user.full_name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {feedback.user.full_name}
                    </p>
                    <p className="truncate text-xs opacity-80">
                      {feedback.user.email}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm opacity-90">{feedback.message}</p>

              {/* Auto-dismiss footer */}
              <div className="mt-4 flex items-center justify-between text-[11px] opacity-60">
                <span>Auto-reset dalam 2.8 detik</span>
                <span onClick={dismissFeedback} className="hover:underline cursor-pointer">
                  Ketuk untuk lanjut
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Zero-Touch Self Check-in Kiosk System</span>
        </span>
        <span>Mexpo Event OS</span>
      </div>
    </div>
  );
}
