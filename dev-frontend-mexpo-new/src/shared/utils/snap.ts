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
 * Returns false when the script fails to load (e.g. client key missing).
 */
export function loadSnapScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = SNAP_JS_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Opens the Snap payment popup for a token, firing the right callbacks. */
export function payWithSnap(token: string, handlers: SnapCallbacks): boolean {
  if (!window.snap) return false;
  window.snap.pay(token, handlers);
  return true;
}