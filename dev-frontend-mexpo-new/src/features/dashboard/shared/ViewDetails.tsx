import { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export interface ViewDetailRow {
  label: string;
  value: ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

interface ViewDetailsProps {
  items: ViewDetailRow[];
  className?: string;
}

export default function ViewDetails({ items, className }: ViewDetailsProps) {
  return (
    <div className={cn("bg-white border border-gray-100 rounded-xl divide-y divide-gray-100", className)}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="flex items-center gap-3 px-5 py-3.5">
            <Icon className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="w-32 text-gray-400 text-xs shrink-0">{item.label}</span>
            <span className="font-medium text-gray-800 text-sm">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
