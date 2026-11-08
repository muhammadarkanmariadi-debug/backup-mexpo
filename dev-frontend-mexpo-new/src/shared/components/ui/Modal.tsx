"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleKeyDown);
      };
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // z-[1100]: must sit above the dashboard shell (fixed, z-[1000]). With the old
    // z-[100], dialogs rendered next to the shell (e.g. the publish/delete
    // confirmations in OwnerView) opened behind it and could not be clicked.
    <div className="z-[1100] fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] text-gray-900 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-outfit">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[75vh]">
          {children}
        </div>
      </div>
    </div>
  );
}
