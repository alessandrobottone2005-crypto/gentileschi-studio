import { test, expect, type Page, type Locator } from '@playwright/test';

async function prepare(page: Page) {
  await page.addInitScript(() => {
    const shape = (id: string, x: number, y: number) => ({
      id, name: id, kind: 'shape', x, y, width: 100, height: 100,
      rotation: 0, opacity: 1, visible: true, locked: false,
      style: { backgroundColor: '#000000' },
    });
    localStorage.setItem('gentileschi_studio_projects', JSON.stringify([{
      id: 'camera-regression', title: 'Geometria della vista', type: 'single', format: 'portrait',
      createdAt: '2026-10-13T08:00:00Z', updatedAt: '2026-10-13T08:00:00Z',
      slides: [{ id: 'slide', templateType: 'cover', content: { title: '', day: '', month: '', timeSlot: '' },
        scene: { version: 1, width: 1080, height: 1350, background: '#ffffff', nodes: [
          shape('Primo', 200, 300), shape('Secondo', 450, 430), shape('Terzo', 850, 560),
          { ...shape('Foto', 300, 820), kind: 'image', width: 300, height: 300,
            media: { assetKey: 'notice' }, style: { objectFit: 'contain' } },
        ] },
      }],
    }]));
  });
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Geometria della vista', exact: true }).click();
  await page.getByRole('button', { name: 'Chiudi pannello', exact: true }).click();
  await page.getByLabel('Guide', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Sposta vista', exact: true }).click();
  const viewport = (await page.locator('.canvas-viewport').boundingBox())!;
  await drag(page, viewport.x + 25, viewport.y + 25, 75, 35);
  await expect(page.locator('.canvas-paper')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 75, 35)');
  await page.getByRole('button', { name: 'Seleziona elementi', exact: true }).click();
}

async function drag(page: Page, x: number, y: number, dx: number, dy: number) {
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 4 });
  await page.mouse.up();
}

function node(page: Page, id: string) {
  return page.locator(`.editor-preview-panel [data-scene-node="${id}"]`);
}

async function centerDrag(page: Page, target: Locator, dx: number, dy: number) {
  const box = (await target.boundingBox())!;
  await drag(page, box.x + box.width / 2, box.y + box.height / 2, dx, dy);
  return box;
}

test('panning the view does not change element drag or proportional resize distances', async ({ page }) => {
  await prepare(page);
  const first = node(page, 'Primo');
  const before = await centerDrag(page, first, 40, 20);
  await expect.poll(async () => (await first.boundingBox())!.x).toBeCloseTo(before.x + 40, 0);
  await expect.poll(async () => (await first.boundingBox())!.y).toBeCloseTo(before.y + 20, 0);
  const moved = (await first.boundingBox())!;
  await centerDrag(page, first.locator('.scene-resize'), 30, 30);
  await expect.poll(async () => (await first.boundingBox())!.width).toBeCloseTo(moved.width + 30, 0);
  await expect.poll(async () => (await first.boundingBox())!.height).toBeCloseTo(moved.height + 30, 0);
});

test('alignment and distribution after a pan leave the other axis and outer elements unchanged', async ({ page }) => {
  await prepare(page);
  await page.getByRole('button', { name: 'Livelli', exact: true }).click();
  for (const id of ['Primo', 'Secondo', 'Terzo']) await page.getByLabel(`Selezione multipla: ${id}`, { exact: true }).check();
  const before = await Promise.all(['Primo', 'Secondo', 'Terzo'].map(id => node(page, id).boundingBox()));
  await page.locator('.context-position summary').click();
  await page.getByRole('button', { name: 'Allinea in alto', exact: true }).click();
  for (let i = 0; i < 3; i++) {
    const target = node(page, ['Primo', 'Secondo', 'Terzo'][i]);
    await expect.poll(async () => (await target.boundingBox())!.y).toBeCloseTo(before[0]!.y, 0);
    await expect.poll(async () => (await target.boundingBox())!.x).toBeCloseTo(before[i]!.x, 0);
  }
  await page.getByRole('button', { name: 'Distribuisci orizzontalmente', exact: true }).click();
  await expect.poll(async () => (await node(page, 'Primo').boundingBox())!.x).toBeCloseTo(before[0]!.x, 0);
  await expect.poll(async () => (await node(page, 'Terzo').boundingBox())!.x).toBeCloseTo(before[2]!.x, 0);
  await expect.poll(async () => (await node(page, 'Secondo').boundingBox())!.x).toBeCloseTo((before[0]!.x + before[2]!.x) / 2, 0);
});

test('photograph crop movement after a pan is independent of the camera translation', async ({ page }) => {
  await prepare(page);
  const photo = node(page, 'Foto');
  await photo.click();
  await page.getByRole('button', { name: 'Ritaglia', exact: true }).click();
  // The crop toolbar changes the viewport height and its fitted scale.
  let previousWidth = -1;
  await expect.poll(async () => {
    const width = (await photo.boundingBox())!.width;
    const stable = width === previousWidth;
    previousWidth = width;
    return stable;
  }).toBe(true);
  const before = (await photo.boundingBox())!;
  const scale = before.width / 300;
  await centerDrag(page, photo, 25, 15);
  await expect.poll(() => page.evaluate(() => {
    const project = JSON.parse(localStorage.getItem('gentileschi_studio_projects')!)[0];
    return project.slides[0].scene.nodes.find((item: { id: string }) => item.id === 'Foto').media.crop?.x;
  })).toBeCloseTo(25 / scale, 0);
  const after = (await photo.boundingBox())!;
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
});
