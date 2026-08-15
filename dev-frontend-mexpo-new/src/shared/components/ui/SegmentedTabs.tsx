"use client";

import { cn } from "@/shared/utils/cn";

export interface SegmentedTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType;
}

interface SegmentedTabsProps<T extends string> {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Shared segmented control — one visual language for mode/tab switchers across the app. */
export default function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-secondary text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}