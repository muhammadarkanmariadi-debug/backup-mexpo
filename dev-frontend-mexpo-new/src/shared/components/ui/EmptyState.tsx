import { cn } from "@/shared/utils/cn";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

/** Shared empty-state block — replaces the many hand-rolled `py-* text-gray-*` placeholders in list pages. */
export default function EmptyState({ title, subtitle, icon: Icon, className }: EmptyStateProps) {
  return (
    <div className={cn("py-16 text-center", className)}>
      {Icon && (
        <Icon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
      )}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}