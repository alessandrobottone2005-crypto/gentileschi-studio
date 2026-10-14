import { useWorkspaceCamera } from "../hooks/useWorkspaceCamera";
import { useWorkspaceSelection } from "../hooks/useWorkspaceSelection";
import React, { useEffect, useState } from "react";
import {
  LayoutTemplate,
  Shapes,
  Type,
  Image,
  Upload,
  SlidersHorizontal,
  Layers,
  Hand,
  MousePointer2,
  ChevronDown,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown,
  Crop,
  X,
  Plus,
  Minus,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
} from "lucide-react";
import type {
  GraphicTheme,
  SceneNode,
  SlideScene,
  ProjectFormat,
} from "../../../shared/types/scene";
import { FORMATS } from "../../../shared/types/scene";
import type { Slide, SlideImage } from "../../../shared/types/template";
import {
  allNodes,
  makeNode,
  findNode,
  parentNodes,
  updateNode,
  removeNodes,
  reorderNode,
  ungroupNode,
} from "../../../shared/composition/scene";
import {
  SCENE_ASSETS,
  DECORATIONS,
  decorationLabel,
} from "../../../shared/composition/sceneAssets";
import { officialThemes } from "../../themes/model/themes";
import { listThemes } from "../../themes/services/themeService";
import { ThemeGallery } from "../../themes/ThemeGallery";
import { TemplateWrapper } from "../../../shared/rendering/TemplateWrapper";
import { GraphicCanvas } from "./GraphicCanvas";
import { GraphicPanel } from "./GraphicPanel";
import { StockPhotoPanel } from "../../media/StockPhotoPanel";
import { UploadsPanel } from "../../media/UploadsPanel";
import { PhotoTools, photoSource } from "../../media/PhotoTools";

type Panel =
  | "themes"
  | "elements"
  | "text"
  | "photos"
  | "uploads"
  | "data"
  | "advanced"
  | "layers"
  | "effects"
  | null;
const panels = [
  ["themes", "Temi", LayoutTemplate],
  ["elements", "Elementi", Shapes],
  ["text", "Testo", Type],
  ["photos", "Foto", Image],
  ["uploads", "Caricamenti", Upload],
  ["data", "Dati", SlidersHorizontal],
] as const;
export function StudioWorkspace({
  slide,
  selected,
  onSelect,
  onChange,
  format,
  themeId,
  onTheme,
  data,
  fitScale,
  stageRef,
  aspectLocked,
  onAspectLocked,
  guides,
  onGuides,
}: {
  slide: Slide | null;
  selected: string[];
  onSelect: (id: string, additive: boolean) => void;
  onChange: (slide: Slide | ((old: Slide) => Slide)) => void;
  format: ProjectFormat;
  themeId?: string;
  onTheme: (theme: GraphicTheme) => void;
  data: React.ReactNode;
  fitScale: number;
  stageRef: React.RefObject<HTMLDivElement>;
  aspectLocked: boolean;
  onAspectLocked: (locked: boolean) => void;
  guides: boolean;
  onGuides: (enabled: boolean) => void;
}) {
  const [panel, setPanel] = useState<Panel>(() =>
    window.innerWidth < 760 ? null : "themes",
  );
  const [themes, setThemes] = useState(officialThemes),
    [themeError, setThemeError] = useState("");
  const [cropping, setCropping] = useState<string>();
  const { zoom, setZoom, pan, setPan, hand, setHand, pointerDown, pointerMove, pointerEnd } = useWorkspaceCamera(format, stageRef);
  const [error, setError] = useState("");
  const [textRequest, setTextRequest] = useState<{
    id: string;
    nonce: number;
  }>();
  const scene = slide?.scene;
  const node =
    scene && selected.length === 1 ? findNode(scene, selected[0]) : undefined;
  const locked =
    !!node &&
    (node.locked || !!parentNodes(scene!, node.id)?.some((n) => n.locked));
  const image =
    node?.kind === "image"
      ? node.binding === "image"
        ? slide?.content.image || node.media
        : node.media
      : undefined;
  const scale = fitScale * zoom;
  useEffect(() => {
    let active = true;
    void listThemes()
      .then((t) => {
        if (active) setThemes(t);
      })
      .catch((e) => {
        if (active) setThemeError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    setCropping(undefined);
    setError("");
  }, [slide?.id, selected.join(",")]);
  const changeScene = (next: SlideScene) => {
    if (slide) onChange({ ...slide, scene: next });
  };
  const patch = (changes: Partial<SceneNode>) => {
    if (scene && node && !locked)
      changeScene(updateNode(scene, node.id, changes));
  };
  const style = (changes: SceneNode["style"]) =>
    patch({ style: changes, editedStyle: true });
  const photo = (media: SlideImage) => {
    if (!slide || !node || !scene || locked) return;
    onChange({
      ...slide,
      content:
        node.binding === "image"
          ? { ...slide.content, image: media }
          : slide.content,
      scene: updateNode(scene, node.id, { media }),
    });
  };
  const add = (kind: SceneNode["kind"], variant?: string) => {
    if (!scene) return;
    const next = makeNode(kind);
    next.x = scene.width / 2 - next.width / 2;
    next.y = scene.height / 2 - next.height / 2;
    if (kind === "text") next.style.color = "#102a52";
    if (variant && kind === "vector") {
      next.media = { assetId: variant };
      next.style = {};
      next.name = decorationLabel(variant);
    }
    if (variant === "circle") next.style.borderRadius = "50%";
    if (variant === "line") {
      next.height = 8;
      next.name = "Linea";
    }
    if (variant === "arrow") {
      next.kind = "vector";
      next.media = { assetId: "vectors/drawn-arrow-1.svg" };
      next.style = {};
      next.name = "Freccia";
    }
    changeScene({ ...scene, nodes: [...scene.nodes, next] });
    onSelect(next.id, false);
  };
  const insert = (media: SlideImage, replace: boolean) => {
    if (!scene || !slide) return;
    if (replace && node?.kind === "image" && !locked) {
      photo({
        ...media,
        effects: image?.effects,
        crop: image?.crop,
        scale: image?.scale,
        posX: image?.posX,
        posY: image?.posY,
      });
    } else {
      const next = makeNode("image");
      next.name = "Fotografia";
      next.width = 400;
      next.height = 500;
      next.x = (scene.width - 400) / 2;
      next.y = (scene.height - 500) / 2;
      next.style = { objectFit: "contain" };
      next.media = media;
      changeScene({ ...scene, nodes: [...scene.nodes, next] });
      onSelect(next.id, false);
    }
    if (window.innerWidth < 760) setPanel(null);
  };
  const { duplicate, group, align, distribute } = useWorkspaceSelection({ slide, scene, node, selected, locked, changeScene, onSelect, setError });
  const open = (target: Panel) =>
    setPanel((old) => (old === target ? null : target));
  const swatch = String(
    node?.kind === "shape" ? node.style.backgroundColor : node?.style.color,
  );
  const color = /^#[0-9a-f]{6}$/i.test(swatch) ? swatch : "#102a52";
  return (
    <div className="studio-workspace workspace">
      <nav className="workspace-rail" aria-label="Strumenti editor">
        {panels.map(([id, label, Icon]) => (
          <button
            type="button"
            key={id}
            aria-label={label}
            aria-pressed={panel === id}
            onClick={() => open(id)}
          >
            <Icon size={23} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {panel && (
        <aside className="workspace-panel editor-left-panel">
          <div className="workspace-panel-heading">
            <strong>
              {panels.find((p) => p[0] === panel)?.[1] ||
                (
                  {
                    advanced: "Avanzate",
                    layers: "Livelli",
                    effects: "Effetti foto",
                  } as any
                )[panel]}
            </strong>
            <button
              type="button"
              aria-label="Chiudi pannello"
              onClick={() => setPanel(null)}
            >
              <X size={18} />
            </button>
          </div>
          {panel === "themes" && (
            <>
              {themeError && <p role="alert">{themeError}</p>}
              <ThemeGallery
                themes={themes}
                selected={themeId || "gentileschi-original"}
                onSelect={onTheme}
              />
            </>
          )}
          {panel === "elements" && (
            <>
              <h2>Elementi</h2>
              <p>Forme e decorazioni dei temi Gentileschi.</p>
              <div className="element-grid">
                {[
                  ["rectangle", "Rettangolo"],
                  ["circle", "Cerchio"],
                  ["line", "Linea"],
                  ["arrow", "Freccia"],
                ].map(([id, label]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => add("shape", id)}
                  >
                    <span className={`element-sample ${id}`} />
                    {label}
                  </button>
                ))}
              </div>
              <h3>Decorazioni</h3>
              <div className="element-grid">
                {DECORATIONS.map((id) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => add("vector", id)}
                  >
                    <img src={SCENE_ASSETS[id]} alt="" />
                    {decorationLabel(id)}
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "text" && (
            <>
              <h2>Testo</h2>
              <button
                type="button"
                className="theme-use"
                onClick={() => add("text")}
              >
                Aggiungi una casella di testo
              </button>
              <p className="workspace-hint">
                Doppio clic su un testo della slide per modificarlo
                direttamente.
              </p>
              <button type="button" onClick={() => setPanel("advanced")}>
                Tipografia e campi personalizzati
              </button>
            </>
          )}
          {panel === "photos" && (
            <StockPhotoPanel
              canReplace={!!image && !locked}
              onInsert={insert}
            />
          )}
          {panel === "uploads" && (
            <UploadsPanel canReplace={!!image && !locked} onInsert={insert} />
          )}
          {panel === "data" && data}
          {panel === "advanced" && slide?.scene && (
            <GraphicPanel
              slide={slide}
              selected={selected}
              onSelect={onSelect}
              onChange={onChange}
              aspectLocked={aspectLocked}
              onAspectLocked={onAspectLocked}
            />
          )}
          {panel === "effects" &&
            (image && node ? (
              <PhotoTools
                key={node.id}
                image={image}
                onChange={photo}
                onReset={() =>
                  photo({
                    assetId: image.originalAssetId || image.assetId,
                    assetKey: image.originalAssetKey || image.assetKey,
                  })
                }
              />
            ) : (
              <p>Seleziona una fotografia sulla slide.</p>
            ))}
          {panel === "layers" && scene && (
            <>
              <p className="workspace-hint">
                Seleziona più elementi con le caselle o con Maiusc.
              </p>
              {allNodes(scene.nodes)
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    className={`workspace-layer ${selected.includes(item.id) ? "is-selected" : ""}`}
                    key={item.id}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Selezione multipla: ${item.name}`}
                      checked={selected.includes(item.id)}
                      onChange={() => onSelect(item.id, true)}
                    />
                    <button
                      type="button"
                      aria-pressed={selected.includes(item.id)}
                      onClick={(e) =>
                        onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey)
                      }
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      aria-label={`${item.visible ? "Nascondi" : "Mostra"} ${item.name}`}
                      onClick={() =>
                        changeScene(
                          updateNode(scene, item.id, {
                            visible: !item.visible,
                          }),
                        )
                      }
                    >
                      {item.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      type="button"
                      aria-label={`${item.locked ? "Sblocca" : "Blocca"} ${item.name}`}
                      onClick={() =>
                        changeScene(
                          updateNode(scene, item.id, { locked: !item.locked }),
                        )
                      }
                    >
                      {item.locked ? <Lock size={15} /> : <Unlock size={15} />}
                    </button>
                  </div>
                ))}
            </>
          )}
        </aside>
      )}
      <main
        className="workspace-stage editor-preview-panel"
        aria-label="Tela di lavoro"
      >
        <div
          className="workspace-context"
          aria-label="Strumenti della selezione"
        >
          {node ? (
            <>
              <span className="context-name">{node.name}</span>
              {node.kind === "text" && (
                <>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() =>
                      setTextRequest({ id: node.id, nonce: Date.now() })
                    }
                  >
                    Modifica testo
                  </button>
                  <select
                    aria-label="Font"
                    disabled={locked}
                    value={
                      String(node.style.fontFamily)
                        .replace(/['"]/g, "")
                        .split(",")[0]
                    }
                    onChange={(e) => style({ fontFamily: e.target.value })}
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
                  <input
                    type="number"
                    aria-label="Dimensione testo"
                    min={8}
                    max={500}
                    disabled={locked}
                    value={parseFloat(String(node.style.fontSize)) || 48}
                    onChange={(e) =>
                      style({ fontSize: Math.max(8, Number(e.target.value)) })
                    }
                  />
                  <button
                    type="button"
                    disabled={locked}
                    aria-label="Grassetto"
                    aria-pressed={Number(node.style.fontWeight) >= 700}
                    onClick={() =>
                      style({
                        fontWeight:
                          Number(node.style.fontWeight) >= 700 ? 400 : 700,
                      })
                    }
                  >
                    <b>B</b>
                  </button>
                </>
              )}
              {["text", "shape", "vector"].includes(node.kind) && (
                <input
                  type="color"
                  aria-label="Colore elemento"
                  value={color}
                  disabled={locked}
                  onChange={(e) =>
                    style(
                      node.kind === "shape"
                        ? { backgroundColor: e.target.value }
                        : { color: e.target.value },
                    )
                  }
                />
              )}
              {node.kind === "image" && (
                <>
                  <button
                    type="button"
                    disabled={locked}
                    aria-pressed={cropping === node.id}
                    onClick={() => {
                      setCropping((old) =>
                        old === node.id ? undefined : node.id,
                      );
                      if (panel === "effects") setPanel(null);
                    }}
                  >
                    <Crop size={16} />
                    {cropping === node.id ? "Fine ritaglio" : "Ritaglia"}
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setPanel("effects")}
                  >
                    Effetti foto
                  </button>
                </>
              )}
              {node.kind === "group" && (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => {
                    changeScene(ungroupNode(scene!, node.id));
                    onSelect("", false);
                  }}
                >
                  <Ungroup size={16} /> Separa
                </button>
              )}
              <button
                type="button"
                aria-label="Duplica elemento"
                disabled={locked}
                onClick={duplicate}
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                aria-label="Elimina elemento"
                disabled={locked}
                onClick={() => {
                  changeScene(removeNodes(scene!, selected));
                  onSelect("", false);
                }}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                aria-label={
                  node.locked ? "Sblocca elemento" : "Blocca elemento"
                }
                onClick={() =>
                  changeScene(
                    updateNode(scene!, node.id, { locked: !node.locked }),
                  )
                }
              >
                {node.locked ? <Unlock size={16} /> : <Lock size={16} />}
              </button>
              <button
                type="button"
                disabled={locked}
                aria-label="Porta avanti"
                onClick={() => changeScene(reorderNode(scene!, node.id, 1))}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                disabled={locked}
                aria-label="Porta indietro"
                onClick={() => changeScene(reorderNode(scene!, node.id, -1))}
              >
                <ArrowDown size={16} />
              </button>
            </>
          ) : (
            <>
              <span>
                {selected.length
                  ? `${selected.length} elementi selezionati`
                  : "Seleziona un elemento sulla slide"}
              </span>
              {selected.length > 1 && (
                <button type="button" onClick={group}>
                  <Group size={16} /> Raggruppa
                </button>
              )}
            </>
          )}
          <button
            type="button"
            aria-pressed={panel === "layers"}
            onClick={() => open("layers")}
          >
            <Layers size={16} /> Livelli
          </button>
          <details className="context-position">
            <summary>
              Posizione <ChevronDown size={14} />
            </summary>
            <div>
              {(
                [
                  ["x", "start", "Allinea a sinistra", AlignLeft],
                  ["x", "center", "Centra orizzontalmente", AlignCenter],
                  ["x", "end", "Allinea a destra", AlignRight],
                  ["y", "start", "Allinea in alto", AlignStartVertical],
                  ["y", "center", "Centra verticalmente", AlignCenterVertical],
                  ["y", "end", "Allinea in basso", AlignEndVertical],
                ] as const
              ).map(([axis, pos, label, Icon]) => (
                <button
                  type="button"
                  key={label}
                  aria-label={label}
                  disabled={!selected.length || locked}
                  onClick={() => align(axis, pos)}
                >
                  <Icon size={17} />
                </button>
              ))}
              <button
                type="button"
                disabled={selected.length < 3}
                onClick={() => distribute("x")}
              >
                Distribuisci orizzontalmente
              </button>
              <button
                type="button"
                disabled={selected.length < 3}
                onClick={() => distribute("y")}
              >
                Distribuisci verticalmente
              </button>
            </div>
          </details>
          <button
            type="button"
            aria-pressed={panel === "advanced"}
            onClick={() => open("advanced")}
          >
            Avanzate
          </button>
        </div>
        {cropping && image && (
          <div className="crop-controls">
            <span>Trascina la foto per regolare il ritaglio.</span>
            <label>
              Zoom foto
              <input
                aria-label="Zoom ritaglio"
                type="range"
                min={0.5}
                max={4}
                step={0.05}
                value={image.crop?.scale ?? image.scale ?? 1}
                onChange={(e) =>
                  photo({
                    ...image,
                    crop: {
                      scale: Number(e.target.value),
                      x: image.crop?.x ?? 0,
                      y: image.crop?.y ?? 0,
                    },
                  })
                }
              />
            </label>
            <button type="button" onClick={() => setCropping(undefined)}>
              <Check size={16} /> Fine
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="workspace-error">
            {error}
            <button type="button" onClick={() => setError("")}>
              Chiudi
            </button>
          </p>
        )}
        <div
          ref={stageRef}
          className={`canvas-viewport ${hand ? "is-hand" : ""}`}
          onPointerDownCapture={pointerDown}
          onPointerMoveCapture={pointerMove}
          onPointerUpCapture={pointerEnd}
          onPointerCancelCapture={pointerEnd}
        >
          <div
            className="canvas-paper"
            style={{ transform: `translate(${pan.x}px,${pan.y}px)` }}
          >
            <TemplateWrapper
              scale={scale}
              width={FORMATS[format].width}
              height={FORMATS[format].height}
            >
              {slide?.scene ? (
                <GraphicCanvas
                  slide={slide}
                  selected={selected}
                  onSelect={onSelect}
                  onCommit={changeScene}
                  onChangeSlide={onChange}
                  cropping={cropping}
                  textRequest={textRequest}
                  aspectLocked={aspectLocked}
                  guides={guides}
                  previewScale={scale}
                />
              ) : (
                <p>Preparazione della composizione…</p>
              )}
            </TemplateWrapper>
          </div>
        </div>
        <footer className="workspace-view-controls">
          <button
            type="button"
            aria-label="Seleziona elementi"
            aria-pressed={!hand}
            onClick={() => setHand(false)}
          >
            <MousePointer2 size={17} />
          </button>
          <button
            type="button"
            aria-label="Sposta vista"
            aria-pressed={hand}
            onClick={() => setHand(!hand)}
          >
            <Hand size={17} />
          </button>
          <button
            type="button"
            aria-label="Riduci zoom"
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
          >
            <Minus size={17} />
          </button>
          <button
            type="button"
            aria-label="Adatta alla finestra"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
          >
            Adatta · {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            aria-label="Aumenta zoom"
            onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
          >
            <Plus size={17} />
          </button>
          <label>
            <input
              type="checkbox"
              checked={guides}
              onChange={(e) => onGuides(e.target.checked)}
            />{" "}
            Guide
          </label>
        </footer>
      </main>
    </div>
  );
}
