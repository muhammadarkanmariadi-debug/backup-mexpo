"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface SearchableSelectOption {
  value: string;
  label: string;
  /** Secondary line, e.g. booth number — shown in the dropdown only. */
  hint?: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  label?: string;
  /** Start with the dropdown expanded (default: collapsed). */
  defaultOpen?: boolean;
  /** Close the panel after picking an option (default: true). */
  closeOnSelect?: boolean;
}

/**
 * Native-combobox styled select with an inline search box for long option lists.
 *
 * Collapsed by default → clicking the trigger expands an inlined panel with a
 * search input + filterable options. Closes on select, Escape, or outside click.
 * The expanded list stays *inline* (below the trigger) rather than absolutely
 * positioned so it is never clipped inside modal bodies (e.g. `overflow-y-auto`).
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  emptyText = "Tidak ada pilihan yang cocok.",
  className = "",
  label,
  defaultOpen = false,
  closeOnSelect = true,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.hint ?? "").toLowerCase().includes(q),
    );
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  // Close when the user clicks outside the widget.
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      setOpen(false);
      (e.target as HTMLElement).blur();
    }
  };

  const handleSelect = (o: SearchableSelectOption) => {
    onChange(o.value);
    setQuery("");
    if (closeOnSelect) setOpen(false);
  };

  return (
    <div className={className} ref={wrapperRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* ── Trigger / search input ── */}
      <div className="relative">
        {open && (
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        )}
        {open ? (
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={selected ? selected.label : placeholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            className="h-11 w-full rounded-lg border border-brand-400 bg-white pl-9 pr-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={options.length === 0}
            aria-expanded="false"
            aria-haspopup="listbox"
            className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="truncate text-left">
              {selected ? selected.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
          </button>
        )}
      </div>

      {/* ── Inline options panel ── */}
      {open &&
        (filtered.length > 0 ? (
          <div
            id={listboxId}
            role="listbox"
            className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white"
          >
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => handleSelect(o)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                  o.value === value
                    ? "bg-brand-50 font-medium text-secondary"
                    : "text-gray-700"
                }`}
              >
                <span>{o.label}</span>
                {o.hint && (
                  <span className="ml-2 text-xs text-gray-400">{o.hint}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-1 px-1 text-xs text-gray-400">{emptyText}</p>
        ))}
    </div>
  );
}