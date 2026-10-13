import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Group,
  Ungroup,
} from "lucide-react";
import type { Slide } from "../types/template";
import type { SceneNode, SlideScene } from "../types/scene";
import {
  allNodes,
  clone,
  duplicateNode,
  editText,
  findNode,
  groupNodes,
  makeNode,
  parentNodes,
  removeNodes,
  reorderNode,
  resolveText,
  ungroupNode,
  updateNode,
} from "../engine/scene";
import {
  DECORATIONS,
  SCENE_ASSETS,
  decorationLabel,
  decorationColor,
} from "../engine/sceneAssets";
import { DEFAULT_IMAGES } from "../engine/defaultAssets";
import { ImageControl } from "./ImageControl";
import { MediaPicker } from "../studio/MediaLibrary";

function hexColor(value: unknown, fallback = "#ffffff") {
  if (typeof value !== "string") return fallback;
  if (/^#[\da-f]{6}$/i.test(value)) return value;
  const rgb = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return rgb
    ? "#" +
        rgb
          .slice(1)
          .map((part) => Number(part).toString(16).padStart(2, "0"))
          .join("")
    : fallback;
}
export function GraphicPanel({
  slide,
  selected,
  onSelect,
  onChange,
  aspectLocked,
  onAspectLocked,
}: {
  slide: Slide;
  selected: string[];
  onSelect: (id: string, additive: boolean) => void;
  onChange: (slide: Slide | ((current: Slide) => Slide)) => void;
  aspectLocked: boolean;
  onAspectLocked: (value: boolean) => void;
}) {
  const scene = slide.scene!;
  const node = selected.length === 1 ? findNode(scene, selected[0]) : undefined;
  const [error, setError] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const commit = (next: SlideScene) => {
    onChange({ ...slide, scene: next });
    setError("");
  };
  const patch = (change: Partial<SceneNode>) => {
    if (node) commit(updateNode(scene, node.id, change));
  };
  const style = (change: SceneNode["style"]) =>
    patch({ style: change, editedStyle: true });
  const effectiveLocked =
    node?.locked ||
    (node && parentNodes(scene, node.id)?.some((parent) => parent.locked));
  const currentColor =
    node?.kind === "vector" && !node.editedStyle
      ? decorationColor(node.media?.assetId)
      : hexColor(
          node?.kind === "shape" || node?.kind === "group"
            ? node.style.backgroundColor
            : node?.style.color,
        );
  const add = (kind: SceneNode["kind"], assetId?: string) => {
    const next = makeNode(kind);
    if (assetId) {
      next.media = { assetId };
      next.name = decorationLabel(assetId);
      next.style = {};
    }
    commit({ ...scene, nodes: [...scene.nodes, next] });
    onSelect(next.id, false);
  };
  const duplicate = () => {
    if (!node) return;
    const resolved = clone(scene);
    allNodes(resolved.nodes).forEach((item) => {
      if (item.kind === "text") item.text = resolveText(slide, item);
      if (item.binding === "image")
        item.media = clone(slide.content.image || item.media);
    });
    const next = duplicateNode(resolved, node.id);
    commit(next.scene);
    onSelect(next.id, false);
  };
  const group = () => {
    const frame = document.querySelector<HTMLElement>(
      ".editor-preview-panel [data-scene-frame]",
    );
    const frameBox = frame?.getBoundingClientRect();
    const scale = frameBox && frameBox.width / scene.width;
    const boxes = selected.flatMap((id) => {
      const element = frame?.querySelector<HTMLElement>(
        `[data-scene-node="${id}"]`,
      );
      const box = element?.getBoundingClientRect();
      return box && box.width ? [box] : [];
    });
    const bounds =
      scale && boxes.length === selected.length
        ? {
            x:
              (Math.min(...boxes.map((box) => box.left)) - frameBox!.left) /
              scale,
            y:
              (Math.min(...boxes.map((box) => box.top)) - frameBox!.top) /
              scale,
            width:
              (Math.max(...boxes.map((box) => box.right)) -
                Math.min(...boxes.map((box) => box.left))) /
              scale,
            height:
              (Math.max(...boxes.map((box) => box.bottom)) -
                Math.min(...boxes.map((box) => box.top))) /
              scale,
          }
        : undefined;
    const next = groupNodes(scene, selected, bounds);
    if (allNodes(next.nodes).length === allNodes(scene.nodes).length) {
      setError("Seleziona almeno due elementi nello stesso gruppo.");
      return;
    }
    const oldIds = new Set(allNodes(scene.nodes).map((item) => item.id));
    commit(next);
    onSelect(
      allNodes(next.nodes).find(
        (item) => item.kind === "group" && !oldIds.has(item.id),
      )?.id || "",
      false,
    );
  };
  const renderLayers = (nodes: SceneNode[], depth = 0): React.ReactNode =>
    [...nodes].reverse().map((item) => (
      <React.Fragment key={item.id}>
        <div
          className={`graphic-layer ${selected.includes(item.id) ? "is-selected" : ""}`}
          style={{ paddingLeft: 4 + depth * 12 }}
        >
          <button
            type="button"
            className="graphic-layer-name"
            aria-pressed={selected.includes(item.id)}
            onClick={(event) =>
              onSelect(
                item.id,
                event.shiftKey || event.metaKey || event.ctrlKey,
              )
            }
          >
            {item.kind === "group" ? "▸ " : ""}
            {item.name}
          </button>
          <input
            type="checkbox"
            aria-label={`Selezione multipla: ${item.name}`}
            checked={selected.includes(item.id)}
            onChange={() => onSelect(item.id, true)}
          />
          <button
            type="button"
            aria-label={`${item.visible ? "Nascondi" : "Mostra"} ${item.name}`}
            onClick={() =>
              commit(updateNode(scene, item.id, { visible: !item.visible }))
            }
          >
            {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            type="button"
            aria-label={`${item.locked ? "Sblocca" : "Blocca"} ${item.name}`}
            onClick={() =>
              commit(updateNode(scene, item.id, { locked: !item.locked }))
            }
          >
            {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>
        </div>
        {item.children && renderLayers(item.children, depth + 1)}
      </React.Fragment>
    ));
  const number = (
    label: string,
    value: number,
    change: (value: number) => void,
    min?: number,
    max?: number,
  ) => (
    <label>
      {label}
      <input
        type="number"
        step="0.1"
        value={Math.round(value * 10) / 10}
        min={min}
        max={max}
        onChange={(event) => {
          const val = event.target.valueAsNumber;
          if (
            Number.isFinite(val) &&
            (min === undefined || val >= min) &&
            (max === undefined || val <= max)
          )
            change(val);
        }}
      />
    </label>
  );
  return (
    <div className="graphic-panel">
      <div className="graphic-add">
        <button type="button" onClick={() => add("text")}>
          + Testo
        </button>
        <button type="button" onClick={() => add("shape")}>
          + Forma
        </button>
        <button type="button" onClick={() => setShowMedia(true)}>
          + Foto
        </button>
        <label>
          Decorazione
          <select
            aria-label="Decorazione"
            value=""
            onChange={(event) => {
              if (event.target.value) add("vector", event.target.value);
            }}
          >
            <option value="">Aggiungi…</option>
            {DECORATIONS.map((key) => (
              <option value={key} key={key}>
                {decorationLabel(key)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="graphic-background">
        Sfondo
        <input
          type="color"
          value={hexColor(scene.background, "#1728e8")}
          onChange={(event) =>
            commit({
              ...scene,
              background: event.target.value,
              backgroundModified: true,
            })
          }
        />
      </label>
      <div className="graphic-actions">
        <button
          type="button"
          disabled={
            selected.length < 2 ||
            selected.some(
              (id) =>
                findNode(scene, id)?.locked ||
                parentNodes(scene, id)?.some((parent) => parent.locked),
            )
          }
          onClick={group}
        >
          <Group size={16} />
          Raggruppa
        </button>
        <button
          type="button"
          disabled={node?.kind !== "group" || !!effectiveLocked}
          onClick={() => {
            if (node) {
              commit(ungroupNode(scene, node.id));
              onSelect("", false);
            }
          }}
        >
          <Ungroup size={16} />
          Separa
        </button>
      </div>
      {error && (
        <p role="alert" className="app-error">
          {error}
        </p>
      )}
      {node ? (
        <>
          <div className="graphic-section-heading">
            <h3>Proprietà</h3>
            <span>
              {node.kind === "text"
                ? "Testo"
                : node.kind === "group"
                  ? "Gruppo"
                  : "Elemento"}
            </span>
          </div>
          <fieldset disabled={!!effectiveLocked} className="graphic-properties">
            <label>
              Nome elemento
              <input
                value={node.name}
                onChange={(event) => patch({ name: event.target.value })}
              />
            </label>
            {node.kind === "text" && (
              <>
                <label>
                  Testo
                  <textarea
                    aria-label="Testo"
                    rows={3}
                    value={resolveText(slide, node)}
                    onChange={(event) =>
                      onChange(editText(slide, node, event.target.value))
                    }
                  />
                </label>
                {(!node.binding || node.binding.startsWith("custom:")) && (
                  <label className="graphic-check">
                    <input
                      type="checkbox"
                      checked={!!node.binding}
                      onChange={(event) => {
                        if (event.target.checked) {
                          const key = node.id;
                          onChange({
                            ...slide,
                            customFields: {
                              ...slide.customFields,
                              [key]: resolveText(slide, node),
                            },
                            scene: updateNode(scene, node.id, {
                              binding: `custom:${key}`,
                            }),
                          });
                        } else
                          onChange({
                            ...slide,
                            scene: updateNode(scene, node.id, {
                              binding: undefined,
                              text: resolveText(slide, node),
                            }),
                          });
                      }}
                    />
                    Campo compilabile nei nuovi progetti
                  </label>
                )}
              </>
            )}
            <div className="graphic-property-grid">
              {number("X", node.x, (x) => patch({ x }))}
              {number("Y", node.y, (y) => patch({ y }))}
              {number(
                "Larghezza",
                node.width * (node.scale || 1),
                (width) =>
                  patch(
                    node.kind === "group"
                      ? { scale: width / node.width }
                      : { width },
                  ),
                1,
              )}
              {number(
                "Altezza",
                node.height * (node.scale || 1),
                (height) =>
                  patch(
                    node.kind === "group"
                      ? { scale: height / node.height }
                      : { height },
                  ),
                1,
              )}
              {number("Rotazione (°)", node.rotation, (rotation) =>
                patch({ rotation }),
              )}
              {number(
                "Opacità",
                node.opacity,
                (opacity) => patch({ opacity }),
                0,
                1,
              )}
            </div>
            <label className="graphic-check">
              <input
                type="checkbox"
                checked={aspectLocked}
                onChange={(event) => onAspectLocked(event.target.checked)}
              />
              Mantieni proporzioni durante il ridimensionamento
            </label>
            {node.kind !== "image" && (
              <div className="graphic-property-grid">
                <label>
                  Colore
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(event) =>
                      style(
                        node.kind === "shape" || node.kind === "group"
                          ? { backgroundColor: event.target.value }
                          : { color: event.target.value },
                      )
                    }
                  />
                </label>
                <label>
                  Colore esadecimale
                  <input
                    type="text"
                    maxLength={7}
                    defaultValue={currentColor}
                    key={`${node.id}:${node.style.color}:${node.style.backgroundColor}`}
                    onChange={(event) => {
                      if (/^#[\da-f]{6}$/i.test(event.target.value))
                        style(
                          node.kind === "shape" || node.kind === "group"
                            ? { backgroundColor: event.target.value }
                            : { color: event.target.value },
                        );
                    }}
                  />
                </label>
              </div>
            )}
            {node.kind === "text" && (
              <>
                <label>
                  Font
                  <select
                    aria-label="Font"
                    value={String(node.style.fontFamily || "Inter")
                      .split(",")[0]
                      .replace(/['"]/g, "")
                      .trim()}
                    onChange={(event) =>
                      style({ fontFamily: event.target.value })
                    }
                  >
                    {[
                      "Inter",
                      "Archivo Black",
                      "Roboto Mono",
                      "Comic Neue",
                    ].map((font) => (
                      <option key={font}>{font}</option>
                    ))}
                  </select>
                </label>
                <div className="graphic-property-grid">
                  {number(
                    "Dimensione testo",
                    parseFloat(String(node.style.fontSize || 48)),
                    (fontSize) => style({ fontSize }),
                    1,
                    1000,
                  )}
                  {number(
                    "Interlinea (px)",
                    typeof node.style.lineHeight === "number"
                      ? node.style.lineHeight *
                          parseFloat(String(node.style.fontSize || 48))
                      : parseFloat(String(node.style.lineHeight)) ||
                          parseFloat(String(node.style.fontSize)) * 1.2,
                    (value) => style({ lineHeight: `${value}px` }),
                    1,
                  )}
                  {number(
                    "Spaziatura lettere (px)",
                    parseFloat(String(node.style.letterSpacing)) || 0,
                    (value) => style({ letterSpacing: `${value}px` }),
                  )}
                  <label>
                    Peso
                    <select
                      aria-label="Peso"
                      value={String(node.style.fontWeight || 400)}
                      onChange={(event) =>
                        style({ fontWeight: Number(event.target.value) })
                      }
                    >
                      {[400, 500, 600, 700, 800, 900].map((weight) => (
                        <option value={weight} key={weight}>
                          {weight}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Allineamento
                  <select
                    aria-label="Allineamento"
                    value={node.style.textAlign || "left"}
                    onChange={(event) =>
                      style({
                        textAlign: event.target.value as
                          | "left"
                          | "center"
                          | "right",
                      })
                    }
                  >
                    <option value="left">Sinistra</option>
                    <option value="center">Centro</option>
                    <option value="right">Destra</option>
                  </select>
                </label>
              </>
            )}
            {node.kind === "shape" &&
              number(
                "Arrotondamento",
                parseFloat(String(node.style.borderRadius || 0)),
                (value) => style({ borderRadius: value }),
                0,
              )}
            <div className="graphic-actions">
              <button type="button" onClick={duplicate}>
                <Copy size={16} />
                Duplica
              </button>
              <button
                type="button"
                onClick={() => {
                  commit(removeNodes(scene, [node.id]));
                  onSelect("", false);
                }}
              >
                <Trash2 size={16} />
                Elimina
              </button>
              <button
                type="button"
                onClick={() => commit(reorderNode(scene, node.id, 1))}
              >
                <ArrowUp size={16} />
                Davanti
              </button>
              <button
                type="button"
                onClick={() => commit(reorderNode(scene, node.id, -1))}
              >
                <ArrowDown size={16} />
                Dietro
              </button>
              <button
                type="button"
                onClick={() => {
                  const parent = parentNodes(scene, node.id)?.at(-1);
                  const width = parent?.width || scene.width;
                  patch({ x: (width - node.width) / 2 });
                }}
              >
                Centra X
              </button>
              <button
                type="button"
                onClick={() => {
                  const parent = parentNodes(scene, node.id)?.at(-1);
                  const height = parent?.height || scene.height;
                  patch({ y: (height - node.height) / 2 });
                }}
              >
                Centra Y
              </button>
            </div>
          </fieldset>
          {effectiveLocked && (
            <p>
              Elemento bloccato. Usa il lucchetto nell’elenco per sbloccarlo.
            </p>
          )}
          {node.kind === "image" && !effectiveLocked && (
            <ImageControl
              image={
                node.binding === "image"
                  ? slide.content.image || node.media
                  : node.media
              }
              defaultImageUrl={
                node.media?.assetId
                  ? SCENE_ASSETS[node.media.assetId]
                  : DEFAULT_IMAGES[slide.templateType]
              }
              onChange={(image) =>
                onChange((current) =>
                  node.binding === "image"
                    ? ({
                        ...current,
                        content: { ...current.content, image },
                      } as Slide)
                    : {
                        ...current,
                        scene: updateNode(current.scene!, node.id, {
                          media: image,
                        }),
                      },
                )
              }
              onReset={() =>
                node.binding === "image"
                  ? onChange({
                      ...slide,
                      content: {
                        ...slide.content,
                        image: { assetKey: slide.templateType },
                      },
                    } as Slide)
                  : patch({ media: undefined })
              }
            />
          )}
        </>
      ) : (
        <p className="graphic-help">
          {selected.length
            ? `${selected.length} elementi selezionati.`
            : "Tocca un elemento nella slide o selezionalo nell’elenco per modificarlo."}
        </p>
      )}
      <div className="graphic-section-heading">
        <h3>Elementi</h3>
        <span>{allNodes(scene.nodes).length}</span>
      </div>
      <p className="graphic-help">
        Gli elementi in alto sono davanti. Usa le caselle per una selezione
        multipla.
      </p>
      <div className="graphic-layers">{renderLayers(scene.nodes)}</div>
      {showMedia && (
        <MediaPicker
          onClose={() => setShowMedia(false)}
          onSelect={(image) => {
            const next = makeNode("image");
            next.media = image;
            next.style = { objectFit: "contain", overflow: "hidden" };
            commit({ ...scene, nodes: [...scene.nodes, next] });
            onSelect(next.id, false);
            setShowMedia(false);
          }}
        />
      )}
    </div>
  );
}
