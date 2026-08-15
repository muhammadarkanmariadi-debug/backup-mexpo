import { ReactNode } from "react";
import { Save, X } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface FormActionsProps {
  onCancel: () => void;
  /** Pending state — submit button shows a spinner and is disabled. */
  busy?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  submitIcon?: ReactNode;
  cancelIcon?: ReactNode;
  className?: string;
}

/**
 * Submit/Cancel button pair for forms — replaces the repeated pairs across
 * managers. Submit renders a plain `<button type="submit">` so it works inside
 * `<form onSubmit={…}>`.
 */
export default function FormActions({
  onCancel,
  busy = false,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  submitDisabled = false,
  submitIcon,
  cancelIcon,
  className,
}: FormActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 pt-2", className)}>
      <button
        type="submit"
        disabled={busy || submitDisabled}
        className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold text-white text-xs transition-colors"
      >
        {busy ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          (submitIcon ?? <Save className="h-3.5 w-3.5" />)
        )}
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 hover:bg-gray-100 px-3 py-2 rounded-lg font-semibold text-gray-500 text-xs transition-colors"
      >
        {cancelIcon ?? <X className="h-3.5 w-3.5" />}
        {cancelLabel}
      </button>
    </div>
  );
}