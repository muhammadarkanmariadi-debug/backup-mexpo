"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Circle as CircleIcon,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Lock,
  QrCode,
  Square,
  Type,
  Unlock,
  Shapes,
} from "lucide-react";

import type { CertificateTemplateEnvelope } from "@/entities/event/certificate-template.entity";
import {
  LayerKind,
  LayerRow,
  listLayerRows,
  MoveAction,
  moveLayer,
  patchLayerAttrs,
  reorderLayer,
} from "./layers";

const KIND_ICON: Record<LayerKind, React.ComponentType<{ className?: string }>> = {
  text: Type,
  rect: Square,
  shape: CircleIcon,
  image: ImageIcon,
  qr: QrCode,
  other: Shapes,
};

interface LayersPanelProps {
  template: CertificateTemplateEnvelope;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Receives the next template envelope after any layer change. */
  onChange: (next: CertificateTemplateEnvelope) => void;
}

/**
 * Layers panel: lists every element front-most first so it is obvious what
 * stacks on top of what, and lets the user reorder (drag or buttons), hide,
 * lock and rename elements. Shared by the certificate and badge designers.
 */
export function LayersPanel({ template, selectedId, onSelect, onChange }: LayersPanelProps) {
  const rows = listLayerRows(template);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<{ id: string; place: "above" | "below" } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const move = (action: MoveAction) => {
    if (selected) onChange(moveLayer(template, selected.id, action));
  };

  const commitRename = (row: LayerRow, value: string) => {
    setRenamingId(null);
    const name = value.trim();
    // Empty name = go back to the automatic label.
    onChange(patchLayerAttrs(template, row.id, { layerName: name || undefined }));
  };

  const canDropOn = (row: LayerRow) => {
    const dragged = rows.find((r) => r.id === dragId);
    return !!dragged && dragged.id !== row.id && dragged.parentIdx === row.parentIdx;
  };

  const frontIdx = selected ? selected.count - 1 : 0;
  const atFront = !!selected && selected.index === frontIdx;
  const atBack = !!selected && selected.index === 0;

  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <Layers className="h-4 w-4 text-gray-500" />
          Lapisan
          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
            {rows.length}
          </span>
        </h3>

        {/* Reorder the selected layer */}
        <div className="flex items-center gap-1">
          {(
            [
              ["front", ChevronsUp, "Ke paling depan", atFront],
              ["forward", ChevronUp, "Maju satu lapis", atFront],
              ["backward", ChevronDown, "Mundur satu lapis", atBack],
              ["back", ChevronsDown, "Ke paling belakang", atBack],
            ] as const
          ).map(([action, Icon, title, disabled]) => (
            <button
              key={action}
              type="button"
              title={title}
              aria-label={title}
              disabled={!selected || disabled}
              onClick={() => move(action)}
              className="rounded-md border border-gray-200 p-1 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Belum ada elemen. Tambahkan elemen untuk mulai menyusun lapisan.</p>
      ) : (
        <>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Paling depan
          </p>
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-0.5">
            {rows.map((row) => {
              const Icon = KIND_ICON[row.kind];
              const isSelected = row.id === selectedId;
              const isRenaming = renamingId === row.id;
              const showLineAbove = drop?.id === row.id && drop.place === "above";
              const showLineBelow = drop?.id === row.id && drop.place === "below";

              return (
                <li
                  key={row.id}
                  draggable={!isRenaming}
                  onDragStart={(e) => {
                    setDragId(row.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", row.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDrop(null);
                  }}
                  onDragOver={(e) => {
                    if (!canDropOn(row)) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    const rect = e.currentTarget.getBoundingClientRect();
                    const place = e.clientY < rect.top + rect.height / 2 ? "above" : "below";
                    if (drop?.id !== row.id || drop.place !== place) setDrop({ id: row.id, place });
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId && drop && canDropOn(row)) {
                      onChange(reorderLayer(template, dragId, row.id, drop.place));
                    }
                    setDragId(null);
                    setDrop(null);
                  }}
                  className={`relative flex items-center gap-1 rounded-lg border py-1 pl-1 pr-1.5 text-xs transition-colors ${
                    isSelected
                      ? "border-brand-500 bg-brand-50"
                      : "border-transparent hover:bg-gray-50"
                  } ${dragId === row.id ? "opacity-40" : ""}`}
                >
                  {showLineAbove && (
                    <span className="pointer-events-none absolute -top-[3px] left-1 right-1 h-0.5 rounded bg-brand-500" />
                  )}
                  {showLineBelow && (
                    <span className="pointer-events-none absolute -bottom-[3px] left-1 right-1 h-0.5 rounded bg-brand-500" />
                  )}

                  <span
                    className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                    title="Seret untuk mengubah urutan"
                    aria-hidden="true"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </span>

                  {isRenaming ? (
                    <input
                      autoFocus
                      defaultValue={row.label}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={(e) => commitRename(row, e.currentTarget.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="min-w-0 flex-1 rounded border border-brand-300 px-1.5 py-0.5 text-xs text-gray-900 focus:outline-none"
                      aria-label="Nama lapisan"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(row.id)}
                      onDoubleClick={() => setRenamingId(row.id)}
                      title="Klik untuk memilih · klik dua kali untuk mengganti nama"
                      className={`flex min-w-0 flex-1 items-center gap-1.5 text-left ${
                        row.visible ? "text-gray-700" : "text-gray-400 line-through"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate font-medium">{row.label}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onChange(patchLayerAttrs(template, row.id, { visible: row.visible ? false : undefined }))
                    }
                    title={row.visible ? "Sembunyikan" : "Tampilkan"}
                    aria-label={row.visible ? "Sembunyikan lapisan" : "Tampilkan lapisan"}
                    aria-pressed={!row.visible}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    {row.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-amber-500" />}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(patchLayerAttrs(template, row.id, { locked: row.locked ? undefined : true }))
                    }
                    title={row.locked ? "Buka kunci" : "Kunci posisi"}
                    aria-label={row.locked ? "Buka kunci lapisan" : "Kunci lapisan"}
                    aria-pressed={row.locked}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    {row.locked ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Paling belakang
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            Elemen di atas daftar tampil menutupi elemen di bawahnya. Seret untuk menyusun ulang. Elemen
            tersembunyi tidak ikut tampil di hasil akhir.
          </p>
        </>
      )}
    </section>
  );
}
