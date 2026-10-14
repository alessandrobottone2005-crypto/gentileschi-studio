import { test, expect, Page } from "@playwright/test";
import { PNG } from "pngjs";
import { readFile } from "node:fs/promises";
async function create(page: Page, theme?: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nuovo progetto", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Anteprima tema/ }),
  ).toHaveCount(13);
  await page
    .getByLabel("Titolo del progetto", { exact: true })
    .fill("Nuovo studio");
  if (theme) {
    await page
      .getByRole("button", { name: "Anteprima tema " + theme, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Slide successiva del tema" })
      .click();
    await expect(page.locator(".theme-page-controls")).toContainText("2 / 3");
    await page
      .getByRole("button", { name: "Usa questo tema", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Anteprima tema " + theme,
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await page
    .getByRole("button", { name: "Crea progetto", exact: true })
    .click();
  await expect(page.getByLabel("Titolo progetto")).toHaveValue("Nuovo studio");
}
async function data(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole("status").filter({ hasText: /^Salvato$/ }),
  ).toBeVisible();
  return page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("gentileschi_studio_projects") || "[]",
      )[0],
  );
}
const nodes = (list: any[]): any[] =>
  list.flatMap((n) => [n, ...nodes(n.children || [])]);
test("tablet theme panel leaves the canvas visible within the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 796, height: 864 });
  await create(page);
  for (const width of [760, 796, 900]) {
    await page.setViewportSize({ width, height: 864 });
    const panel = (await page.locator(".workspace-panel").boundingBox())!;
    const canvas = (await page.locator(".canvas-viewport").boundingBox())!;
    expect(panel.width).toBeLessThan(350);
    expect(canvas.width).toBeGreaterThan(250);
    expect(canvas.x).toBeGreaterThanOrEqual(panel.x + panel.width);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(width);
  }
});
test("selects imported themes, edits bound text inline, and changes theme with undo", async ({
  page,
}, info) => {
  await create(page, "EDITORIALE LIME");
  await expect(page.locator("[data-missing-media]")).toHaveCount(0);
  const project = await data(page);
  expect(project.themeRef.id).toBe("assemblea-10");
  const title = nodes(project.slides[0].scene.nodes).find(
    (n) => n.binding === "title",
  );
  await page
    .locator(`.editor-preview-panel [data-scene-node="${title.id}"]`)
    .dblclick();
  await page
    .getByRole("textbox", { name: "Modifica testo sulla slide" })
    .fill("IL NOSTRO\nINCONTRO");
  await page
    .getByRole("textbox", { name: "Modifica testo sulla slide" })
    .press("Control+Enter");
  expect((await data(page)).slides[0].content.title).toBe(
    "IL NOSTRO\nINCONTRO",
  );
  await page.getByRole("button", { name: "Dati", exact: true }).click();
  await expect(page.getByLabel("Titolo assemblea")).toHaveValue(
    "IL NOSTRO\nINCONTRO",
  );
  await page.getByRole("button", { name: "Temi", exact: true }).click();
  await page
    .getByRole("button", { name: "Anteprima tema BLU NOTTE", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Usa questo tema", exact: true })
    .click();
  await page.getByRole("button", { name: "Applica", exact: true }).click();
  expect((await data(page)).themeRef.id).toBe("assemblea-03");
  await page
    .getByRole("button", { name: "Annulla ultima modifica", exact: true })
    .click();
  expect((await data(page)).themeRef.id).toBe("assemblea-10");
  await info.attach("new-workspace", {
    body: await page.screenshot({ path: info.outputPath("desktop.png") }),
    contentType: "image/png",
  });
});
test("handles missing Pixabay configuration and allows uploads", async ({
  page,
}) => {
  await create(page);
  await page.getByRole("button", { name: "Foto", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Pixabay non è ancora configurato",
  );
  await page.getByRole("button", { name: "Caricamenti", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Carica una fotografia", exact: true }),
  ).toBeVisible();
});
test("searches, replaces a photograph, crops, styles, reloads and exports the same image", async ({
  page,
}, info) => {
  await create(page);
  await page.getByRole("button", { name: "Caricamenti", exact: true }).click();
  await page
    .getByLabel("Carica fotografia")
    .setInputFiles("src/assets/figma/students-group.png");
  await expect(page.locator(".context-name")).toHaveText("Fotografia");
  let project = await data(page);
  const photograph = nodes(project.slides[0].scene.nodes).find(
    (n) => n.added && n.kind === "image",
  );
  const path = photograph.media.storagePath;
  await page.route("**/api/photos**", async (route) => {
    if (route.request().url().includes("status=1"))
      await route.fulfill({ json: { available: true } });
    else if (route.request().method() === "POST")
      await route.fulfill({
        json: {
          storagePath: path,
          isTransparent: true,
          source: {
            provider: "pixabay",
            id: 42,
            author: "Autore di prova",
            pageUrl: "https://pixabay.com/photos/42",
          },
        },
      });
    else
      await route.fulfill({
        json: {
          totalHits: 1,
          hits: [
            {
              id: 42,
              user: "Autore di prova",
              tags: "studenti",
              pageURL: "https://pixabay.com/photos/42",
              webformatURL: "/src/assets/figma/students-group.png",
              imageWidth: 1200,
              imageHeight: 1600,
            },
          ],
        },
      });
  });
  await page.getByRole("button", { name: "Foto", exact: true }).click();
  await page.getByLabel("Cerca fotografie").fill("studenti");
  await page.getByRole("button", { name: "Cerca", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Foto di Autore di prova: studenti",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Sostituisci la foto selezionata",
      exact: true,
    })
    .click();
  project = await data(page);
  let image = nodes(project.slides[0].scene.nodes).find(
    (n) => n.id === photograph.id,
  );
  expect([image.x, image.y, image.width, image.height]).toEqual([
    photograph.x,
    photograph.y,
    400,
    500,
  ]);
  expect(image.media.source.author).toBe("Autore di prova");
  await page.getByRole("button", { name: "Ritaglia", exact: true }).click();
  await page.getByLabel("Zoom ritaglio").focus();
  for (let n = 0; n < 10; n++)
    await page.getByLabel("Zoom ritaglio").press("ArrowRight");
  const target = page.locator(
    `.editor-preview-panel [data-scene-node="${image.id}"]`,
  );
  const box = await target.boundingBox();
  await page.mouse.move(box!.x + 50, box!.y + 50);
  await page.mouse.down();
  await page.mouse.move(box!.x + 65, box!.y + 75);
  await page.mouse.up();
  await page.getByRole("button", { name: "Fine", exact: true }).click();
  await page.getByRole("button", { name: "Effetti foto", exact: true }).click();
  await page
    .getByRole("button", { name: "Stile Gentileschi", exact: true })
    .click();
  await expect(
    page.locator(".editor-preview-panel [data-photo-pending]"),
  ).toHaveCount(0);
  project = await data(page);
  image = nodes(project.slides[0].scene.nodes).find(
    (n) => n.id === photograph.id,
  );
  expect(image.media.effects.enabled).toBe(true);
  expect(image.media.crop.scale).toBe(1.5);
  expect(image.media.crop.y).not.toBe(0);
  await page
    .getByRole("button", { name: "Torna alla dashboard", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Nuovo studio", exact: true }).click();
  await expect(page.locator("[data-missing-media]")).toHaveCount(0);
  await page.getByRole("button", { name: "Esporta", exact: true }).click();
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Scarica Solo Slide Attuale/ })
    .click();
  const file = await (await event).path();
  const png = PNG.sync.read(await readFile(file!));
  expect([png.width, png.height]).toEqual([1080, 1350]);
  await info.attach("styled-photo-export", {
    body: await readFile(file!),
    contentType: "image/png",
  });
});
test.describe("mobile workspace", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("keeps the canvas visible with tool drawers and zoom", async ({
    page,
  }, info) => {
    await create(page, "CELESTE CARTA");
    await page.getByRole("button", { name: "Elementi", exact: true }).click();
    await expect(page.locator(".editor-preview-panel")).toBeVisible();
    await page.getByRole("button", { name: "Cerchio", exact: true }).click();
    await page
      .getByRole("button", { name: "Chiudi pannello", exact: true })
      .click();
    const before = await page.locator(".canvas-paper").boundingBox();
    await page
      .getByRole("button", { name: "Aumenta zoom", exact: true })
      .click();
    expect(
      (await page.locator(".canvas-paper").boundingBox())!.width,
    ).toBeGreaterThan(before!.width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await info.attach("mobile-workspace", {
      body: await page.screenshot({ path: info.outputPath("mobile.png") }),
      contentType: "image/png",
    });
  });
});
test("removes the background locally and restores the original without losing the cached cutout", async ({
  page,
}) => {
  test.setTimeout(120000);
  await create(page);
  await page.getByRole("button", { name: "Caricamenti", exact: true }).click();
  await page
    .getByLabel("Carica fotografia")
    .setInputFiles("src/assets/figma/gentileschi-statue.png");
  await expect(page.locator(".context-name")).toHaveText("Fotografia");
  const original = nodes((await data(page)).slides[0].scene.nodes).find(
    (n) => n.added && n.kind === "image",
  );
  await page.getByRole("button", { name: "Effetti foto", exact: true }).click();
  await page
    .getByRole("button", { name: "Rimuovi sfondo", exact: true })
    .click();
  await expect
    .poll(
      async () =>
        nodes((await data(page)).slides[0].scene.nodes).find(
          (n) => n.id === original.id,
        ).media.isTransparent,
      { timeout: 110000 },
    )
    .toBe(true);
  const processed = nodes((await data(page)).slides[0].scene.nodes).find(
    (n) => n.id === original.id,
  ).media;
  expect(processed.originalStoragePath).toBe(original.media.storagePath);
  expect(processed.cutoutStoragePath).not.toBe(processed.originalStoragePath);
  await page
    .getByRole("button", { name: "Ripristina immagine originale", exact: true })
    .click();
  const restored = nodes((await data(page)).slides[0].scene.nodes).find(
    (n) => n.id === original.id,
  ).media;
  expect(restored.storagePath).toBe(original.media.storagePath);
  expect(restored.cutoutStoragePath).toBe(processed.cutoutStoragePath);
  await page
    .getByRole("button", { name: "Rimuovi sfondo", exact: true })
    .click();
  expect(
    nodes((await data(page)).slides[0].scene.nodes).find(
      (n) => n.id === original.id,
    ).media.storagePath,
  ).toBe(processed.cutoutStoragePath);
});
test("aligns transformed elements across groups and contains long bound text", async ({
  page,
}) => {
  await create(page, "BLU GENTILESCHI");
  await page.getByRole("button", { name: "Avanzate", exact: true }).click();
  const project = await data(page),
    items = nodes(project.slides[0].scene.nodes);
  const title = items.find((n) => n.binding === "title"),
    month = items.find((n) => n.binding === "month");
  await page
    .locator(`.editor-preview-panel [data-scene-node="${title.id}"]`)
    .click();
  await page.getByLabel("Rotazione (°)", { exact: true }).fill("15");
  await page
    .getByRole("checkbox", {
      name: "Selezione multipla: " + month.name,
      exact: true,
    })
    .check();
  await page.locator(".context-position summary").click();
  await page
    .getByRole("button", { name: "Allinea a sinistra", exact: true })
    .click();
  const a = await page
      .locator(`.editor-preview-panel [data-scene-node="${title.id}"]`)
      .boundingBox(),
    b = await page
      .locator(`.editor-preview-panel [data-scene-node="${month.id}"]`)
      .boundingBox();
  expect(a!.x).toBeCloseTo(b!.x, 0);
  await page.getByRole("button", { name: "Dati", exact: true }).click();
  await page
    .getByLabel("Titolo assemblea")
    .fill(
      "ASSEMBLEA CON TUTTE LE CLASSI PER DISCUTERE LE PROPOSTE DEL NUOVO ANNO",
    );
  await expect(
    page.locator(`.editor-preview-panel [data-scene-node="${title.id}"]`),
  ).not.toHaveCSS("font-size", "120px");
  const measurements = await page
    .locator(`.editor-preview-panel [data-scene-node="${title.id}"]`)
    .evaluate((el) => {
      const copy = el.cloneNode(true) as HTMLElement;
      copy.querySelector(".scene-selection")?.remove();
      copy.style.position = "fixed";
      copy.style.left = "-10000px";
      copy.style.transform = "none";
      document.body.appendChild(copy);
      const result = { scroll: copy.scrollHeight, height: copy.clientHeight };
      copy.remove();
      return result;
    });
  expect(measurements.scroll).toBeLessThanOrEqual(measurements.height + 1);
});
test.describe("touch camera", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("pinches the camera without moving slide elements", async ({ page }) => {
    await create(page);
    const before = await page.locator(".canvas-paper").boundingBox();
    const project = await data(page);
    const stage = await page.locator(".canvas-viewport").boundingBox();
    const x = stage!.x + stage!.width / 2,
      y = stage!.y + stage!.height / 2;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: x - 25, y, id: 1 },
        { x: x + 25, y, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - 65, y, id: 1 },
        { x: x + 65, y, id: 2 },
      ],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    expect(
      (await page.locator(".canvas-paper").boundingBox())!.width,
    ).toBeGreaterThan(before!.width * 1.5);
    expect((await data(page)).slides[0].scene.nodes).toEqual(
      project.slides[0].scene.nodes,
    );
  });
});
