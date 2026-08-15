"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";

/**
 * Wraps the `html5-qrcode` camera scanner lifecycle used by the check-in,
 * booth and souvenir counter flows (previously triplicated per page).
 *
 * html5-qrcode requires the container element to exist AND be visible when
 * `start()` runs — React state updates are async, so we wait ~150ms after
 * mounting before initializing (see root AGENTS.md "html5-qrcode gotcha").
 *
 * @param containerId id of the `<div />` that hosts the camera preview.
 */
export function useQrScanner(containerId: string) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Stop + release the camera when the consuming component unmounts.
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
  }, []);

  const stopScan = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore — camera may already be stopped
      }
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScan = useCallback(
    async (onDecoded: (text: string) => void) => {
      setScanning(true);
      await new Promise((resolve) => setTimeout(resolve, 150));
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            // A successful decode stops the camera and hands the payload up.
            setScanning(false);
            void stopScan();
            onDecoded(decodedText);
          },
          () => {},
        );
      } catch (error) {
        setScanning(false);
        // Map browser/library error codes to Indonesian messages so raw
        // English (NotAllowedError / NotFoundError / …) never reaches the user.
        const name =
          error instanceof Error && "name" in error
            ? (error as DOMException).name
            : "";
        let message = "Tidak bisa mengakses kamera.";
        if (name === "NotAllowedError") {
          message = "Izin kamera ditolak. Izinkan akses kamera di browser Anda, lalu coba lagi.";
        } else if (name === "NotFoundError") {
          message = "Kamera tidak ditemukan. Pastikan perangkat Anda memiliki kamera.";
        } else if (name === "NotReadableError") {
          message = "Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain, lalu coba lagi.";
        } else if (name === "NotSupportedError") {
          message = "Browser atau perangkat Anda tidak mendukung pemindaian kamera.";
        }
        console.error("QR scanner error:", error);
        toast.error(message);
      }
    },
    [containerId, stopScan],
  );

  return { scanning, startScan, stopScan };
}