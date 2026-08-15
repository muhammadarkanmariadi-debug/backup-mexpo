"use client";

import { useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";

/**
 * TanStack Query adapters for the Mexpo service layer.
 *
 * Services in src/services/* return `{ data, status, message, meta }` and do
 * NOT throw on failure (they return `status: false`). These hooks normalize
 * that contract so `error` / `isError` / `retry` behave like standard
 * React Query — a failed service response becomes a thrown ApiError.
 */

export class ApiError extends Error {
  readonly code: number;
  constructor(message: string, code = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

/** Shape returned by (almost) every service function in src/services. */
export interface ApiResult<T> {
  data: T;
  status: boolean;
  message?: string | null;
  code?: number;
  meta?: unknown;
}

/** Normalize a service result → data or throw ApiError. */
export function unwrap<T>(res: ApiResult<T>): T {
  if (!res.status) {
    throw new ApiError(res.message ?? "Permintaan gagal", res.code ?? 500);
  }
  return res.data;
}

interface UseApiQueryOptions<T>
  extends Omit<
    UseQueryOptions<T, ApiError>,
    "queryKey" | "queryFn" | "initialData"
  > {
  /** Only run the query when true (default true). */
  enabled?: boolean;
  /** Called with the resolved data after a successful fetch. */
  onSuccess?: (data: T) => void;
}

/**
 * useApiQuery — server-backed query with unified error handling.
 *
 * @example
 *   const { data, isLoading, isError, error } = useApiQuery(
 *     keys.events.my(query),
 *     () => getMyEvents(query),
 *   );
 */
export function useApiQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<ApiResult<T> | T>,
  options?: UseApiQueryOptions<T>,
) {
  const { onSuccess, ...queryOptions } = options ?? {};
  const result = useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      const res = await fetcher();
      // Support services that return the raw payload (e.g. getProfile).
      if (res && typeof res === "object" && "status" in res) {
        return unwrap(res as unknown as ApiResult<T>);
      }
      return res as T;
    },
    ...queryOptions,
  });

  // TanStack v5 removed onSuccess from useQuery — apply it via effect.
  useEffect(() => {
    if (result.isSuccess && result.data !== undefined) {
      onSuccess?.(result.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.isSuccess, result.data]);

  return result;
}

interface UseApiMutationOptions<TData, TVariables> {
  /** Query keys to invalidate on success (triggers refetch). */
  invalidate?: QueryKey[];
  /** Keys to remove from cache on success (e.g. detail pages). */
  remove?: QueryKey[];
  /** Runs after invalidate/remove, before any toast logic. */
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
  /** Toast message shown on success. Omit to skip the toast. */
  successMessage?: string;
  /** Toast message shown on error. Omit to skip the toast. */
  errorMessage?: string;
  /** Optional toast instance (sonner) — passed by callers that already import it. */
  notify?: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

/**
 * useApiMutation — mutation with automatic cache invalidation.
 *
 * @example
 *   const approve = useApiMutation(
 *     (uuid: string) => approveEvent(uuid, { approved: true }),
 *     { invalidate: [keys.events.approvalQueue(listQuery)], successMessage: "Disetujui" },
 *   );
 *   approve.mutate(event.uuid); // approve.isPending for busy state
 */
export function useApiMutation<TData = unknown, TVariables = void>(
  fn: (variables: TVariables) => Promise<ApiResult<TData> | TData>,
  options: UseApiMutationOptions<TData, TVariables> = {},
) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn: async (variables) => {
      const res = await fn(variables);
      // Support services that return the raw payload.
      if (res && typeof res === "object" && "status" in res) {
        return unwrap(res as unknown as ApiResult<TData>);
      }
      return res as TData;
    },
    onSuccess: (data, variables) => {
      if (options.invalidate?.length) {
        options.invalidate.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
      if (options.remove?.length) {
        options.remove.forEach((key) => queryClient.removeQueries({ queryKey: key }));
      }
      if (options.successMessage && options.notify) {
        options.notify.success(options.successMessage);
      }
      options.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      if (options.errorMessage && options.notify) {
        const msg =
          error instanceof ApiError && error.message
            ? error.message
            : options.errorMessage;
        options.notify.error(msg);
      }
      options.onError?.(error, variables);
    },
  });
}
