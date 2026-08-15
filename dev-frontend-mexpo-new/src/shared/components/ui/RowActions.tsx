import { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type RowActionTone = "neutral" | "danger";

export interface RowActionItem {
  key: string;
  icon: ReactNode;
  /** Tooltip text (title attribute). */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: RowActionTone;
}

interface RowActionsProps {
  actions: RowActionItem[];
  /** Disables every action while a mutation is in flight. */
  busy?: boolean;
  className?: string;
}

/** Edit/delete (and extra) icon-button row — replaces the per-file copies. */
export default function RowActions({ actions, busy = false, className }: RowActionsProps) {
  return (
    <div className={cn("flex items-center gap-1.5 shrink-0", className)}>
      {actions.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={a.onClick}
          disabled={busy || a.disabled}
          title={a.label}
          className={cn(
            "p-2 rounded-lg text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            a.tone === "danger"
              ? "hover:bg-red-50 hover:text-red-600"
              : "hover:bg-gray-100 hover:text-gray-700",
          )}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}

/** Convenience factory — standard "Ubah" (edit) action. */
export function editAction(onEdit: () => void, disabled?: boolean): RowActionItem {
  return {
    key: "edit",
    icon: <Pencil className="h-4 w-4" />,
    label: "Ubah",
    onClick: onEdit,
    disabled,
  };
}

/** Convenience factory — standard "Hapus" (delete) action. */
export function deleteAction(onDelete: () => void, disabled?: boolean): RowActionItem {
  return {
    key: "delete",
    icon: <Trash2 className="h-4 w-4" />,
    label: "Hapus",
    tone: "danger",
    onClick: onDelete,
    disabled,
  };
}