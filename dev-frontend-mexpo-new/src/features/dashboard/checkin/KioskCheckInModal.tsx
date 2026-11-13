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
  const feedbackRef = useRef<ScanFeedback | null>(null);
  feedbackRef.current = feedback;

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
        // Automatically dismiss feedback popup after 2.5 seconds and unlock processing
        feedbackTimeoutRef.current = setTimeout(() => {
          dismissFeedback();
        }, 2500);
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

        const onFrameDecoded = (decodedText: string) => {
          // Do not process new scans while previous feedback popup is still visible
          if (isProcessingRef.current || feedbackRef.current !== null) {
            return;
          }
          const now = Date.now();
          const last = lastScannedRef.current;
          // Prevent re-scanning the same badge within 8 seconds
          if (last && last.code === decodedText && now - last.time < 8000) {
            return;
          }
          lastScannedRef.current = { code: decodedText, time: now };
          void handleProcessQr(decodedText);
        };

        await scanner.start(
          { facingMode: targetFacing },
          { fps: 12, qrbox: { width: 260, height: 260 } },
          onFrameDecoded,
          () => { },
        );
      } catch {
        // Fallback to opposite facing mode if primary failed
        const altFacing = targetFacing === "user" ? "environment" : "user";
        try {
          if (scannerRef.current) {
            const onFrameDecodedFallback = (decodedText: string) => {
              if (isProcessingRef.current || feedbackRef.current !== null) {
                return;
              }
              const now = Date.now();
              const last = lastScannedRef.current;
              if (last && last.code === decodedText && now - last.time < 8000) {
                return;
              }
              lastScannedRef.current = { code: decodedText, time: now };
              void handleProcessQr(decodedText);
            };

            await scannerRef.current.start(
              { facingMode: altFacing },
              { fps: 12, qrbox: { width: 260, height: 260 } },
              onFrameDecodedFallback,
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
    <div className="fixed inset-0 z-[1200] flex flex-col justify-between bg-gray-950 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(60,133,243,0.18),rgba(12,17,29,1))] p-4 sm:p-8 text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400 shadow-xs">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              <h1 className="text-base sm:text-xl font-bold font-outfit tracking-tight text-white line-clamp-1">
                {event.name}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-gray-400 font-jakarta">
              {mode === "workshop" && workshop
                ? `Lokakarya: ${workshop.title} • `
                : "Gerbang Utama • "}
              <span className="text-brand-400 font-medium">
                {action === "out" ? "Self Check-out" : "Self Check-in Mandiri"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void toggleCameraFacing()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/90 px-3 py-2 text-xs sm:text-sm font-medium text-gray-300 transition-all hover:bg-gray-800 hover:border-gray-700 hover:text-white shadow-xs"
            title={`Ganti ke kamera ${facingMode === "user" ? "belakang" : "depan"}`}
          >
            <SwitchCamera className="h-4 w-4 text-brand-400" />
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
            className="flex items-center gap-1.5 rounded-xl border border-gray-800 bg-gray-900/90 px-3.5 py-2 text-xs sm:text-sm font-medium text-gray-300 transition-all hover:bg-gray-800 hover:border-gray-700 hover:text-white shadow-xs"
          >
            <Minimize2 className="h-4 w-4" />
            <span>Keluar Kiosk</span>
          </button>
        </div>
      </div>

      {/* Main Viewfinder Center */}
      <div className="relative my-auto flex flex-col items-center justify-center py-2">
        <div className="relative w-full max-w-[270px] sm:max-w-sm">
          {/* Animated Target Frame Corners - Mexpo Brand Accents */}
          <div className="pointer-events-none absolute -inset-2.5 z-10 rounded-2xl border-2 border-brand-500/40 shadow-[0_0_25px_rgba(60,133,243,0.2)]" />
          
          {/* Corner brackets */}
          <div className="pointer-events-none absolute -top-3 -left-3 z-15 h-5 w-5 border-t-2 border-l-2 border-brand-400 rounded-tl-lg" />
          <div className="pointer-events-none absolute -top-3 -right-3 z-15 h-5 w-5 border-t-2 border-r-2 border-brand-400 rounded-tr-lg" />
          <div className="pointer-events-none absolute -bottom-3 -left-3 z-15 h-5 w-5 border-b-2 border-l-2 border-brand-400 rounded-bl-lg" />
          <div className="pointer-events-none absolute -bottom-3 -right-3 z-15 h-5 w-5 border-b-2 border-r-2 border-brand-400 rounded-br-lg" />

          <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/90 shadow-2xl">
            <div id="kiosk-qr-reader" className="w-full aspect-square" />
          </div>

          {/* Scanner Overlay Laser Line */}
          {scanning && !feedback && (
            <div className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="h-0.5 w-full bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_12px_rgba(60,133,243,0.8)] animate-pulse" />
            </div>
          )}
        </div>

        {/* Dynamic Instruction */}
        {!feedback && (
          <div className="mt-5 text-center px-4">
            <p className="text-base sm:text-lg font-bold font-outfit text-gray-100">
              Arahkan QR Code Tiket Anda ke Kamera
            </p>
            <p className="mt-1 text-xs sm:text-sm text-gray-400 font-jakarta max-w-xs sm:max-w-md mx-auto">
              Posisikan QR di tengah kotak pemindai untuk presensi mandiri instan
            </p>
          </div>
        )}

        {/* Floating Greeting & Feedback Card */}
        {feedback && (
          <div
            onClick={dismissFeedback}
            className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center p-4 backdrop-blur-xs"
            title="Ketuk untuk menutup"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-md rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md transition-all animate-in zoom-in-95 duration-200 ${feedback.type === "success"
                ? "border border-success-500/40 bg-gradient-to-b from-success-950/95 via-gray-950/95 to-gray-950/95 text-white shadow-[0_0_35px_rgba(18,183,106,0.25)]"
                : feedback.type === "warning"
                  ? "border border-warning-500/40 bg-gradient-to-b from-warning-950/95 via-gray-950/95 to-gray-950/95 text-white shadow-[0_0_35px_rgba(247,144,9,0.25)]"
                  : "border border-error-500/40 bg-gradient-to-b from-error-950/95 via-gray-950/95 to-gray-950/95 text-white shadow-[0_0_35px_rgba(240,68,56,0.25)]"
                }`}
            >
              <button
                type="button"
                onClick={dismissFeedback}
                className="absolute right-3.5 top-3.5 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border ${
                  feedback.type === "success"
                    ? "bg-success-500/15 border-success-500/30 text-success-400"
                    : feedback.type === "warning"
                      ? "bg-warning-500/15 border-warning-500/30 text-warning-400"
                      : "bg-error-500/15 border-error-500/30 text-error-400"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-9 w-9" />
                ) : feedback.type === "warning" ? (
                  <AlertCircle className="h-9 w-9" />
                ) : (
                  <XCircle className="h-9 w-9" />
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-outfit tracking-tight">
                {feedback.title}
              </h2>

              {feedback.user && (
                <div className="my-3.5 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left backdrop-blur-xs">
                  {feedback.user.photo ? (
                    <Image
                      src={feedback.user.photo}
                      alt={feedback.user.full_name}
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-500/40"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 ring-2 ring-brand-500/30">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold font-outfit text-white text-sm sm:text-base">
                      {feedback.user.full_name}
                    </p>
                    <p className="truncate text-xs text-gray-300 font-jakarta">
                      {feedback.user.email}
                    </p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-200 font-jakarta opacity-90">{feedback.message}</p>

              {/* Auto-dismiss footer */}
              <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400 font-jakarta border-t border-white/10 pt-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
                  Auto-reset dalam 2.5 detik
                </span>
                <span
                  onClick={dismissFeedback}
                  className="text-gray-300 hover:text-white underline cursor-pointer transition-colors"
                >
                  Ketuk untuk lanjut
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between border-t border-gray-800/80 pt-3 text-xs text-gray-400 font-jakarta shrink-0">
        <span className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          <span>Zero-Touch Self Check-in Kiosk System</span>
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="text-brand-400 font-bold font-outfit">Mexpo</span>
          <span className="text-gray-400">Event OS</span>
        </span>
      </div>
    </div>
  );
}
