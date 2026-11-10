"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Package, X } from "lucide-react";
import { toast } from "sonner";

import Input from "@/shared/components/form/Input";
import FormattedNumberInput from "@/shared/components/form/FormattedNumberInput";
import { SouvenirTier } from "@/entities/event/event.entity";
import { uploadSouvenirImage } from "@/services/souvenir.service";

/** Drops empty rows and normalizes a catalog before it is saved. */
export function normalizeCatalog(items: SouvenirTier[]): SouvenirTier[] {
  return items
    .filter((t) => t.name.trim())
    .map((t) => ({
      id: t.id,
      name: t.name.trim(),
      minPoints: Math.max(0, Number(t.minPoints) || 0),
      description: t.description?.trim() || undefined,
      image: t.image || undefined,
      stock: t.stock == null ? null : Math.max(0, Math.trunc(Number(t.stock))),
    }));
}

/**
 * Souvenir catalog editor (organizer): each item has a photo, name,
 * description, point price and optional stock. Shared by the event form and
 * the souvenir quick settings. Photos upload per event, so `eventId` is
 * required for them (a brand-new event gets photos after it is created).
 */
export default function SouvenirCatalogEditor({
  eventId,
  items,
  onChange,
}: {
  eventId?: string;
  items: SouvenirTier[];
  onChange: (items: SouvenirTier[]) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const patch = (id: string, value: Partial<SouvenirTier>) =>
    onChange(items.map((t) => (t.id === id ? { ...t, ...value } : t)));

  const upload = async (id: string, file: File | undefined) => {
    if (!file || !eventId) return;
    setUploadingId(id);
    try {
      const url = await uploadSouvenirImage(eventId, file);
      patch(id, { image: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah foto souvenir");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700">Katalog Souvenir</p>
        <button
          type="button"
          onClick={() =>
            onChange([...items, { id: crypto.randomUUID(), name: "", minPoints: 0, stock: null }])
          }
          className="cursor-pointer text-xs font-semibold text-secondary"
        >
          + Tambah Item
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-[11px] text-gray-400">
          Belum ada item. Contoh: Sticker Pack = 20 poin (stok 100), Totebag = 50 poin (stok 30).
        </p>
      )}
      {!eventId && items.length > 0 && (
        <p className="text-[11px] text-gray-400">
          Foto item bisa ditambahkan setelah event dibuat (menu Souvenir → Pengaturan Cepat).
        </p>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3">
          <div className="shrink-0">
            <label
              className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 ${
                eventId ? "cursor-pointer hover:border-secondary hover:text-secondary" : "cursor-not-allowed opacity-60"
              }`}
              title={eventId ? "Unggah foto (JPG/PNG/GIF, maks 4 MB)" : "Simpan event dulu untuk menambah foto"}
            >
              {uploadingId === item.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : item.image ? (
                <Image src={item.image} alt={item.name || "Souvenir"} fill sizes="80px" className="object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif"
                disabled={!eventId || uploadingId !== null}
                className="sr-only"
                onChange={(e) => {
                  void upload(item.id, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {item.image && (
              <button
                type="button"
                onClick={() => patch(item.id, { image: undefined })}
                className="mt-1 w-20 cursor-pointer text-center text-[11px] text-gray-400 hover:text-error-500"
              >
                Hapus foto
              </button>
            )}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Nama Souvenir"
                value={item.name}
                onChange={(e) => patch(item.id, { name: e.target.value })}
                placeholder="Totebag"
              />
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Deskripsi (opsional)"
                value={item.description ?? ""}
                onChange={(e) => patch(item.id, { description: e.target.value })}
                placeholder="Totebag kanvas warna navy"
              />
            </div>
            <FormattedNumberInput
              label="Harga Poin"
              value={Number(item.minPoints) || 0}
              onChange={(v) => patch(item.id, { minPoints: Number(v) })}
              suffix="Poin"
              placeholder="50"
            />
            <div>
              <label className="mb-1 flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={item.stock != null}
                  onChange={(e) => patch(item.id, { stock: e.target.checked ? 10 : null })}
                  className="accent-secondary"
                />
                Batasi stok
              </label>
              {item.stock != null ? (
                <FormattedNumberInput
                  value={item.stock}
                  onChange={(v) => patch(item.id, { stock: Number(v) })}
                  suffix="pcs"
                  placeholder="10"
                />
              ) : (
                <p className="pt-2 text-xs text-gray-400">Stok tanpa batas</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange(items.filter((t) => t.id !== item.id))}
            className="self-start cursor-pointer text-gray-400 hover:text-error-500"
            aria-label={`Hapus ${item.name || "item souvenir"}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {items.length > 0 && (
        <p className="flex items-center gap-1 text-[11px] text-gray-400">
          <Package className="h-3 w-3" /> Stok berkurang otomatis setiap kali item ditukar di meja souvenir.
        </p>
      )}
    </div>
  );
}
