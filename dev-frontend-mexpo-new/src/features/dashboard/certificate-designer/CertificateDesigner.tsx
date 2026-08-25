"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { Transformer as TransformerType } from "konva/lib/shapes/Transformer";
import type { Stage as StageType } from "konva/lib/Stage";
import {
  ArrowDown,
  ArrowUp,
  Award,
  Copy,
  Download,
  FilePlus2,
  Loader2,
  Save,
  Square,
  Trash2,
  Type,
} from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import {
  CertificateBinding,
  CertificateData,
  CertificateFieldKey,
  CertificateTemplate,
  CertificateTemplateEnvelope,
  CertificateTemplateNode,
} from "@/entities/event/certificate-template.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  getCertificateTemplates,
  updateCertificateTemplate,
} from "@/services/certificate.service";
import {
  buildSampleData,
  CERTIFICATE_FIELDS,
  uid,
} from "@/features/certificates/certificate-fields";
import { DEFAULT_CERTIFICATE_TEMPLATE } from "@/features/certificates/default-certificate";
import { downloadCertificatePdf } from "@/features/certificates/export-certificate";

// ── Konva stage is canvas-based — keep it out of SSR entirely. ──
const CertificateCanvas = dynamic(
  () =>
    import("@/features/certificates/CertificateStage").then(
      (m) => m.CertificateStage,
    ),
  { ssr: false, loading: () => <LoaderFallback /> },
);

function LoaderFallback() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      Memuat kanvas…
    </div>
  );
}

const FONT_OPTIONS = [
  "Poppins, sans-serif",
  "Inter, sans-serif",
  "Georgia, serif",
  "'Times New Roman', serif",
  "monospace",
];

const FONT_STYLES = ["normal", "bold", "italic", "bold italic"];

function cloneTemplate(tpl: CertificateTemplateEnvelope): CertificateTemplateEnvelope {
  return JSON.parse(JSON.stringify(tpl)) as CertificateTemplateEnvelope;
}

// ── Immutable tree helpers over the template envelope ──

// ── Immutable tree helpers over the template envelope ──

function updateNode(
  env: CertificateTemplateEnvelope,
  id: string,
  patch: Record<string, unknown>,
): CertificateTemplateEnvelope {
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] =>
    nodes.map((n) => {
      const children = n.children ? go(n.children) : undefined;
      if (n.attrs.id === id) {
        return { ...n, attrs: { ...n.attrs, ...patch }, children };
      }
      return children ? { ...n, children } : n;
    });
  return { ...env, nodes: go(env.nodes) };
}

function removeNode(
  env: CertificateTemplateEnvelope,
  id: string,
): CertificateTemplateEnvelope {
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] =>
    nodes.flatMap((n) => {
      if (n.attrs.id === id) return [];
      const children = n.children ? go(n.children) : undefined;
      return [{ ...n, ...(children ? { children } : {}) }];
    });
  return { ...env, nodes: go(env.nodes) };
}

function moveNode(
  env: CertificateTemplateEnvelope,
  id: string,
  dir: 1 | -1,
): CertificateTemplateEnvelope {
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] => {
    const idx = nodes.findIndex((n) => n.attrs.id === id);
    if (idx >= 0) {
      const target = idx + dir;
      if (target < 0 || target >= nodes.length) return nodes;
      const arr = [...nodes];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    }
    return nodes.map((n) =>
      n.children ? { ...n, children: go(n.children) } : n,
    );
  };
  return { ...env, nodes: go(env.nodes) };
}

function addNode(
  env: CertificateTemplateEnvelope,
  node: CertificateTemplateNode,
): CertificateTemplateEnvelope {
  let layers = env.nodes;
  if (layers.length === 0) {
    layers = [{ className: "Layer", attrs: {}, children: [] }];
  }
  const target = layers[layers.length - 1];
  const next = [
    ...layers.slice(0, -1),
    { ...target, children: [...(target.children ?? []), node] },
  ];
  return { ...env, nodes: next };
}

function findNode(
  env: CertificateTemplateEnvelope,
  id: string | null,
): CertificateTemplateNode | null {
  if (!id) return null;
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode | null => {
    for (const n of nodes) {
      if (n.attrs.id === id) return n;
      if (n.children) {
        const hit = go(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  return go(env.nodes);
}

// ── Node factories ──

function makeTextNode(): CertificateTemplateNode {
  return {
    className: "Text",
    attrs: {
      id: uid(),
      x: 80,
      y: 80,
      width: 500,
      fontSize: 40,
      fontFamily: "Poppins, sans-serif",
      fontStyle: "bold",
      fill: "#111827",
      align: "center",
      text: "Teks Statis",
      binding: { type: "static", value: "Teks Statis" },
    },
  };
}

function makeDynamicTextNode(key: CertificateFieldKey): CertificateTemplateNode {
  return {
    className: "Text",
    attrs: {
      id: uid(),
      x: 200,
      y: 300,
      width: 600,
      height: 60,
      fontSize: 52,
      fontFamily: "Poppins, sans-serif",
      fontStyle: "bold",
      fill: "#111827",
      align: "center",
      text: "",
      binding: { type: "dynamic", key },
    },
  };
}

function makeRectNode(): CertificateTemplateNode {
  return {
    className: "Rect",
    attrs: {
      id: uid(),
      x: 100,
      y: 100,
      width: 300,
      height: 120,
      fill: "#3c85f3",
      cornerRadius: 12,
      opacity: 1,
    },
  };
}

function makeImageNode(src: string): CertificateTemplateNode {
  return {
    className: "Image",
    attrs: {
      id: uid(),
      x: 100,
      y: 100,
      width: 240,
      height: 120,
      src,
      opacity: 1,
    },
  };
}

// ── Small field primitive ──

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none";

// ── Main designer ──

export function CertificateDesigner({ event }: { event: Event }) {
  const queryClient = useQueryClient();
  const listKey = keys.certificateTemplates.all(event.uuid);

  const { data: templates, isLoading } = useApiQuery<CertificateTemplate[]>(
    listKey,
    () => getCertificateTemplates(event.uuid),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("Sertifikat Mexpo (Default)");
  const [draft, setDraft] = useState<CertificateTemplateEnvelope>(() =>
    cloneTemplate(DEFAULT_CERTIFICATE_TEMPLATE),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sampleMode, setSampleMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Background upload is previewed via a local object URL, then the real S3
  // URL written by the backend replaces `draft.background.url` after save.
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string>("");

  const stageRef = useRef<StageType | null>(null);
  const transformerRef = useRef<TransformerType | null>(null);

  // Fit the canvas to its panel so a large certificate never overflows.
  const canvasPanelRef = useRef<HTMLDivElement | null>(null);
  const [canvasPanelWidth, setCanvasPanelWidth] = useState(0);
  useEffect(() => {
    const el = canvasPanelRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setCanvasPanelWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fitScale =
    canvasPanelWidth > 0 && draft.width > 0
      ? Math.min(canvasPanelWidth / draft.width, 1)
      : 1;

  useEffect(() => {
    return () => {
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    };
  }, [bgPreviewUrl]);

  const sampleData = useMemo<CertificateData>(() => buildSampleData(), []);
  const renderData = useMemo<CertificateData>(
    () => (sampleMode ? sampleData : Object.fromEntries(CERTIFICATE_FIELDS.map((f) => [f.key, ""])) as CertificateData),
    [sampleMode, sampleData],
  );

  const selectedNode = useMemo(
    () => findNode(draft, selectedId),
    [draft, selectedId],
  );

  // Bind the Transformer to the selected node.
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne(`#${selectedId}`);
    if (node && node.getLayer()) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, draft.nodes]);

  const handleSelectDefaultTemplate = () => {
    setEditingId(null);
    setName("Sertifikat Mexpo (Default)");
    setDraft(cloneTemplate(DEFAULT_CERTIFICATE_TEMPLATE));
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
    toast.info("Memuat template bawaan");
  };

  const handleSelectTemplate = (t: CertificateTemplate) => {
    setEditingId(t.uuid);
    setName(t.name);
    setDraft(t.template ? (t.template as CertificateTemplateEnvelope) : cloneTemplate(DEFAULT_CERTIFICATE_TEMPLATE));
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
  };

  const handleNewTemplate = () => {
    setEditingId(null);
    setName("Sertifikat Baru");
    setDraft(cloneTemplate(DEFAULT_CERTIFICATE_TEMPLATE));
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
  };

  const handleDuplicateTemplate = () => {
    setEditingId(null);
    setName(`${name} (Salinan)`);
    setDraft(cloneTemplate(draft));
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
    toast.success("Template berhasil diduplikasi. Silakan edit dan simpan sebagai template baru.");
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const payload = { name, kind: "WORKSHOP", template: draft, is_active: true };
    try {
      const res = editingId
        ? await updateCertificateTemplate(editingId, payload, bgFile ?? undefined)
        : await createCertificateTemplate(event.uuid, payload, bgFile ?? undefined);
      if (!res.status) throw new Error(res.message ?? "Gagal menyimpan template");
      toast.success(editingId ? "Template sertifikat diperbarui" : "Template sertifikat dibuat");

      // Adopt the persisted record: keep edit mode bound to it and, when a
      // background image was just uploaded, swap the local object URL for the
      // real S3 URL the backend generated.
      const saved = res.data as CertificateTemplate | null | undefined;
      if (saved?.uuid) setEditingId(saved.uuid);
      if (saved?.background && draft.background.type === "image") {
        setDraft((prev) => ({
          ...prev,
          background: { type: "image", url: saved.background },
        }));
      }
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
      setBgFile(null);
      setBgPreviewUrl("");
      await queryClient.invalidateQueries({ queryKey: listKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus template sertifikat ini?")) return;
    setDeleting(true);
    try {
      const res = await deleteCertificateTemplate(id);
      if (!res.status) throw new Error(res.message ?? "Gagal menghapus template");
      toast.success("Template sertifikat dihapus");
      if (editingId === id) handleNewTemplate();
      await queryClient.invalidateQueries({ queryKey: listKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus template");
    } finally {
      setDeleting(false);
    }
  };

  const patchSelected = (patch: Record<string, unknown>) => {
    if (!selectedId) return;
    setDraft((prev) => updateNode(prev, selectedId, patch));
  };

  const handleBindingChange = (patch: Partial<CertificateBinding>) => {
    if (!selectedNode || selectedNode.className !== "Text") return;
    const current: CertificateBinding =
      (selectedNode.attrs.binding as CertificateBinding | undefined) ?? {
        type: "static",
        value: (selectedNode.attrs.text as string) ?? "",
      };
    const next: CertificateBinding = {
      type: current.type,
      value: current.value ?? "",
      ...patch,
    };
    // Keep `text` in sync so the template stays readable without binding too.
    const text =
      next.type === "static" ? next.value ?? "" : (next.value ?? "");
    patchSelected({ binding: next, text });
  };

  const handleExportPdf = (print: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    downloadCertificatePdf(stage, `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "sertifikat"}.pdf`, print);
  };

  const handleExportPng = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({ pixelRatio: 2, x: 0, y: 0, width: stage.width(), height: stage.height() });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name || "sertifikat"}.png`;
    a.click();
  };

  const handleBackgroundColor = (color: string) => {
    setDraft((prev) => ({
      ...prev,
      background: { type: "color", value: color },
    }));
  };

  const handleBackgroundFile = (file: File | undefined) => {
    if (!file) return;
    if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    const url = URL.createObjectURL(file);
    setBgFile(file);
    setBgPreviewUrl(url);
    setDraft((prev) => ({
      ...prev,
      background: { type: "image", url },
    }));
  };

  const handleBackgroundUrl = (url: string) => {
    if (!url.trim()) return;
    setBgFile(null);
    setBgPreviewUrl("");
    setDraft((prev) => ({
      ...prev,
      background: { type: "image", url: url.trim() },
    }));
  };

  const addImageViaPrompt = () => {
    const url = window.prompt(
      "Tempel URL gambar (logo / tanda tangan / watermark):",
      "",
    );
    if (url && url.trim()) {
      setDraft((prev) => addNode(prev, makeImageNode(url.trim())));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Desain Sertifikat
            </h2>
            <p className="text-xs text-gray-500">
              Atur layout, latar belakang, dan teks default/kustom dengan
              Konva.js
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNewTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <FilePlus2 className="h-4 w-4" /> Template Baru
          </button>
          <button
            type="button"
            onClick={handleDuplicateTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            title="Duplikat template saat ini sebagai template baru"
          >
            <Copy className="h-4 w-4" /> Duplikat
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PNG
          </button>
          <button
            type="button"
            onClick={() => handleExportPdf(false)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
          <button
            type="button"
            onClick={() => handleExportPdf(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" /> Cetak
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-white hover:bg-secondary/80 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan
          </button>
        </div>
      </div>

      {/* Template list + name + sample toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama template"
          className={`${inputCls} max-w-xs`}
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
          <input
            type="checkbox"
            checked={sampleMode}
            onChange={(e) => setSampleMode(e.target.checked)}
            className="accent-secondary"
          />
          Tampilkan data contoh
        </label>
        {editingId ? (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
            Mengedit template tersimpan
          </span>
        ) : (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            Template baru / Bawaan
          </span>
        )}
      </div>

      {/* Template list */}
      <div className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Pilihan Template
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {/* Non-removable default template card */}
            <div
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                editingId === null && name.includes("Default")
                  ? "border-blue-500 bg-blue-50"
                  : "border-blue-200 bg-blue-50/40 hover:border-blue-300"
              }`}
            >
              <button
                type="button"
                onClick={handleSelectDefaultTemplate}
                className="flex-1 truncate text-left font-medium text-blue-900"
              >
                Template Default (Bawaan)
                <span className="ml-2 rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                  Sistem
                </span>
              </button>
              <button
                type="button"
                onClick={handleDuplicateTemplate}
                className="rounded-md p-1 text-blue-600 hover:bg-blue-100"
                title="Duplikat template ini"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            {/* Custom event templates */}
            {(templates ?? []).map((t) => (
              <div
                key={t.uuid}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
                  editingId === t.uuid
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(t)}
                  className="flex-1 truncate text-left font-medium text-gray-800"
                >
                  {t.name}
                  {t.is_active && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      Aktif
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateTemplate}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  title="Duplikat template ini"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t.uuid)}
                  disabled={deleting}
                  className="rounded-md p-1 text-gray-400 hover:bg-error-50 hover:text-error-600"
                  title="Hapus template"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Canvas + panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Canvas */}
        <div
          ref={canvasPanelRef}
          className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div
            className="mx-auto"
            style={{ width: Math.round(draft.width * fitScale) }}
          >
            <CertificateCanvas
              template={draft}
              data={renderData}
              stageRef={stageRef}
              transformerRef={transformerRef}
              interactive
              fitScale={fitScale}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onGeometry={(id, g) =>
                setDraft((prev) =>
                  updateNode(prev, id, { ...g, scaleX: 1, scaleY: 1 }),
                )
              }
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Add elements */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Tambah Elemen
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => addNode(prev, makeTextNode()))
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Type className="h-4 w-4" /> Teks
              </button>
              {CERTIFICATE_FIELDS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setDraft((prev) => addNode(prev, makeDynamicTextNode(f.key)))
                  }
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
                >
                  <Type className="h-4 w-4" /> {f.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => addNode(prev, makeRectNode()))
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Square className="h-4 w-4" /> Kotak
              </button>
              <button
                type="button"
                onClick={addImageViaPrompt}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <FilePlus2 className="h-4 w-4" /> Gambar
              </button>
            </div>
          </section>

          {/* Background */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Latar Belakang
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleBackgroundColor(draft.background.type === "color" ? draft.background.value ?? "#ffffff" : "#ffffff")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${draft.background.type === "color" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}
                >
                  Warna
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      background: {
                        type: "image",
                        url:
                          prev.background.type === "image"
                            ? prev.background.url
                            : "",
                      },
                    }))
                  }
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${draft.background.type === "image" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}
                >
                  Gambar
                </button>
              </div>

              {draft.background.type === "color" ? (
                <Field label="Warna dasar">
                  <input
                    type="color"
                    value={draft.background.value ?? "#ffffff"}
                    onChange={(e) => handleBackgroundColor(e.target.value)}
                    className="h-9 w-full cursor-pointer rounded-lg border border-gray-200"
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleBackgroundFile(e.target.files?.[0] ?? undefined)
                    }
                    className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-600"
                  />
                  <input
                    type="text"
                    placeholder="atau tempel URL gambar…"
                    className={inputCls}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBackgroundUrl((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Lebar (px)">
                  <input
                    type="number"
                    value={draft.width}
                    min={200}
                    max={4000}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        width: Math.max(200, Number(e.target.value) || 200),
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Tinggi (px)">
                  <input
                    type="number"
                    value={draft.height}
                    min={200}
                    max={4000}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        height: Math.max(200, Number(e.target.value) || 200),
                      }))
                    }
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Inspector */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Properti
            </h3>
            {!selectedNode ? (
              <p className="text-xs text-gray-400">
                Pilih elemen di kanvas untuk mengubah propertinya.
              </p>
            ) : (
              <Inspector
                node={selectedNode}
                onPatch={patchSelected}
                onBindingChange={handleBindingChange}
                onRemove={() => {
                  if (!selectedId) return;
                  setDraft((prev) => removeNode(prev, selectedId));
                  setSelectedId(null);
                }}
                onMove={(dir) => {
                  if (!selectedId) return;
                  setDraft((prev) => moveNode(prev, selectedId, dir));
                }}
                onDuplicate={() => {
                  if (!selectedNode) return;
                  const clone: CertificateTemplateNode = JSON.parse(
                    JSON.stringify(selectedNode),
                  );
                  clone.attrs = { ...clone.attrs, id: uid(), x: (clone.attrs.x as number) + 24, y: (clone.attrs.y as number) + 24 };
                  setDraft((prev) => addNode(prev, clone));
                }}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Inspector panel ──

function Inspector({
  node,
  onPatch,
  onBindingChange,
  onRemove,
  onMove,
  onDuplicate,
}: {
  node: CertificateTemplateNode;
  onPatch: (patch: Record<string, unknown>) => void;
  onBindingChange: (patch: Partial<CertificateBinding>) => void;
  onRemove: () => void;
  onMove: (dir: 1 | -1) => void;
  onDuplicate: () => void;
}) {
  const a = node.attrs as Record<string, unknown>;
  const binding = a.binding as CertificateBinding | undefined;
  const isText = node.className === "Text";

  const num = (key: string) =>
    key in a ? String(a[key]) : "";

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
          title="Maju (ke atas)"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
          title="Mundur (ke bawah)"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50"
          title="Duplikat"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-error-200 p-1.5 text-error-600 hover:bg-error-50"
          title="Hapus elemen"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Geometry */}
      <div className="grid grid-cols-2 gap-2">
        <Field label="X">
          <input
            type="number"
            value={num("x")}
            onChange={(e) => onPatch({ x: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </Field>
        <Field label="Y">
          <input
            type="number"
            value={num("y")}
            onChange={(e) => onPatch({ y: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </Field>
        <Field label="Lebar">
          <input
            type="number"
            value={num("width")}
            min={1}
            onChange={(e) => onPatch({ width: Math.max(1, Number(e.target.value) || 1) })}
            className={inputCls}
          />
        </Field>
        <Field label="Tinggi">
          <input
            type="number"
            value={num("height")}
            min={1}
            onChange={(e) => onPatch({ height: Math.max(1, Number(e.target.value) || 1) })}
            className={inputCls}
          />
        </Field>
        <Field label="Rotasi">
          <input
            type="number"
            value={num("rotation")}
            onChange={(e) => onPatch({ rotation: Number(e.target.value) || 0 })}
            className={inputCls}
          />
        </Field>
        <Field label="Opacity">
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={a.opacity === undefined ? "1" : String(a.opacity)}
            onChange={(e) => onPatch({ opacity: Math.min(1, Math.max(0, Number(e.target.value) || 0)) })}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Appearance */}
      <Field label="Warna isi">
        <input
          type="color"
          value={typeof a.fill === "string" ? a.fill : "#000000"}
          onChange={(e) => onPatch({ fill: e.target.value })}
          className="h-9 w-full cursor-pointer rounded-lg border border-gray-200"
        />
      </Field>

      {/* Text-specific */}
      {isText && (
        <>
          <div className="space-y-2">
            <Field label="Jenis nilai">
              <select
                value={binding?.type ?? "static"}
                onChange={(e) =>
                  onBindingChange({
                    type: e.target.value as "static" | "dynamic",
                  })
                }
                className={inputCls}
              >
                <option value="static">Teks default (tetap)</option>
                <option value="dynamic">Nilai kustom per peserta</option>
              </select>
            </Field>

            {binding?.type === "dynamic" ? (
              <Field label="Data peserta">
                <select
                  value={binding.key ?? ""}
                  onChange={(e) =>
                    onBindingChange({
                      key: e.target.value as CertificateFieldKey,
                    })
                  }
                  className={inputCls}
                >
                  <option value="" disabled>
                    Pilih data…
                  </option>
                  {CERTIFICATE_FIELDS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field label="Teks default">
                <input
                  type="text"
                  value={
                    typeof binding?.value === "string"
                      ? binding.value
                      : typeof a.text === "string"
                        ? a.text
                        : ""
                  }
                  onChange={(e) => onBindingChange({ value: e.target.value })}
                  className={inputCls}
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Field label="Ukuran font">
                <input
                  type="number"
                  min={6}
                  value={num("fontSize")}
                  onChange={(e) => onPatch({ fontSize: Math.max(6, Number(e.target.value) || 6) })}
                  className={inputCls}
                />
              </Field>
              <Field label="Jarak huruf">
                <input
                  type="number"
                  value={num("letterSpacing")}
                  onChange={(e) => onPatch({ letterSpacing: Number(e.target.value) || 0 })}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Font">
              <select
                value={(a.fontFamily as string) ?? FONT_OPTIONS[0]}
                onChange={(e) => onPatch({ fontFamily: e.target.value })}
                className={inputCls}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Gaya font">
              <select
                value={(a.fontStyle as string) ?? "normal"}
                onChange={(e) => onPatch({ fontStyle: e.target.value })}
                className={inputCls}
              >
                {FONT_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Perataan">
              <select
                value={(a.align as string) ?? "left"}
                onChange={(e) => onPatch({ align: e.target.value })}
                className={inputCls}
              >
                <option value="left">Kiri</option>
                <option value="center">Tengah</option>
                <option value="right">Kanan</option>
              </select>
            </Field>
          </div>
        </>
      )}

      {/* Image-specific */}
      {node.className === "Image" && (
        <Field label="URL gambar">
          <div className="flex gap-2">
            <input
              type="text"
              value={(a.src as string) ?? ""}
              onChange={(e) => onPatch({ src: e.target.value })}
              className={inputCls}
              placeholder="https://…"
            />
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Ganti URL gambar:", (a.src as string) ?? "");
                if (url && url.trim()) onPatch({ src: url.trim() });
              }}
              className="shrink-0 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Ganti
            </button>
          </div>
        </Field>
      )}

      {/* Rect/Image stroke */}
      {(node.className === "Rect" || node.className === "Circle") && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Sudut (radius)">
            <input
              type="number"
              min={0}
              value={num("cornerRadius")}
              onChange={(e) => onPatch({ cornerRadius: Math.max(0, Number(e.target.value) || 0) })}
              className={inputCls}
            />
          </Field>
          <Field label="Ketebalan garis">
            <input
              type="number"
              min={0}
              value={num("strokeWidth")}
              onChange={(e) => onPatch({ strokeWidth: Math.max(0, Number(e.target.value) || 0) })}
              className={inputCls}
            />
          </Field>
        </div>
      )}
    </div>
  );
}