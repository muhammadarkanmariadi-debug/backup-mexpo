"use client";

import { MIDTRANS_CLIENT_KEY, MIDTRANS_IS_PRODUCTION } from "@/global";

export interface SnapCallbacks {
  onSuccess?: (result?: unknown) => void;
  onPending?: (result?: unknown) => void;
  onClose?: () => void;
  onError?: (result?: unknown) => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        handlers?: {
          onSuccess?: (result?: unknown) => void;
          onPending?: (result?: unknown) => void;
          onClose?: () => void;
          onError?: (result?: unknown) => void;
        },
      ) => void;
    };
  }
}

const SNAP_JS_URL = MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

/**
 * Injects Midtrans snap.js (once) and resolves when it is ready.
 * Returns false when the script fails to load or window.snap is unavailable.
 */
export function loadSnapScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.snap) {
      resolve(true);
      return;
    }

    let script = document.getElementById("midtrans-snap-script") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "midtrans-snap-script";
      script.src = SNAP_JS_URL;
      if (MIDTRANS_CLIENT_KEY) {
        script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
      }
      script.async = true;
      document.body.appendChild(script);
    }

    // Active poll for window.snap (up to 5 seconds)
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.snap) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - startTime > 5000) {
        clearInterval(interval);
        resolve(Boolean(window.snap));
      }
    }, 100);
  });
}

/** Opens the Snap payment popup for a token, firing the right callbacks. */
export function payWithSnap(token: string, handlers: SnapCallbacks): boolean {
  if (typeof window === "undefined" || !window.snap) {
    console.warn("Midtrans snap is not initialized on window");
    return false;
  }
  try {
    window.snap.pay(token, handlers);
    return true;
  } catch (err) {
    console.error("Midtrans payWithSnap error:", err);
    return false;
  }
}