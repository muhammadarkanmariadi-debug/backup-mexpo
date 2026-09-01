"use client";

import { jsPDF } from "jspdf";
import type { Stage as StageType } from "konva/lib/Stage";

/** CSS px → mm (96 dpi). Keeps the certificate aspect ratio. */
const MM_PER_PX = 25.4 / 96;

type PngOptions = {
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
};

/** Rasterize the Konva stage to a PNG data URL (2x by default for print). */
export function stageToPng(stage: StageType, options: PngOptions = {}): string {
  const scaleX = stage.scaleX() || 1;
  const { pixelRatio = 2, mimeType = "image/png", quality } = options;
  return stage.toDataURL({
    pixelRatio: pixelRatio / scaleX,
    mimeType,
    quality,
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
  });
}

/**
 * Render the stage into a PDF.
 * - `print: true`  → opens a print dialog for the generated PDF (browser print).
 * - `print: false` → downloads the PDF directly.
 */
export function downloadCertificatePdf(
  stage: StageType,
  filename: string,
  print = false,
): void {
  const scaleX = stage.scaleX() || 1;
  const scaleY = stage.scaleY() || 1;
  const logicalWidth = stage.width() / scaleX;
  const logicalHeight = stage.height() / scaleY;

  const dataUrl = stageToPng(stage, { pixelRatio: 2 });

  const wMm = logicalWidth * MM_PER_PX;
  const hMm = logicalHeight * MM_PER_PX;
  const orientation = logicalWidth >= logicalHeight ? "landscape" : "portrait";

  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: [wMm, hMm],
    compress: true,
  });

  // White backing (the exported PNG may carry alpha when bg is transparent).
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, wMm, hMm, "F");
  doc.addImage(dataUrl, "PNG", 0, 0, wMm, hMm, undefined, "FAST");

  if (print) {
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  } else {
    doc.save(filename);
  }
}