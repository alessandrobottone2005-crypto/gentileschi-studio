import React from "react";
import type { Slide } from "../types/template";
import type { SceneNode } from "../types/scene";
import { resolveText } from "../engine/scene";
import { SCENE_ASSETS } from "../engine/sceneAssets";
import { DEFAULT_IMAGES } from "../engine/defaultAssets";
import { calculateAdaptiveFontSize } from "../engine/adaptiveLayout";
import { PhotoImage } from "./PhotoImage";
import { fitTextToBox } from "../engine/fitText";

export interface SceneInteraction {
  editingText?: string;
  onTextEdit?: (id: string) => void;
  onTextCommit?: (node: SceneNode, text: string) => void;
  onTextCancel?: () => void;
  cropping?: string;
  selected: string[];
  onSelect: (id: string, additive: boolean) => void;
  onGesture: (
    event: React.PointerEvent,
    node: SceneNode,
    operation: "move" | "resize" | "rotate",
  ) => void;
}
export function SceneRenderer({
  slide,
  interaction,
}: {
  slide: Slide;
  interaction?: SceneInteraction;
}) {
  const scene = slide.scene!;
  const render = (node: SceneNode, ancestorLocked = false): React.ReactNode => {
    if (!node.visible) return null;
    const selected = interaction?.selected.includes(node.id);
    const media =
      node.binding === "image" ? slide.content.image || node.media : node.media;
    const source =
      media?.url ||
      (media?.assetKey
        ? DEFAULT_IMAGES[media.assetKey]
        : media?.assetId
          ? SCENE_ASSETS[media.assetId]
          : undefined);
    const text = resolveText(slide, node);
    const autoFont =
      node.id.startsWith("legacy:") &&
      !node.overrides?.includes("style.fontSize");
    const adaptiveSize =
      autoFont && slide.templateType === "cover" && node.binding === "title"
        ? calculateAdaptiveFontSize(text, 128, 80, 20)
        : autoFont &&
            slide.templateType === "notice" &&
            node.binding === "paragraph1"
          ? calculateAdaptiveFontSize(text, 29, 21, 140)
          : autoFont &&
              slide.templateType === "notice" &&
              node.binding === "paragraph2"
            ? calculateAdaptiveFontSize(text, 27, 20, 140)
            : undefined;
    const itemId =
      node.agendaContext ||
      node.agendaItemId ||
      (node.binding?.startsWith("item:")
        ? node.binding.split(":")[1]
        : undefined);
    const item =
      itemId && "items" in slide.content
        ? slide.content.items.find((item) => item.id === itemId)
        : undefined;
    const defaults: React.CSSProperties =
      item && node.autoStyle === "theme" && node.agendaRole
        ? scene.agendaStyles?.[item.isHighlight ? "highlight" : "normal"]?.[
            node.agendaRole
          ] || {}
        : item && (node.autoStyle === "legacy" || node.id.startsWith("legacy:"))
          ? node.agendaRole === "row"
            ? { backgroundColor: item.isHighlight ? "#dfff2f" : "#f4f0e6" }
            : node.agendaRole === "badge"
              ? { backgroundColor: item.isHighlight ? "#10143d" : "#1728e8" }
              : node.agendaRole === "text"
                ? {
                    fontFamily: item.isHighlight
                      ? "'Archivo Black', sans-serif"
                      : "'Inter', sans-serif",
                    fontSize: item.isHighlight ? 38 : 27,
                    lineHeight: 1.25,
                    fontWeight: item.isHighlight ? 400 : 500,
                    textTransform: item.isHighlight ? "uppercase" : "none",
                  }
                : {}
          : {};
    const highlightStyle = Object.fromEntries(
      Object.entries(defaults).filter(
        ([key]) => !node.overrides?.includes(`style.${key}`),
      ),
    );
    const themeFit =
      node.id.startsWith("figma:") &&
      node.kind === "text" &&
      text !== node.text &&
      !node.overrides?.includes("style.fontSize")
        ? fitTextToBox(text, node.style, node.width, node.height)
        : {};
    const adaptiveStyle = adaptiveSize
      ? {
          fontSize: adaptiveSize,
          ...(!node.overrides?.includes("style.lineHeight")
            ? { lineHeight: slide.templateType === "cover" ? 0.88 : 1.4 }
            : {}),
        }
      : {};
    return (
      <div
        key={node.id}
        data-scene-node={node.id}
        data-node-name={node.name}
        onDoubleClick={
          interaction && node.kind === "text" && !node.locked && !ancestorLocked
            ? (event) => {
                event.stopPropagation();
                interaction.onTextEdit?.(node.id);
              }
            : undefined
        }
        onPointerDown={
          interaction && !node.locked && !ancestorLocked
            ? (event) => {
                if ((event.target as HTMLElement).closest("textarea")) return;
                event.stopPropagation();
                interaction.onSelect(
                  node.id,
                  event.shiftKey || event.metaKey || event.ctrlKey,
                );
                if (!event.shiftKey && !event.metaKey && !event.ctrlKey)
                  interaction.onGesture(event, node, "move");
              }
            : undefined
        }
        style={{
          ...node.style,
          ...highlightStyle,
          ...adaptiveStyle,
          ...themeFit,
          position: "absolute",
          left: node.x,
          top: node.y,
          width: node.width,
          height: node.height,
          opacity: node.opacity,
          transform: `${node.baseTransform || ""} rotate(${node.rotation}deg) scale(${node.scale ?? 1})`,
          transformOrigin:
            node.scale && !node.baseTransform
              ? "0 0"
              : node.style.transformOrigin || "center",
          boxSizing: "border-box",
          userSelect: interaction ? "none" : undefined,
          cursor: interaction ? (node.locked ? "default" : "move") : undefined,
          overflow:
            interaction && selected
              ? "visible"
              : node.kind === "image" && !media?.crop && media?.effects?.enabled
                ? "visible"
                : node.style.overflow,
        }}
      >
        {node.kind === "text" ? (
          interaction?.editingText === node.id ? (
            <textarea
              aria-label="Modifica testo sulla slide"
              autoFocus
              defaultValue={text}
              className="canvas-text-input"
              style={{
                font: "inherit",
                lineHeight: "inherit",
                letterSpacing: "inherit",
                color: "inherit",
                textAlign: node.style.textAlign,
              }}
              onBlur={(e) => interaction.onTextCommit?.(node, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  interaction.onTextCancel?.();
                }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter")
                  e.currentTarget.blur();
              }}
            />
          ) : (
            text
          )
        ) : node.kind === "image" || node.kind === "vector" ? (
          source && !media?.missing ? (
            node.kind === "vector" && node.editedStyle && node.style.color ? (
              <div
                data-vector-source={source}
                style={{
                  width: "100%",
                  height: "100%",
                  background: node.style.color,
                  maskImage: `url("${source}")`,
                  WebkitMaskImage: `url("${source}")`,
                  maskSize:
                    node.style.objectFit === "fill" ? "100% 100%" : "contain",
                  WebkitMaskSize:
                    node.style.objectFit === "fill" ? "100% 100%" : "contain",
                  maskPosition: node.style.objectPosition || "center",
                  WebkitMaskPosition: node.style.objectPosition || "center",
                  maskRepeat: "no-repeat",
                }}
              />
            ) : node.kind === "image" ? (
              <PhotoImage
                source={source}
                media={media}
                width={node.width}
                height={node.height}
                objectFit={node.style.objectFit}
                objectPosition={
                  node.style.objectPosition
                    ? String(node.style.objectPosition)
                    : undefined
                }
                transformOrigin={String(
                  node.imageTransformOrigin ||
                    node.style.transformOrigin ||
                    "center",
                )}
              />
            ) : (
              <img
                src={source}
                alt=""
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: node.style.objectFit || "contain",
                  objectPosition: node.style.objectPosition,
                  transformOrigin:
                    node.imageTransformOrigin || node.style.transformOrigin,
                  pointerEvents: "none",
                }}
              />
            )
          ) : (
            <span
              data-missing-media="true"
              style={{
                background: "#5a1731",
                color: "#fff",
                display: "block",
                fontSize: 24,
              }}
            >
              Immagine non disponibile
            </span>
          )
        ) : (
          node.children?.map((child) =>
            render(child, ancestorLocked || node.locked),
          )
        )}
        {interaction && selected && (
          <div className="scene-selection" aria-hidden="true">
            {!node.locked && !ancestorLocked && (
              <>
                <button
                  type="button"
                  tabIndex={-1}
                  className="scene-resize"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    interaction.onGesture(event, node, "resize");
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="scene-rotate"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    interaction.onGesture(event, node, "rotate");
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>
    );
  };
  return (
    <div
      data-scene-frame="true"
      style={{
        width: scene.width,
        height: scene.height,
        position: "relative",
        background: scene.background,
        overflow: "hidden",
      }}
    >
      {scene.nodes.map((node) => render(node))}
    </div>
  );
}
