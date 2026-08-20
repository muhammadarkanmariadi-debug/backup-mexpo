"use client";

import {
  Stage,
  Layer,
  Group,
  Rect,
  Text,
  Circle,
  Ellipse,
  Line,
  Path,
  Star,
  Ring,
  RegularPolygon,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import type { Stage as StageType } from "konva/lib/Stage";
import type { Node as KonvaNodeType } from "konva/lib/Node";
import type { Transformer as TransformerType } from "konva/lib/shapes/Transformer";

import {
  CertificateData,
  CertificateTemplateEnvelope,
  CertificateTemplateNode,
} from "@/entities/event/certificate-template.entity";
import { resolveBinding } from "./certificate-fields";
import { useImage } from "./useImage";

/** Baked geometry written back to the template after a designer drag/resize. */
export interface NodeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CertificateStageProps {
  template: CertificateTemplateEnvelope;
  data: CertificateData;
  /** Konva stage handle used for export (PNG/PDF). Optional. */
  stageRef?: React.MutableRefObject<StageType | null>;
  /** Designer mode: nodes become draggable + selectable + resizable. */
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onGeometry?: (id: string, geometry: NodeGeometry) => void;
  transformerRef?: React.MutableRefObject<TransformerType | null>;
  /**
   * Fit-to-container factor (0..1). Scales the Konva stage itself
   * (`scaleX/scaleY` + matching canvas size) so the canvas visually fits a
   * smaller container — Konva keeps pointer/transformer coordinates correct.
   * Default 1 = render at logical size.
   */
  fitScale?: number;
}

interface NodeRendererProps {
  node: CertificateTemplateNode;
  data: CertificateData;
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onGeometry?: (id: string, geometry: NodeGeometry) => void;
}

/** Raster image node — Konva needs an HTMLImageElement, we store the URL. */
function KonvaImageNode({ src, ...rest }: { src: string; [k: string]: unknown }) {
  const image = useImage(src);
  if (!image) return null;
  return <KonvaImage image={image} {...(rest as object)} />;
}

function bakeGeometry(node: KonvaNodeType): NodeGeometry {
  const scaleX = node.scaleX() || 1;
  const scaleY = node.scaleY() || 1;
  return {
    x: node.x(),
    y: node.y(),
    width: Math.max(1, Math.round((node.width() || 0) * scaleX)),
    height: Math.max(1, Math.round((node.height() || 0) * scaleY)),
    rotation: node.rotation(),
  };
}

function KonvaNodeRenderer({
  node,
  data,
  interactive,
  selectedId,
  onSelect,
  onGeometry,
}: NodeRendererProps) {
  const attrs = (node.attrs ?? {}) as Record<string, unknown> & {
    binding?: CertificateTemplateNode["attrs"]["binding"];
    src?: string;
    id?: string;
    text?: string;
  };
  const { binding, src, ...restRaw } = attrs;
  const rest = restRaw as object;
  const id = attrs.id;

  const interactionProps = interactive
    ? {
        draggable: true,
        onClick: () => onSelect?.(id ?? null),
        onTap: () => onSelect?.(id ?? null),
        onDragEnd: (e: { target: KonvaNodeType }) =>
          id ? onGeometry?.(id, bakeGeometry(e.target)) : undefined,
        onTransformEnd: (e: { target: KonvaNodeType }) =>
          id ? onGeometry?.(id, bakeGeometry(e.target)) : undefined,
      }
    : {};

  const childNodes = (node.children ?? []).map((child, i) => {
    const childId = (child.attrs?.id as string | undefined) ?? i;
    return (
      <KonvaNodeRenderer
        key={childId}
        node={child}
        data={data}
        interactive={interactive}
        selectedId={selectedId}
        onSelect={onSelect}
        onGeometry={onGeometry}
      />
    );
  });

  switch (node.className) {
    case "Layer":
      return (
        <Layer
          {...rest}
          {...(interactive
            ? {
                // Deselect only when the empty layer background (not a shape)
                // is pressed — avoids cancelling a shape selection on bubble.
                onMouseDown: (e: { target: KonvaNodeType; currentTarget: KonvaNodeType }) => {
                  if (e.target === e.currentTarget) onSelect?.(null);
                },
              }
            : {})}
        >
          {childNodes}
        </Layer>
      );
    case "Group":
      return (
        <Group
          {...rest}
          {...(interactive
            ? {
                onMouseDown: (e: { target: KonvaNodeType; currentTarget: KonvaNodeType }) => {
                  if (e.target === e.currentTarget) onSelect?.(null);
                },
              }
            : {})}
        >
          {childNodes}
        </Group>
      );
    case "Text": {
      const fallback = typeof attrs.text === "string" ? attrs.text : "";
      const value = resolveBinding(binding, data, fallback);
      return (
        <Text
          {...rest}
          {...interactionProps}
          text={value}
          id={id as string | undefined}
        >
          {childNodes}
        </Text>
      );
    }
    case "Rect":
      return (
        <Rect {...rest} {...interactionProps} id={id as string | undefined}>
          {childNodes}
        </Rect>
      );
    case "Circle":
      return (
        <Circle {...rest} {...interactionProps} id={id as string | undefined}>
          {childNodes}
        </Circle>
      );
    case "Ellipse":
      return (
        <Ellipse
          {...rest}
          {...interactionProps}
          id={id as string | undefined}
          radiusX={(restRaw.radiusX as number | undefined) ?? 1}
          radiusY={(restRaw.radiusY as number | undefined) ?? 1}
        >
          {childNodes}
        </Ellipse>
      );
    case "Line":
      return (
        <Line {...rest} {...interactionProps} id={id as string | undefined}>
          {childNodes}
        </Line>
      );
    case "Path":
      return (
        <Path {...rest} {...interactionProps} id={id as string | undefined}>
          {childNodes}
        </Path>
      );
    case "Star":
      return (
        <Star
          {...rest}
          {...interactionProps}
          id={id as string | undefined}
          numPoints={(restRaw.numPoints as number | undefined) ?? 5}
          innerRadius={(restRaw.innerRadius as number | undefined) ?? 30}
          outerRadius={(restRaw.outerRadius as number | undefined) ?? 60}
        >
          {childNodes}
        </Star>
      );
    case "Ring":
      return (
        <Ring
          {...rest}
          {...interactionProps}
          id={id as string | undefined}
          innerRadius={(restRaw.innerRadius as number | undefined) ?? 30}
          outerRadius={(restRaw.outerRadius as number | undefined) ?? 60}
        >
          {childNodes}
        </Ring>
      );
    case "RegularPolygon":
      return (
        <RegularPolygon
          {...rest}
          {...interactionProps}
          id={id as string | undefined}
          sides={(restRaw.sides as number | undefined) ?? 6}
          radius={(restRaw.radius as number | undefined) ?? 60}
        >
          {childNodes}
        </RegularPolygon>
      );
    case "Image":
      if (typeof src === "string" && src) {
        return (
          <KonvaImageNode
            key={src}
            src={src}
            {...rest}
            draggable={interactive}
            onClick={() => onSelect?.(id ?? null)}
            onTap={() => onSelect?.(id ?? null)}
            onDragEnd={(e: { target: KonvaNodeType }) =>
              id ? onGeometry?.(id, bakeGeometry(e.target)) : undefined
            }
            onTransformEnd={(e: { target: KonvaNodeType }) =>
              id ? onGeometry?.(id, bakeGeometry(e.target)) : undefined
            }
          />
        );
      }
      return null;
    default:
      return null;
  }
}

/**
 * Shared Konva certificate renderer — single source of truth used by BOTH the
 * visitor certificate modal and the owner/committee designer. Rendering and
 * the resolved data stay in sync because both go through this component.
 */
export function CertificateStage({
  template,
  data,
  stageRef,
  interactive,
  selectedId,
  onSelect,
  onGeometry,
  transformerRef,
  fitScale,
}: CertificateStageProps) {
  const { width, height, background, nodes } = template;
  const bgColor =
    background.type === "color" ? (background.value ?? "#ffffff") : undefined;
  const bgImage = background.type === "image" ? background.url : undefined;

  // Fit factor: shrink the canvas + scale the stage so a large certificate
  // stays fully visible. Konva maps pointer hits through stage.scale, so
  // drag/click/transform coordinates stay correct.
  const scale = Math.min(Math.max(fitScale ?? 1, 0.05), 1);
  const viewWidth = Math.round(width * scale);
  const viewHeight = Math.round(height * scale);

  return (
    <Stage
      ref={stageRef as React.MutableRefObject<StageType | null>}
      width={viewWidth}
      height={viewHeight}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={(e) => {
        if (interactive && e.target === e.target.getStage()) {
          onSelect?.(null);
        }
      }}
      onTouchStart={(e) => {
        if (interactive && e.target === e.target.getStage()) {
          onSelect?.(null);
        }
      }}
    >
      {/* Background layer (never interactive). */}
      <Layer listening={false}>
        {bgColor ? (
          <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
        ) : null}
        {bgImage ? (
          <KonvaImageNode
            key={bgImage}
            src={bgImage}
            x={0}
            y={0}
            width={width}
            height={height}
          />
        ) : null}
      </Layer>

      {/* Template layers. */}
      {nodes.map((node, i) => {
        const nodeId = (node.attrs?.id as string | undefined) ?? i;
        return (
          <KonvaNodeRenderer
            key={nodeId}
            node={node}
            data={data}
            interactive={interactive}
            selectedId={selectedId}
            onSelect={onSelect}
            onGeometry={onGeometry}
          />
        );
      })}

      {/* Selection handles (designer only). */}
      {interactive ? (
        <Layer>
          <Transformer
            ref={
              transformerRef as React.MutableRefObject<TransformerType | null>
            }
            rotateEnabled
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 8 || newBox.height < 8 ? oldBox : newBox
            }
          />
        </Layer>
      ) : null}
    </Stage>
  );
}