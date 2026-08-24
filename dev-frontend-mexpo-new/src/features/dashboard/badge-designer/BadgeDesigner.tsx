"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { Transformer as TransformerType } from "konva/lib/shapes/Transformer";
import type { Stage as StageType } from "konva/lib/Stage";
import {
  Circle as CircleIcon,
  Copy,
  CreditCard,
  Download,
  FilePlus2,
  Loader2,
  QrCode,
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
import { DEFAULT_BADGE_TEMPLATE } from "@/features/badges/default-badge";
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
      Memuat kanvas badge…
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

function emptyEnvelope(width = 600, height = 900): CertificateTemplateEnvelope {
  return {
    version: 1,
    width,
    height,
    background: { type: "color", value: "#f8fafc" },
    nodes: [],
  };
}

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

function addNode(
  env: CertificateTemplateEnvelope,
  node: CertificateTemplateNode,
): CertificateTemplateEnvelope {
  let layers = env.nodes;
  if (layers.length === 0) {
    layers = [{ className: "Layer", attrs: { id: "badge-layer" }, children: [] }];
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
      x: 50,
      y: 100,
      width: 500,
      fontSize: 20,
      fontFamily: "Poppins, sans-serif",
      fontStyle: "bold",
      fill: "#0f172a",
      align: "center",
      text: "Teks Badge",
      binding: { type: "static", value: "Teks Badge" },
    },
  };
}

function makeDynamicTextNode(key: CertificateFieldKey): CertificateTemplateNode {
  const label = CERTIFICATE_FIELDS.find((f) => f.key === key)?.label ?? key;
  return {
    className: "Text",
    attrs: {
      id: uid(),
      x: 40,
      y: 350,
      width: 520,
      fontSize: key === "participant_name" ? 28 : key === "organization" ? 18 : 14,
      fontFamily: "Poppins, sans-serif",
      fontStyle: "bold",
      fill: "#0f172a",
      align: "center",
      text: label,
      binding: { type: "dynamic", key },
    },
  };
}

function makeRectNode(): CertificateTemplateNode {
  return {
    className: "Rect",
    attrs: {
      id: uid(),
      x: 50,
      y: 50,
      width: 500,
      height: 100,
      fill: "#3c85f3",
      cornerRadius: 16,
      opacity: 1,
    },
  };
}

function makeCircleNode(): CertificateTemplateNode {
  return {
    className: "Circle",
    attrs: {
      id: uid(),
      x: 300,
      y: 200,
      radius: 50,
      fill: "#3c85f3",
      stroke: "#ffffff",
      strokeWidth: 3,
      opacity: 1,
    },
  };
}

function makeQrNode(): CertificateTemplateNode {
  return {
    className: "Image",
    attrs: {
      id: uid(),
      x: 215,
      y: 525,
      width: 170,
      height: 170,
      src: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=mexpo:sample:visitor",
      binding: {
        type: "dynamic",
        key: "qr_code",
        value: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=mexpo:sample:visitor",
      },
    },
  };
}

function makeImageNode(src: string): CertificateTemplateNode {
  return {
    className: "Image",
    attrs: {
      id: uid(),
      x: 220,
      y: 200,
      width: 160,
      height: 160,
      src,
      opacity: 1,
    },
  };
}

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

// ── Main Badge Designer ──

export function BadgeDesigner({ event }: { event: Event }) {
  const queryClient = useQueryClient();
  const listKey = ["badge-templates", event.uuid];

  const { data: templates, isLoading } = useApiQuery<CertificateTemplate[]>(
    listKey,
    () => getCertificateTemplates(event.uuid, { kind: "BADGE" }),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("ID Badge Mexpo (Default)");
  const [draft, setDraft] = useState<CertificateTemplateEnvelope>(() =>
    cloneTemplate(DEFAULT_BADGE_TEMPLATE),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sampleMode, setSampleMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string>("");

  const stageRef = useRef<StageType | null>(null);
  const transformerRef = useRef<TransformerType | null>(null);

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
    () =>
      sampleMode
        ? sampleData
        : (Object.fromEntries(
            CERTIFICATE_FIELDS.map((f) => [f.key, ""]),
          ) as CertificateData),
    [sampleMode, sampleData],
  );

  const selectedNode = useMemo(
    () => findNode(draft, selectedId),
    [draft, selectedId],
  );

  // Bind Transformer to the selected node
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
    setName("ID Badge Mexpo (Default)");
    setDraft(cloneTemplate(DEFAULT_BADGE_TEMPLATE));
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
    toast.info("Memuat template badge bawaan");
  };

  const handleSelectTemplate = (t: CertificateTemplate) => {
    setEditingId(t.uuid);
    setName(t.name);
    setDraft(
      t.template
        ? (t.template as CertificateTemplateEnvelope)
        : cloneTemplate(DEFAULT_BADGE_TEMPLATE),
    );
    setSelectedId(null);
    setBgFile(null);
    setBgPreviewUrl("");
  };

  const handleNewTemplate = () => {
    setEditingId(null);
    setName("ID Badge Baru");
    setDraft(cloneTemplate(DEFAULT_BADGE_TEMPLATE));
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
    toast.success(
      "Template badge berhasil diduplikasi. Silakan edit dan simpan sebagai template baru.",
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const payload = { name, kind: "BADGE", template: draft, is_active: true };
    try {
      const res = editingId
        ? await updateCertificateTemplate(editingId, payload, bgFile ?? undefined)
        : await createCertificateTemplate(event.uuid, payload, bgFile ?? undefined);
      if (!res.status) throw new Error(res.message ?? "Gagal menyimpan template badge");
      toast.success(
        editingId ? "Template badge diperbarui" : "Template badge dibuat",
      );

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
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan template badge");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Hapus template badge ini?")) return;
    setDeleting(true);
    try {
      const res = await deleteCertificateTemplate(id);
      if (!res.status) throw new Error(res.message ?? "Gagal menghapus template badge");
      toast.success("Template badge dihapus");
      if (editingId === id) handleNewTemplate();
      await queryClient.invalidateQueries({ queryKey: listKey });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus template badge");
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
    const text =
      next.type === "static" ? next.value ?? "" : (next.value ?? "");
    patchSelected({ binding: next, text });
  };

  const handleExportPdf = (print: boolean) => {
    const stage = stageRef.current;
    if (!stage) return;
    downloadCertificatePdf(
      stage,
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "id-badge"}.pdf`,
      print,
    );
  };

  const handleExportPng = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const dataUrl = stage.toDataURL({
      pixelRatio: 2,
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${name || "id-badge"}.png`;
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

  const addImageViaPrompt = () => {
    const url = window.prompt("Tempel URL gambar (Logo / Avatar / Icon):", "");
    if (url && url.trim()) {
      setDraft((prev) => addNode(prev, makeImageNode(url.trim())));
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      {/* Header row */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Desain ID Badge & Name Tag
            </h2>
            <p className="text-xs text-gray-500">
              Kustomisasi tata letak, banner, avatar, dan QR code badge pengunjung
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
          placeholder="Nama template badge"
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
          Pilihan Template ID Badge
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {/* Non-removable default badge template */}
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
                ID Badge Default (Bawaan)
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

            {/* Custom event badge templates */}
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
          className="flex items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-6"
        >
          <div
            className="mx-auto shadow-md"
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
              Tambah Elemen Badge
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => addNode(prev, makeTextNode()))
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Type className="h-4 w-4" /> Teks Bebas
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => addNode(prev, makeQrNode()))
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-100"
              >
                <QrCode className="h-4 w-4" /> QR Code
              </button>
              {CERTIFICATE_FIELDS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setDraft((prev) =>
                      addNode(prev, makeDynamicTextNode(f.key)),
                    )
                  }
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
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
                <Square className="h-4 w-4" /> Kotak / Banner
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => addNode(prev, makeCircleNode()))
                }
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <CircleIcon className="h-4 w-4" /> Lingkaran / Avatar
              </button>
              <button
                type="button"
                onClick={addImageViaPrompt}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <FilePlus2 className="h-4 w-4" /> Tambah Gambar / Logo
              </button>
            </div>
          </section>

          {/* Background */}
          <section className="rounded-xl border border-gray-200 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">
              Latar Belakang & Ukuran
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleBackgroundColor(
                      draft.background.type === "color"
                        ? draft.background.value ?? "#f8fafc"
                        : "#f8fafc",
                    )
                  }
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    draft.background.type === "color"
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
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
                  className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                    draft.background.type === "image"
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  Gambar
                </button>
              </div>

              {draft.background.type === "color" ? (
                <Field label="Warna dasar">
                  <input
                    type="color"
                    value={draft.background.value ?? "#f8fafc"}
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
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Field label="Lebar (px)">
                  <input
                    type="number"
                    value={draft.width}
                    min={200}
                    max={2000}
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
                    max={2000}
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
          {selectedNode ? (
            <section className="rounded-xl border border-brand-200 bg-brand-50/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-brand-900">
                  Properti: {selectedNode.className}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    selectedId &&
                    setDraft((prev) => removeNode(prev, selectedId))
                  }
                  className="rounded-md p-1 text-red-500 hover:bg-red-50"
                  title="Hapus elemen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedNode.className === "Text" && (
                  <>
                    <Field label="Jenis Nilai">
                      <select
                        value={selectedNode.attrs.binding?.type ?? "static"}
                        onChange={(e) =>
                          handleBindingChange({
                            type: e.target.value as "static" | "dynamic",
                          })
                        }
                        className={inputCls}
                      >
                        <option value="static">Teks Tetap</option>
                        <option value="dynamic">Data Dinamis</option>
                      </select>
                    </Field>

                    {selectedNode.attrs.binding?.type === "dynamic" ? (
                      <Field label="Pilih Field Dinamis">
                        <select
                          value={selectedNode.attrs.binding?.key ?? "participant_name"}
                          onChange={(e) =>
                            handleBindingChange({
                              key: e.target.value as CertificateFieldKey,
                            })
                          }
                          className={inputCls}
                        >
                          {CERTIFICATE_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ) : (
                      <Field label="Teks">
                        <input
                          value={(selectedNode.attrs.text as string) ?? ""}
                          onChange={(e) =>
                            handleBindingChange({ value: e.target.value })
                          }
                          className={inputCls}
                        />
                      </Field>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Ukuran Font">
                        <input
                          type="number"
                          value={(selectedNode.attrs.fontSize as number) ?? 16}
                          min={8}
                          max={160}
                          onChange={(e) =>
                            patchSelected({
                              fontSize: Math.max(
                                8,
                                Number(e.target.value) || 16,
                              ),
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Warna Teks">
                        <input
                          type="color"
                          value={
                            (selectedNode.attrs.fill as string) ?? "#000000"
                          }
                          onChange={(e) =>
                            patchSelected({ fill: e.target.value })
                          }
                          className="h-9 w-full cursor-pointer rounded-lg border border-gray-200"
                        />
                      </Field>
                    </div>

                    <Field label="Font Family">
                      <select
                        value={
                          (selectedNode.attrs.fontFamily as string) ??
                          FONT_OPTIONS[0]
                        }
                        onChange={(e) =>
                          patchSelected({ fontFamily: e.target.value })
                        }
                        className={inputCls}
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>
                            {font.split(",")[0].replace(/['"]/g, "")}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Gaya Font">
                        <select
                          value={
                            (selectedNode.attrs.fontStyle as string) ?? "normal"
                          }
                          onChange={(e) =>
                            patchSelected({ fontStyle: e.target.value })
                          }
                          className={inputCls}
                        >
                          {FONT_STYLES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Perataan">
                        <select
                          value={
                            (selectedNode.attrs.align as string) ?? "center"
                          }
                          onChange={(e) =>
                            patchSelected({ align: e.target.value })
                          }
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

                {(selectedNode.className === "Rect" ||
                  selectedNode.className === "Circle") && (
                  <div className="space-y-3">
                    <Field label="Warna Isian">
                      <input
                        type="color"
                        value={(selectedNode.attrs.fill as string) ?? "#3c85f3"}
                        onChange={(e) =>
                          patchSelected({ fill: e.target.value })
                        }
                        className="h-9 w-full cursor-pointer rounded-lg border border-gray-200"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Warna Garis">
                        <input
                          type="color"
                          value={
                            (selectedNode.attrs.stroke as string) ?? "#000000"
                          }
                          onChange={(e) =>
                            patchSelected({ stroke: e.target.value })
                          }
                          className="h-9 w-full cursor-pointer rounded-lg border border-gray-200"
                        />
                      </Field>
                      <Field label="Tebal Garis">
                        <input
                          type="number"
                          value={
                            (selectedNode.attrs.strokeWidth as number) ?? 0
                          }
                          min={0}
                          max={30}
                          onChange={(e) =>
                            patchSelected({
                              strokeWidth: Number(e.target.value) || 0,
                            })
                          }
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                {selectedNode.className === "Image" && (
                  <Field label="URL Gambar">
                    <input
                      value={(selectedNode.attrs.src as string) ?? ""}
                      onChange={(e) => patchSelected({ src: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                )}
              </div>
            </section>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
              Klik elemen pada kanvas untuk mengubah teks, ukuran, atau warnanya.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
