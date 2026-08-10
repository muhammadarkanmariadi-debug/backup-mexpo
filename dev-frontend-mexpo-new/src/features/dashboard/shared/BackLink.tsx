"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  href: string;
  label?: string;
}

/** Shared back button for dashboard sub-pages. */
export default function BackLink({ href, label = "Kembali" }: Props) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}