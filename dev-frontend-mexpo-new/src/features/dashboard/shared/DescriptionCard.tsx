import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface DescriptionCardProps {
  /** Event description (or any long-form text). */
  text: ReactNode;
  className?: string;
}

/** Shared "Deskripsi" card used by every role overview (owner/committee/tenant/visitor). */
export default function DescriptionCard({ text, className }: DescriptionCardProps) {
  return (
    <div className={cn("bg-white p-5 border border-gray-100 rounded-xl", className)}>
      <p className="mb-2 text-gray-400 text-xs uppercase tracking-wider">Deskripsi</p>
      <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
    </div>
  );
}