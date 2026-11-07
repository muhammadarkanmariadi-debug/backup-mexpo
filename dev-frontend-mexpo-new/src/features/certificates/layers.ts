// ============================================================
// Layer (z-order) helpers shared by the certificate and badge designers.
//
// A template is a Konva tree: `env.nodes` are Konva <Layer>s and each Layer's
// `children` are the design elements. Array order == stacking order, the LAST
// child is drawn on top. The layers panel shows the reverse (top first), the
// way every design tool does, so "above in the list" == "in front on canvas".
//
// Per-element extras live in `attrs` and are persisted with the template:
//   visible   (boolean)  Konva-native; false hides the element everywhere
//   locked    (boolean)  designer only; element can't be dragged/resized
//   layerName (string)   custom label shown in the panel
// The backend only validates `binding`, so these pass through untouched.
// ============================================================

import type {
  CertificateTemplateEnvelope,
  CertificateTemplateNode,
} from "@/entities/event/certificate-template.entity";
import { CERTIFICATE_FIELDS } from "./certificate-fields";

export type LayerKind = "text" | "rect" | "shape" | "image" | "qr" | "other";

export interface LayerRow {
  id: string;
  node: CertificateTemplateNode;
  kind: LayerKind;
  label: string;
  visible: boolean;
  locked: boolean;
  /** Index of the parent Konva Layer inside `env.nodes`. */
  parentIdx: number;
  /** Position inside the parent's children (0 = bottom-most). */
  index: number;
  /** Number of siblings in the parent (including this one). */
  count: number;
}

export type MoveAction = "front" | "forward" | "backward" | "back";

const SHAPE_CLASSES = ["Circle", "Ellipse", "Ring", "Star", "RegularPolygon", "Line", "Path"];

export function layerKind(node: CertificateTemplateNode): LayerKind {
  switch (node.className) {
    case "Text":
      return "text";
    case "Rect":
      return "rect";
    case "Image": {
      const b = node.attrs.binding;
      return b?.type === "dynamic" && b.key === "qr_code" ? "qr" : "image";
    }
    default:
      return SHAPE_CLASSES.includes(node.className) ? "shape" : "other";
  }
}

export function layerLabel(node: CertificateTemplateNode): string {
  const custom = node.attrs.layerName;
  if (typeof custom === "string" && custom.trim()) return custom.trim();

  switch (layerKind(node)) {
    case "text": {
      const b = node.attrs.binding;
      if (b?.type === "dynamic" && b.key) {
        return CERTIFICATE_FIELDS.find((f) => f.key === b.key)?.label ?? "Teks dinamis";
      }
      const t = (b?.value ?? node.attrs.text ?? "").toString().trim();
      return t ? (t.length > 28 ? `${t.slice(0, 28)}…` : t) : "Teks";
    }
    case "rect":
      return "Kotak";
    case "shape":
      return node.className === "Circle" ? "Lingkaran" : "Bentuk";
    case "qr":
      return "QR Code";
    case "image":
      return "Gambar";
    default:
      return node.className;
  }
}

/** Elements in on-screen order: front-most first, grouped by Konva Layer. */
export function listLayerRows(env: CertificateTemplateEnvelope): LayerRow[] {
  const rows: LayerRow[] = [];
  for (let p = env.nodes.length - 1; p >= 0; p--) {
    const children = env.nodes[p].children ?? [];
    for (let i = children.length - 1; i >= 0; i--) {
      const node = children[i];
      const id = node.attrs.id;
      if (!id) continue;
      rows.push({
        id,
        node,
        kind: layerKind(node),
        label: layerLabel(node),
        visible: node.attrs.visible !== false,
        locked: node.attrs.locked === true,
        parentIdx: p,
        index: i,
        count: children.length,
      });
    }
  }
  return rows;
}

/**
 * Apply `fn` to the children array that directly contains `id`.
 * `fn` returns the new array, or null for "no change".
 */
function withParent(
  env: CertificateTemplateEnvelope,
  id: string,
  fn: (children: CertificateTemplateNode[], index: number) => CertificateTemplateNode[] | null,
): CertificateTemplateEnvelope {
  let changed = false;
  const nodes = env.nodes.map((layer) => {
    if (changed || !layer.children) return layer;
    const index = layer.children.findIndex((c) => c.attrs.id === id);
    if (index < 0) return layer;
    const next = fn(layer.children, index);
    if (!next) return layer;
    changed = true;
    return { ...layer, children: next };
  });
  return changed ? { ...env, nodes } : env;
}

function moveWithin<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Change an element's stacking position within its parent. */
export function moveLayer(
  env: CertificateTemplateEnvelope,
  id: string,
  action: MoveAction,
): CertificateTemplateEnvelope {
  return withParent(env, id, (children, index) => {
    const last = children.length - 1;
    const target =
      action === "front"
        ? last
        : action === "back"
          ? 0
          : action === "forward"
            ? Math.min(index + 1, last)
            : Math.max(index - 1, 0);
    return target === index ? null : moveWithin(children, index, target);
  });
}

/**
 * Drag & drop: place `dragId` directly above/below `targetId`
 * ("above" = closer to the front). Both must share the same parent Layer.
 */
export function reorderLayer(
  env: CertificateTemplateEnvelope,
  dragId: string,
  targetId: string,
  place: "above" | "below",
): CertificateTemplateEnvelope {
  if (dragId === targetId) return env;
  return withParent(env, dragId, (children, from) => {
    if (!children.some((c) => c.attrs.id === targetId)) return null;
    const without = children.filter((_, i) => i !== from);
    const targetIdx = without.findIndex((c) => c.attrs.id === targetId);
    const insertAt = place === "above" ? targetIdx + 1 : targetIdx;
    const next = [...without.slice(0, insertAt), children[from], ...without.slice(insertAt)];
    return next.every((n, i) => n === children[i]) ? null : next;
  });
}

/** Merge `patch` into one element's attrs. Passing `undefined` removes a key. */
export function patchLayerAttrs(
  env: CertificateTemplateEnvelope,
  id: string,
  patch: Record<string, unknown>,
): CertificateTemplateEnvelope {
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] =>
    nodes.map((n) => {
      const children = n.children ? go(n.children) : undefined;
      if (n.attrs.id === id) {
        const attrs: Record<string, unknown> = { ...n.attrs, ...patch };
        for (const k of Object.keys(patch)) {
          if (patch[k] === undefined) delete attrs[k];
        }
        return { ...n, attrs: attrs as CertificateTemplateNode["attrs"], ...(children ? { children } : {}) };
      }
      return children ? { ...n, children } : n;
    });
  return { ...env, nodes: go(env.nodes) };
}
