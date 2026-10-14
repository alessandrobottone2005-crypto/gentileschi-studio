import { test, expect, Page } from "@playwright/test";
import { PNG } from "pngjs";

async function createProject(page: Page, format = "portrait", single = false) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Nuovo progetto", exact: true })
    .click();
  await page
    .getByLabel("Titolo del progetto", { exact: true })
    .fill("Prova grafica");
  await page.getByLabel("Dimensioni", { exact: true }).selectOption(format);
  if (single)
    await page
      .getByRole("button", { name: "Post singolo", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Crea progetto", exact: true })
    .click();
  await expect(page.getByLabel("Titolo progetto", { exact: true })).toHaveValue(
    "Prova grafica",
  );
}
async function saved(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole("status").filter({ hasText: /^Salvato$/ }),
  ).toBeVisible();
}
async function stored(page: Page) {
  await saved(page);
  return page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem("gentileschi_studio_projects") || "[]",
      )[0],
  );
}
const nodes = (items: any[]): any[] =>
  items.flatMap((item) => [item, ...nodes(item.children || [])]);
for (const variant of ["", "?zoom=1"])
  test(`legacy conversion preserves every original visual ${variant ? "with photo transforms" : ""}`, async ({
    page,
  }, info) => {
    await page.goto(`/tests/scene-fixture.html${variant}`);
    await expect(page.locator('[data-ready="3"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    for (const role of ["cover", "agenda", "notice"]) {
      const legacy = await page
        .getByTestId(`legacy-${role}`)
        .screenshot({ path: info.outputPath(`${role}-legacy.png`) });
      const scene = await page
        .getByTestId(`scene-${role}`)
        .screenshot({ path: info.outputPath(`${role}-scene.png`) });
      await info.attach(`${role}-legacy`, {
        body: legacy,
        contentType: "image/png",
      });
      await info.attach(`${role}-scene`, {
        body: scene,
        contentType: "image/png",
      });
      const a = PNG.sync.read(legacy);
      const b = PNG.sync.read(scene);
      expect([a.width, a.height]).toEqual([b.width, b.height]);
      let different = 0;
      for (let p = 0; p < a.data.length; p += 4)
        if (
          Math.max(
            ...[0, 1, 2].map((channel) =>
              Math.abs(a.data[p + channel] - b.data[p + channel]),
            ),
          ) > 16
        )
          different++;
      expect(
        different / (a.width * a.height),
        `${role}: pixel difference`,
      ).toBeLessThan(0.003);
    }
  });
test("edits, moves, locks, saves, reloads and changes themes with undo", async ({
  page,
}) => {
  await createProject(page);
  await page.getByRole("button", { name: "Avanzate", exact: true }).click();
  await page.getByRole("button", { name: "+ Testo", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Testo", exact: true })
    .fill("Un testo personalizzato");
  await page.getByLabel("X", { exact: true }).fill("350");
  await page.getByLabel("Y", { exact: true }).fill("700");
  await page.getByLabel("Colore esadecimale", { exact: true }).fill("#ff5500");
  let data = await stored(page);
  const added = nodes(data.slides[0].scene.nodes).find(
    (item) => item.text === "Un testo personalizzato",
  );
  expect(added).toMatchObject({ x: 350, y: 700, style: { color: "#ff5500" } });
  const element = page.locator(`[data-scene-node="${added.id}"]`).first();
  const bounds = await element.boundingBox();
  await page.mouse.move(bounds!.x + 20, bounds!.y + 12);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + 60, bounds!.y + 32);
  await page.mouse.up();
  data = await stored(page);
  const moved = nodes(data.slides[0].scene.nodes).find(
    (item) => item.id === added.id,
  );
  expect(moved.x).toBeGreaterThan(added.x + 50);
  expect(moved.y).toBeGreaterThan(added.y + 20);
  await page
    .getByRole("button", { name: "Blocca Nuovo testo", exact: true })
    .click();
  await expect(page.getByLabel("X", { exact: true })).toBeDisabled();
  await page
    .getByRole("button", { name: "Sblocca Nuovo testo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Salva come tema", exact: true })
    .click();
  await page
    .getByLabel("Nome del tema", { exact: true })
    .fill("Tema personalizzato");
  await page.getByRole("button", { name: "Salva tema", exact: true }).click();
  await saved(page);
  await page.getByRole("button", { name: "Cambia tema", exact: true }).click();
  await page
    .getByLabel("Trasferisci anche le personalizzazioni compatibili", {
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Applica", exact: true }).click();
  expect(
    nodes((await stored(page)).slides[0].scene.nodes).some(
      (item) => item.text === "Un testo personalizzato",
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Cambia tema", exact: true }).click();
  await page.getByRole("button", { name: "Applica", exact: true }).click();
  expect(
    nodes((await stored(page)).slides[0].scene.nodes).some(
      (item) => item.text === "Un testo personalizzato",
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Annulla ultima modifica", exact: true })
    .click();
  expect(
    nodes((await stored(page)).slides[0].scene.nodes).some(
      (item) => item.text === "Un testo personalizzato",
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Torna alla dashboard", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("button", { name: "Prova grafica", exact: true })
    .click();
  expect(
    nodes((await stored(page)).slides[0].scene.nodes).some(
      (item) => item.text === "Un testo personalizzato",
    ),
  ).toBe(true);
});
test("groups across containers and keeps geometry when separating a transformed group", async ({
  page,
}, info) => {
  await createProject(page, "portrait", true);
  await page.getByRole("button", { name: "Avanzate", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Selezione multipla: Titolo", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Selezione multipla: Mese", exact: true })
    .check();
  await page.locator(".graphic-panel").getByRole("button", { name: "Raggruppa", exact: true }).click();
  await expect(page.getByLabel("Nome elemento", { exact: true })).toHaveValue(
    "Gruppo",
  );
  await page.getByLabel("Rotazione (°)", { exact: true }).fill("20");
  const before = await page
    .locator('.editor-preview-panel [data-scene-node][data-node-name="Titolo"]')
    .boundingBox();
  await page.locator(".graphic-panel").getByRole("button", { name: "Separa", exact: true }).click();
  const after = await page
    .locator('.editor-preview-panel [data-scene-node][data-node-name="Titolo"]')
    .boundingBox();
  expect(after!.x).toBeCloseTo(before!.x, 1);
  expect(after!.y).toBeCloseTo(before!.y, 1);
  await info.attach("grouping", {
    body: await page.screenshot({ path: info.outputPath("grouping.png") }),
    contentType: "image/png",
  });
});
test("exports recolored vectors with the same proportions", async ({
  page,
}, info) => {
  await createProject(page, "square", true);
  await page.getByRole("button", { name: "Avanzate", exact: true }).click();
  await page
    .getByLabel("Decorazione", { exact: true })
    .selectOption("vectors/drawn-arrow-1.svg");
  await page.getByLabel("X", { exact: true }).fill("500");
  await page.getByLabel("Y", { exact: true }).fill("50");
  await page.getByLabel("Colore esadecimale", { exact: true }).fill("#ff5500");
  await saved(page);
  await page.getByRole("button", { name: "Esporta", exact: true }).click();
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /Scarica Solo Slide Attuale/ })
    .click();
  const download = await downloadEvent;
  const { readFile } = await import("node:fs/promises");
  const content = await readFile((await download.path())!);
  const png = PNG.sync.read(content);
  let colored = 0;
  for (let p = 0; p < png.data.length; p += 4)
    if (
      png.data[p] > 240 &&
      png.data[p + 1] > 65 &&
      png.data[p + 1] < 105 &&
      png.data[p + 2] < 15
    )
      colored++;
  expect(colored).toBeGreaterThan(100);
  await info.attach("tinted-vector", {
    body: content,
    contentType: "image/png",
  });
});
for (const [format, height] of [
  ["portrait", 1350],
  ["square", 1080],
  ["story", 1920],
] as const)
  test(`exports a real PNG at 1080 × ${height}`, async ({ page }, info) => {
    await createProject(page, format, true);
    await page.getByRole("button", { name: "Esporta", exact: true }).click();
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: /Scarica Solo Slide Attuale/ })
      .click();
    const download = await downloadEvent;
    const file = await download.path();
    const { readFile } = await import("node:fs/promises");
    const content = await readFile(file!);
    const png = PNG.sync.read(content);
    expect([png.width, png.height]).toEqual([1080, height]);
    await info.attach(`export-${format}`, {
      body: content,
      contentType: "image/png",
    });
    expect(png.data.some((value, index) => index % 4 === 3 && value > 0)).toBe(
      true,
    );
  });
test("keeps newly added agenda rows synchronized and highlights them", async ({
  page,
}) => {
  await createProject(page);
  await page
    .getByRole("button", {
      name: "Apri slide 2: Ordine del Giorno (O.D.G.)",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Dati", exact: true }).click();
  await page
    .getByRole("button", { name: "Aggiungi Punto", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Evidenzia punto 6", exact: true })
    .click();
  const data = await stored(page);
  const item = data.slides[1].content.items[5];
  const row = nodes(data.slides[1].scene.nodes).find(
    (node) => node.agendaItemId === item.id,
  );
  await expect(
    page.locator(`.editor-preview-panel [data-scene-node="${row.id}"]`),
  ).toHaveCSS("background-color", "rgb(223, 255, 47)");
  expect(row.autoStyle).toBe("legacy");
});

test.describe("mobile", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  test("supports graphic editing and properties without horizontal overflow", async ({
    page,
  }, info) => {
    await createProject(page, "story", true);
    const formatControl = await page
      .getByLabel("Formato progetto", { exact: true })
      .boundingBox();
    expect(formatControl!.width).toBeGreaterThan(75);
    await page.getByRole("button", { name: "Avanzate", exact: true }).click();
    await page.getByRole("button", { name: "+ Testo", exact: true }).click();
    await page.getByRole("textbox", { name: "Testo", exact: true }).fill("Testo da telefono");
    await expect(page.locator('.editor-preview-panel')).toBeVisible();
    await expect(page.getByRole('button',{name:'Chiudi pannello',exact:true})).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Testo", exact: true })).toHaveValue(
      "Testo da telefono",
    );
    await page.getByLabel("Rotazione (°)", { exact: true }).fill("15");
    expect(
      nodes((await stored(page)).slides[0].scene.nodes).find(
        (item) => item.text === "Testo da telefono",
      ).rotation,
    ).toBe(15);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await info.attach("mobile-properties", {
      body: await page.screenshot({
        path: info.outputPath("mobile-properties.png"),
      }),
      contentType: "image/png",
    });
  });
});
