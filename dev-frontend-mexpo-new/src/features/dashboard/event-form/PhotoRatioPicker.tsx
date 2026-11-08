"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

import EventPhoto from "@/shared/components/ui/EventPhoto";
import {
  formatRatio,
  MAX_PHOTO_RATIO,
  matchPreset,
  MIN_PHOTO_RATIO,
  parseRatio,
  type PhotoFit,
  RATIO_PRESETS,
  resolvePhotoFit,
  resolvePhotoRatio,
} from "@/shared/utils/photo-ratio";

export interface PhotoRatioValue {
  /** "W:H", e.g. "16:9" or "1.33:1". */
  ratio: string;
  fit: PhotoFit;
}

interface PhotoRatioPickerProps {
  /** Photo being edited (existing URL or local preview). Empty = none yet. */
  photoUrl: string;
  value: PhotoRatioValue;
  onChange: (next: PhotoRatioValue) => void;
}

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
    active
      ? "border-secondary bg-blue-50 text-secondary"
      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
  }`;

const numberInput =
  "h-9 w-20 rounded-lg border border-gray-200 bg-white px-2 text-center text-sm text-gray-800 focus:border-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary/15";

/**
 * Lets the organizer choose how the event photo is framed on the public
 * detail page: a ready-made ratio or a custom W:H, and whether the photo is
 * shown whole (blurred fill) or cropped to fill the frame.
 */
export default function PhotoRatioPicker({ photoUrl, value, onChange }: PhotoRatioPickerProps) {
  const preset = matchPreset(value.ratio);
  const [customMode, setCustomMode] = useState(!preset);

  const parsed = parseRatio(value.ratio);
  const [w0, h0] = value.ratio.split(":");
  const [customW, setCustomW] = useState(parsed ? w0 : "16");
  const [customH, setCustomH] = useState(parsed ? h0 : "9");
  const [customError, setCustomError] = useState<string | null>(null);

  // Natural ratio of the photo, read from the image itself. Keyed by URL so a
  // stale result is never shown for a different photo.
  const [loaded, setLoaded] = useState<{ url: string; ratio: number } | null>(null);
  useEffect(() => {
    if (!photoUrl) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setLoaded({ url: photoUrl, ratio: img.naturalWidth / img.naturalHeight });
      }
    };
    img.src = photoUrl;
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);
  const naturalRatio = loaded && loaded.url === photoUrl ? loaded.ratio : null;

  const setRatio = (ratio: string) => onChange({ ...value, ratio });

  const applyCustom = (wStr: string, hStr: string) => {
    setCustomW(wStr);
    setCustomH(hStr);
    const w = Number(wStr);
    const h = Number(hStr);
    if (!(w > 0) || !(h > 0)) {
      setCustomError("Isi lebar dan tinggi dengan angka lebih dari 0.");
      return;
    }
    const r = w / h;
    if (r < MIN_PHOTO_RATIO || r > MAX_PHOTO_RATIO) {
      setCustomError("Rasio harus antara 1:2 dan 3:1.");
      return;
    }
    setCustomError(null);
    setRatio(formatRatio(w, h));
  };

  const followImage = () => {
    if (!naturalRatio) return;
    const w = Math.round(naturalRatio * 100) / 100;
    setCustomMode(true);
    applyCustom(String(w), "1");
  };

  const previewRatio = resolvePhotoRatio(value.ratio);
  const fit = resolvePhotoFit(value.fit);

  return (
    <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 sm:grid-cols-[208px_1fr]">
      {/* Live preview */}
      <div className="flex min-h-24 items-center justify-center">
        {photoUrl ? (
          <EventPhoto
            src={photoUrl}
            alt="Pratinjau tampilan"
            ratio={previewRatio}
            fit={fit}
            maxHeight={200}
            unoptimized
            className="rounded-xl border border-gray-200"
          />
        ) : (
          <div
            className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 bg-white text-gray-400"
            style={{ aspectRatio: String(previewRatio), maxHeight: 200 }}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-[11px]">Belum ada poster</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-xs font-bold text-gray-700">Rasio tampilan di halaman detail</p>
          <div className="flex flex-wrap gap-1.5">
            {RATIO_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                title={p.hint}
                onClick={() => {
                  setCustomMode(false);
                  setCustomError(null);
                  setRatio(p.label);
                }}
                className={chip(!customMode && preset?.label === p.label)}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomMode(true);
                applyCustom(customW, customH);
              }}
              className={chip(customMode)}
            >
              Kustom
            </button>
          </div>
        </div>

        {customMode && (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={customW}
                onChange={(e) => applyCustom(e.target.value, customH)}
                aria-label="Lebar rasio"
                aria-invalid={!!customError}
                className={`${numberInput} ${customError ? "border-error-500" : ""}`}
              />
              <span className="text-sm font-semibold text-gray-400">:</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={customH}
                onChange={(e) => applyCustom(customW, e.target.value)}
                aria-label="Tinggi rasio"
                aria-invalid={!!customError}
                className={`${numberInput} ${customError ? "border-error-500" : ""}`}
              />
              <button
                type="button"
                onClick={followImage}
                disabled={!naturalRatio}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Samakan dengan gambar
              </button>
            </div>
            {customError && (
              <p role="alert" className="mt-1.5 text-xs font-medium text-error-500">
                {customError}
              </p>
            )}
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-bold text-gray-700">Jika gambar tidak pas dengan rasio</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...value, fit: "contain" })}
              className={chip(fit === "contain")}
            >
              Tampil utuh (latar kabur)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...value, fit: "cover" })}
              className={chip(fit === "cover")}
            >
              Isi penuh (dipotong)
            </button>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed text-gray-400">
          {naturalRatio
            ? `Rasio gambar yang dipilih: ${formatRatio(naturalRatio, 1)}. `
            : "Pilih gambar untuk melihat rasionya. "}
          Samakan rasio tampilan dengan rasio gambar agar tidak ada bagian yang terpotong atau kabur.
        </p>
      </div>
    </div>
  );
}
