import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

interface SectionTitleProps {
  title: string;
  /** Right-aligned action (button/link), e.g. "Tambah Tiket". */
  action?: ReactNode;
  className?: string;
}

/** Shared section header used by list managers (EventManager, RegistrationManager, ReportsPage, …). */
export default function SectionTitle({ title, action, className }: SectionTitleProps) {
  return (
    <div className={cn("flex justify-between items-center mb-4", className)}>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}