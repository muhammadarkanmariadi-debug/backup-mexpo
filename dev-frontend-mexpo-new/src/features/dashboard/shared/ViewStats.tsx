"use client";

import { cn } from "@/shared/utils/cn";

export interface ViewStatsProps {
  items: {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  className?: string;
}

export default function ViewStats({ items, className }: ViewStatsProps) {
  return (
    <div className={cn("gap-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-8", className)}>
      {items.map(({ label, value, icon: Icon }) => (
        <div key={label} className="bg-gray-50 p-4 rounded-xl">
          <p className="flex items-center gap-1.5 mb-1 text-gray-500 text-xs">
            <Icon className="w-3.5 h-3.5" /> {label}
          </p>
          <p className="font-semibold text-gray-900 text-2xl">{value}</p>
        </div>
      ))}
    </div>
  );
}
