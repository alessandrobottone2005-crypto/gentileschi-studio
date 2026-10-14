import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { Slide } from "../types/template";
import type { NodeStyle, SceneNode, SlideScene } from "../types/scene";
import { renderLegacySlide } from "../rendering/legacy";
import { assetIdForUrl } from "./sceneAssets";
import { allNodes, clone } from "./scene";

// Capture the existing renderer, including browser font metrics and flex layout.
// This adapter preserves legacy projects rather than replacing their layout.
export async function captureLegacyScene(slide: Slide): Promise<SlideScene> {
  if (slide.scene) return clone(slide.scene);
  await document.fonts.ready;
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "fixed",
    left: "-20000px",
    top: "0",
    width: "1080px",
    pointerEvents: "none",
  });
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() => root.render(renderLegacySlide(slide)));
    host.getBoundingClientRect();
    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll("img")).map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
    const frame = host.firstElementChild as HTMLElement;
    const transforms = new Map<HTMLElement, string>();
    const elements = [
      frame,
      ...Array.from(frame.querySelectorAll<HTMLElement>("*")),
    ];
    elements.forEach((element) => {
      transforms.set(element, element.style.transform);
      element.style.transform = "none";
    });
    const boxes = new Map(
      elements.map((element) => [element, element.getBoundingClientRect()]),
    );
    let counter = 0;
    const read = (element: HTMLElement, parent: HTMLElement): SceneNode => {
      const box = boxes.get(element)!;
      const parentBox = boxes.get(parent)!;
      const computed = getComputedStyle(element);
      const children = Array.from(element.children) as HTMLElement[];
      const photo =
        children.length === 1 &&
        children[0] instanceof HTMLImageElement &&
        children[0].dataset.contentField === "image"
          ? children[0]
          : undefined;
      const imageElement =
        element instanceof HTMLImageElement ? element : photo;
      const field = element.dataset.contentField;
      const agendaId = element.dataset.agendaId;
      const binding =
        field && field !== "image"
          ? agendaId
            ? `item:${agendaId}:${field}`
            : field
          : undefined;
      const image = element instanceof HTMLImageElement;
      const kind = photo
        ? "image"
        : image
          ? field === "image"
            ? "image"
            : "vector"
          : children.length
            ? "group"
            : element.textContent?.trim()
              ? "text"
              : "shape";
      const labels: Record<string, string> = {
        title: "Titolo",
        day: "Giorno",
        month: "Mese",
        timeSlot: "Orario",
        subtitle: "Sottotitolo",
        highlightQuantity: "Quantità in evidenza",
        highlightLabel: "Etichetta in evidenza",
        badgeText: "Testo del badge",
        paragraph1: "Primo paragrafo",
        paragraph2: "Secondo paragrafo",
        ctaText: "Invito a partecipare",
      };
      const itemNumber =
        agendaId && "items" in slide.content
          ? slide.content.items.find((item) => item.id === agendaId)?.number
          : undefined;
      const name = binding
        ? agendaId
          ? `${field === "number" ? "Numero" : "Punto"} ${itemNumber || agendaId}`
          : labels[binding] || "Testo"
        : photo
          ? "Fotografia"
          : image
            ? field === "image"
              ? "Fotografia"
              : "Decorazione"
            : element.dataset.agendaItem
              ? `Voce ${element.dataset.agendaItem}`
              : kind === "group"
                ? "Gruppo"
                : kind === "text"
                  ? element.textContent!.slice(0, 35)
                  : "Forma";
      const style: NodeStyle = {};
      const properties = [
        "backgroundColor",
        "backgroundImage",
        "backgroundSize",
        "boxShadow",
        "filter",
        "borderRadius",
        "border",
        "overflow",
        "color",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "textAlign",
        "textTransform",
        "whiteSpace",
        "objectFit",
        "objectPosition",
        "transformOrigin",
      ] as const;
      properties.forEach((property) => {
        if (computed[property])
          (style as Record<string, unknown>)[property] = computed[property];
      });
      style.transformOrigin = element.style.transformOrigin || "center";
      if (image) style.overflow = "visible";
      if (photo) {
        const pictureStyle = getComputedStyle(photo);
        style.objectFit = pictureStyle.objectFit as NodeStyle["objectFit"];
        style.objectPosition = pictureStyle.objectPosition;
      }
      const rawTransform =
        image && field === "image"
          ? undefined
          : transforms.get(element) || undefined;
      const rotation = rawTransform?.match(/^rotate\((-?[\d.]+)deg\)$/);
      const node: SceneNode = {
        id: `legacy:${++counter}`,
        name,
        kind,
        x: box.left - parentBox.left,
        y: box.top - parentBox.top,
        width: box.width,
        height: box.height,
        rotation: rotation ? Number(rotation[1]) : 0,
        opacity: Number(computed.opacity),
        visible: computed.display !== "none",
        locked: false,
        style,
        text: kind === "text" ? element.textContent || "" : undefined,
        binding,
        baseTransform: rotation ? undefined : rawTransform,
        imageTransformOrigin: imageElement
          ? imageElement.style.transformOrigin || "center"
          : undefined,
        media: imageElement
          ? photo || field === "image"
            ? {
                ...slide.content.image,
                assetKey: slide.content.image?.assetKey || slide.templateType,
              }
            : { assetId: assetIdForUrl(imageElement.getAttribute("src") || "") }
          : undefined,
        children:
          children.length && !photo
            ? children.map((child) => read(child, element))
            : undefined,
        agendaItemId: element.dataset.agendaItem,
        agendaRole: element.dataset.agendaRole,
        agendaContext: element.dataset.agendaId || element.dataset.agendaItem,
        autoStyle: element.dataset.agendaRole ? "legacy" : undefined,
      };
      if (photo || (image && field === "image")) node.binding = "image";
      return node;
    };
    // CSS stacking contexts preserve same-z sibling order.
    const sort = (nodes: HTMLElement[]) =>
      nodes
        .map((node, index) => ({
          node,
          index,
          z: Number(getComputedStyle(node).zIndex) || 0,
        }))
        .sort((a, b) => a.z - b.z || a.index - b.index)
        .map((item) => item.node);
    const children = sort(Array.from(frame.children) as HTMLElement[]).map(
      (child) => read(child, frame),
    );
    const scene: SlideScene = {
      version: 1,
      width: 1080,
      height: 1350,
      background: getComputedStyle(frame).backgroundColor,
      nodes: children,
    };
    const prototype = allNodes(children).find((node) => node.agendaItemId);
    if (prototype) scene.agendaPrototype = clone(prototype);
    scene.agendaContainerId = allNodes(children).find((node) =>
      node.children?.some((child) => child.agendaItemId),
    )?.id;
    return scene;
  } finally {
    root.unmount();
    host.remove();
  }
}
