"use client";

import { GOOGLE_CLIENT_ID } from "@/global";

interface GoogleIdCallback {
  credential: string;
  client_id: string;
  select_by: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleIdCallback) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options?: Record<string, unknown>,
          ) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";

let scriptPromise: Promise<boolean> | null = null;

/**
 * Injects the Google Identity Services script (once) and resolves when ready.
 * Returns false when the client id is missing or the script fails to load.
 */
export function loadGoogleIdentityScript(): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) return Promise.resolve(false);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Initializes GIS and renders the standard "Continue with Google" button into
 * the given element. The callback receives the verified-on-server id_token.
 */
export function renderGoogleButton(
  element: HTMLElement | null,
  onCredential: (credential: string) => void,
): void {
  if (!element || !GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (response.credential) onCredential(response.credential);
    },
  });
  window.google.accounts.id.renderButton(element, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rectangular",
    width: Math.max(element.clientWidth > 0 ? element.clientWidth : 0, 240),
  });
}