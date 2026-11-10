"use client";

import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * Global TanStack Query client for the Mexpo frontend.
 *
 * Freshness policy (per product decision):
 *  - staleTime: 0 — data is ALWAYS considered stale, so a mount / window focus
 *    refetches it. Server data is never served from a stale client cache.
 *  - refetchOnWindowFocus: true — refetch when the user returns to the tab.
 *  - retry: 1 — a single retry for transient failures (server RPC is cheap).
 *  - gcTime: 5 min — keep results in memory for back/forward navigation reuse.
 *
 * Mutation invalidation is the other half of the freshness policy: after a
 * create/update/delete, `queryClient.invalidateQueries({ queryKey })` is called
 * (see src/lib/hooks/useApi.ts) so affected lists refetch immediately.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        refetchOnWindowFocus: true,
        retry: 1,
        gcTime: 5 * 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * The server gets a fresh client per render: a module-level client would be
 * shared by every SSR request, so one visitor's cached data would be rendered
 * for the next (and `initialData` ignored → hydration mismatches). The browser
 * keeps a single client for the whole session.
 */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
