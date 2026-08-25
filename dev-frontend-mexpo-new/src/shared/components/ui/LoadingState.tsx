import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./Skeleton";

interface LoadingStateProps {
  type?: "spinner" | "skeleton-list" | "skeleton-card" | "skeleton-table";
  count?: number;
  className?: string;
}

export default function LoadingState({
  type = "spinner",
  count = 3,
  className = "",
}: LoadingStateProps) {
  if (type === "spinner") {
    return (
      <div className={`flex justify-center py-12 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (type === "skeleton-list") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "skeleton-card") {
    return (
      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4"
          >
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-2 flex items-center justify-between">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "skeleton-table") {
    return (
      <div className={`overflow-hidden rounded-xl border border-gray-100 bg-white ${className}`}>
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
