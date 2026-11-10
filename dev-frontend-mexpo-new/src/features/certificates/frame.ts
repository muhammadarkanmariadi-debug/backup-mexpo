// ============================================================
// Certificate frame (bingkai) as its own layer.
//
// The Mexpo frame artwork (`/images/cert.png`, transparent centre) used to be
// the template *background image*, so switching the background to a colour
// wiped the frame too. The frame is now a locked Image node at the bottom of
// the first Konva Layer: it sits above any background (colour or image) and
// below every other element, and the layers panel can hide/unlock it.
// ============================================================

import type {
  CertificateTemplateEnvelope,
  CertificateTemplateNode,
} from "@/entities/event/certificate-template.entity";

const DEFAULT_FRAME_URL = "/images/cert.png";
const FRAME_NODE_ID = "cert-frame";

export function makeFrameNode(width: number, height: number): CertificateTemplateNode {
  return {
    className: "Image",
    attrs: {
      id: FRAME_NODE_ID,
      x: 0,
      y: 0,
      width,
      height,
      src: DEFAULT_FRAME_URL,
      opacity: 1,
      locked: true,
      layerName: "Bingkai",
    },
  };
}

const containsFrame = (nodes: CertificateTemplateNode[]): boolean =>
  nodes.some((n) => n.attrs.id === FRAME_NODE_ID || (n.children ? containsFrame(n.children) : false));

export function hasFrame(env: CertificateTemplateEnvelope): boolean {
  return containsFrame(env.nodes);
}

const withoutFrame = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] =>
  nodes
    .filter((n) => n.attrs.id !== FRAME_NODE_ID)
    .map((n) => (n.children ? { ...n, children: withoutFrame(n.children) } : n));

/** Adds (bottom of the first Layer) or removes the default frame. */
export function setFrame(
  env: CertificateTemplateEnvelope,
  enabled: boolean,
): CertificateTemplateEnvelope {
  const nodes = withoutFrame(env.nodes);
  if (!enabled) return { ...env, nodes };

  const frame = makeFrameNode(env.width, env.height);
  const layerIdx = nodes.findIndex((n) => n.className === "Layer");
  if (layerIdx === -1) {
    return {
      ...env,
      nodes: [{ className: "Layer", attrs: { id: "main-layer" }, children: [frame] }, ...nodes],
    };
  }
  return {
    ...env,
    nodes: nodes.map((n, i) =>
      i === layerIdx ? { ...n, children: [frame, ...(n.children ?? [])] } : n,
    ),
  };
}

/** Keeps the frame covering the whole canvas after a width/height change. */
export function fitFrame(env: CertificateTemplateEnvelope): CertificateTemplateEnvelope {
  const go = (nodes: CertificateTemplateNode[]): CertificateTemplateNode[] =>
    nodes.map((n) =>
      n.attrs.id === FRAME_NODE_ID
        ? { ...n, attrs: { ...n.attrs, x: 0, y: 0, width: env.width, height: env.height } }
        : n.children
          ? { ...n, children: go(n.children) }
          : n,
    );
  return hasFrame(env) ? { ...env, nodes: go(env.nodes) } : env;
}

/**
 * Templates saved before the frame became a layer carry it as the background
 * image. Lift it out (white background + frame layer) so it survives a switch
 * to a colour background. Looks identical; other templates are untouched.
 */
export function liftLegacyFrame(env: CertificateTemplateEnvelope): CertificateTemplateEnvelope {
  if (env.background.type !== "image" || env.background.url !== DEFAULT_FRAME_URL) return env;
  return setFrame({ ...env, background: { type: "color", value: "#ffffff" } }, true);
}
