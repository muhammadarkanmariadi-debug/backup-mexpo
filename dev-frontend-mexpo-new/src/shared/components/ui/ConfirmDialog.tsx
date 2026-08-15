"use client";

import { ReactNode, useCallback, useState } from "react";
import { Modal } from "./Modal";
import Button from "@/shared/components/button/Button";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "danger" | "primary";
}

interface ConfirmState {
  options: ConfirmOptions;
  resolve: (ok: boolean) => void;
}

interface ConfirmDialogProps extends ConfirmOptions {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Presentational confirm dialog — pair with `useConfirm` or drive manually. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} maxWidth="max-w-sm">
      <p className="text-sm leading-relaxed text-gray-600">{message}</p>
      <div className="flex justify-end gap-2 pt-6">
        <Button size="xs" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button size="xs" variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

const DEFAULT_OPTIONS: ConfirmOptions = {
  title: "Konfirmasi",
  message: "Yakin ingin melanjutkan?",
  confirmLabel: "Ya, Lanjutkan",
  cancelLabel: "Batal",
  tone: "danger",
};

/**
 * Async replacement for the native `confirm()`:
 *
 *   const { confirm, dialogs } = useConfirm();
 *   const ok = await confirm("Hapus data ini?");
 *   if (!ok) return;
 *
 * Render `{dialogs}` once in the component's JSX.
 */
export function useConfirm() {
  const [pending, setPending] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string, options?: Partial<ConfirmOptions>) => {
    return new Promise<boolean>((resolve) => {
      setPending({
        options: { ...DEFAULT_OPTIONS, message, ...options },
        resolve,
      });
    });
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  const dialogs: ReactNode = pending ? (
    <ConfirmDialog
      isOpen
      {...pending.options}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, dialogs };
}