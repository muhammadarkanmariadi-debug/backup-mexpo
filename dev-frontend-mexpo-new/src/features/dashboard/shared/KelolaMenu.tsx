"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Settings2 } from "lucide-react";

export interface KelolaItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface Props {
  items: KelolaItem[];
  /** Optional extra node rendered at the bottom of the dropdown (e.g. a button). */
  extra?: React.ReactNode;
}

/** "Kelola" dropdown used on the owner/committee event views. */
export default function KelolaMenu({ items, extra }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 hover:bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-lg font-medium text-gray-500 hover:text-gray-800 text-xs transition-colors"
      >
        <Settings2 className="w-3.5 h-3.5" /> Kelola
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="top-full right-0 z-30 absolute bg-white shadow-lg mt-1 py-1 border border-gray-200 rounded-xl w-56">
          {items.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 hover:bg-gray-50 px-3 py-2 text-gray-600 text-sm"
            >
              <Icon className="w-4 h-4 text-gray-400" /> {label}
            </Link>
          ))}
          {extra && <div className="mt-1 pt-1 border-gray-100 border-t">{extra}</div>}
        </div>
      )}
    </div>
  );
}
