"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

export interface SortOption {
  key: string;
  label: string;
}

interface Props {
  options: SortOption[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onChange: (field: string, dir: "asc" | "desc") => void;
  /** Label shown when no sort is active. */
  defaultLabel?: string;
}

/** Dropdown sort control for server-backed lists (pairs with useList). */
export default function SortMenu({
  options,
  sortBy,
  sortDir,
  onChange,
  defaultLabel = "Urutkan",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = options.find((o) => o.key === sortBy);

  const handleSelect = (key: string) => {
    if (sortBy === key) {
      // Already active → toggle direction.
      onChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onChange(key, "asc");
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="whitespace-nowrap">
          {active
            ? `${active.label} ${sortDir === "asc" ? "↑" : "↓"}`
            : defaultLabel}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleSelect(opt.key)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                sortBy === opt.key
                  ? "font-semibold text-secondary"
                  : "text-gray-600"
              }`}
            >
              {opt.label}
              {sortBy === opt.key && (
                <span className="text-[11px] text-gray-400">
                  {sortDir === "asc" ? "↑" : "↓"}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}