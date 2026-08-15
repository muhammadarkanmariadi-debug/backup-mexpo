"use client";

import { useApiMutation } from "@/lib/hooks/useApi";
import { resolveQr, ResolvedQr } from "@/services/qr.service";

interface UseResolveQrOptions {
  onSuccess?: (data: ResolvedQr, variables: string) => void;
  onError?: (error: unknown, variables: string) => void;
}

/**
 * QR code → participant identity resolution as a TanStack mutation
 * (see `docs/TANSTACK-QUERY.md`). `resolveQr` previously ran imperatively
 * with hand-rolled `searching/checking` state on every page that needed it.
 *
 * Usage:
 *   const resolve = useResolveQr();
 *   resolve.mutate(code);          // resolve.isPending for busy state
 *   resolve.data / onSuccess?.()   // data: ResolvedQr
 */
export function useResolveQr(options: UseResolveQrOptions = {}) {
  return useApiMutation<ResolvedQr, string>(
    (code) => resolveQr(code),
    options,
  );
}