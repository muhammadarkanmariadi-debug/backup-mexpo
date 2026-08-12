"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

/**
 * Client-side provider for TanStack Query. Mounted once at the root layout so
 * every client component can use useApiQuery / useApiMutation / useQuery.
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
