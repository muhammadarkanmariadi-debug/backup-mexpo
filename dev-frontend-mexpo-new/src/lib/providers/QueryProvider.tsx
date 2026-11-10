"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query-client";

/**
 * Client-side provider for TanStack Query. Mounted once at the root layout so
 * every client component can use useApiQuery / useApiMutation / useQuery.
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lazy state: one client per server render, the shared one in the browser.
  const [queryClient] = useState(getQueryClient);
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
