import { cn } from "@/shared/utils/cn";

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  bordered?: boolean;
}

/** Shared empty-state block — replaces the many hand-rolled `py-* text-gray-*` placeholders in list pages. */
export default function EmptyState({ title, subtitle, icon: Icon, className, bordered = true }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "py-16 text-center",
        bordered && "bg-white border border-gray-100 rounded-xl",
        className
      )}
    >
      {Icon && <Icon className="mx-auto mb-3 h-10 w-10 text-gray-300" />}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}