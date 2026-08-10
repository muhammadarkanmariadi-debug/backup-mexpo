"use server";

import { BASE_API_URL } from "@/global";
import { resolveAuthHeader } from "./auth-token";
import { setCookies } from "./cookies";
import { buildFetchMeta, FetchMeta } from "./http-meta";

// ── Types ─────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResponse = {
  status: boolean;
  message?: string | null;
  data?: unknown | null;
  token?: string | null;
  meta?: unknown | null;
  code: number | 400 | 401 | 403 | 404 | 500 | 503;
};

type RequestOptions = {
  credential?: string;
  payload?: string | FormData;
  query?: Record<string, string>;
  meta?: FetchMeta;
};

// ── Internal helpers ──────────────────────────────────────────

const resolveBody = async (
  payload?: string | FormData
): Promise<BodyInit | null> => {
  if (!payload) return null;
  // Plain JSON string or FormData — sent as-is. The previous AES
  // encrypt/decrypt round-trip ran entirely server-side and corrupted
  // non-ASCII (Indonesian) characters → malformed UTF-8 responses (FIX).
  return payload;
};

const resolveHeaders = async (
  credential?: string,
  payload?: string | FormData
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    Authorization: await resolveAuthHeader(credential),
  };
  if (typeof payload === "string") {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

const resolveQuery = (query?: Record<string, string>): string => {
  if (!query || Object.keys(query).length === 0) return "";
  return `?${new URLSearchParams(query).toString()}`;
};

// ── Core request ──────────────────────────────────────────────

export const httpRequest = async <T = Record<string, never>>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse> => {
  const { credential, payload, query, meta } = options;

  try {
    // ✅ Query di-serialize dengan benar
    const url = `${BASE_API_URL}/${endpoint}${resolveQuery(query)}`;
    const headers = await resolveHeaders(credential, payload);
    const fetchMeta = buildFetchMeta(meta);

    const response = await fetch(url, {
      method,
      headers,
      body: await resolveBody(payload),
      credentials: "include",
      ...fetchMeta,
    });

    // Read as binary + decode leniently (fatal:false) so invalid UTF-8 bytes
    // become U+FFFD instead of throwing "Malformed UTF-8 data". This also
    // survives HTML/error bodies that are not JSON.
    const buffer = await response.arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);

    let data: Record<string, unknown> | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // Non-JSON body (e.g. proxy/HTML error page) — surface a clean error.
        return {
          status: false,
          message: `Invalid response from server (HTTP ${response.status}). Expected JSON.`,
          data: null,
          code: response.status,
        };
      }
    }

    if (!response.ok) {
      return {
        status: false,
        message:
          (data?.message as string | undefined) ??
          `Request failed: ${response.status}`,
        data,
        code: response.status,
      };
    }

    return {
      status: (data?.success as boolean | undefined) ?? true,
      message: (data?.message as string | null | undefined) ?? null,
      token: (data?.token as string | null | undefined) ?? null,
      data: (data?.data as T | null | undefined) ?? null,
      meta: (data?.meta as unknown | null | undefined) ?? null,
      code: (data?.status as number | undefined) ?? response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { status: false, message, data: null, code: 500 };
  }
};

// ── Login khusus: simpan token ke cookie ──────────────────────

export const httpLogin = async <T extends { token: string | null }>(
  endpoint: string,
  payload: string | FormData,
  credential?: string
): Promise<ApiResponse> => {
  const result = await httpRequest<T>("POST", endpoint, {
    credential,
    payload,
    meta: { cache: "no-store" },
  });

  if (result.status && result.token) {
    await setCookies("token", result.token);
  }

  return result;
};

// ── Shorthand helpers ─────────────────────────────────────────

export const httpGet = async <T = Record<string, never>>(
  endpoint: string,
  credential?: string,
  meta?: FetchMeta,
  query?: Record<string, string>
) => httpRequest<T>("GET", endpoint, { credential, meta, query });


export const httpPost = async <T = Record<string, never>>(
  endpoint: string,
  payload: string | FormData,
  credential?: string,
  query?: Record<string, string>
) =>
  httpRequest<T>("POST", endpoint, {
    credential,
    payload,
    query,
    meta: { cache: "no-store" },
  });

export const httpPut = async <T = Record<string, never>>(
  endpoint: string,
  payload: string | FormData,
  credential?: string,
  query?: Record<string, string>
) =>
  httpRequest<T>("PUT", endpoint, {
    credential,
    payload,
    query,
    meta: { cache: "no-store" },
  });

export const httpDelete = async <T = Record<string, never>>(
  endpoint: string,
  credential?: string,
  query?: Record<string, string>
) =>
  httpRequest<T>("DELETE", endpoint, {
    credential,
    query,
    meta: { cache: "no-store" },
  });