import { test, expect, type Page } from '@playwright/test';

test('development serves the authenticated API handlers rather than the HTML app', async ({ request }) => {
  const account = await request.get('/api/account');
  expect(account.status()).toBe(401);
  expect(await account.json()).toEqual({ error: 'Accedi per vedere il tuo utilizzo AI.' });
  const generation = await request.post('/api/ai/generate', { data: {} });
  expect(generation.status()).toBe(400);
  expect(await generation.json()).toHaveProperty('error');
  const photos = await request.get('/api/photos?status=1');
  expect(photos.status()).toBe(503);
  expect(await photos.json()).toHaveProperty('error');
});

async function neutralChrome(page: Page, selector: string) {
  const violations = await page.locator(selector).evaluateAll((surfaces) => {
    const violations: string[] = [];
    for (const surface of surfaces) {
      for (const element of [surface, ...surface.querySelectorAll('*')]) {
        const style = getComputedStyle(element);
        for (const property of ['color', 'backgroundColor', 'borderTopColor', 'fill'] as const) {
          const value = style[property];
          const match = value.match(/^rgba?\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/);
          if (match && (Math.abs(+match[1] - +match[2]) > 1 || Math.abs(+match[2] - +match[3]) > 1)) {
            violations.push(`${element.tagName}.${element.className} ${property}: ${value}`);
          }
        }
      }
    }
    return violations;
  });
  expect(violations).toEqual([]);
}

function seedProject(id: string, title: string) {
  return {
    id, title, type: 'single', createdAt: '2026-10-13T08:00:00Z', updatedAt: '2026-10-13T08:00:00Z',
    slides: [{ id: `${id}-cover`, templateType: 'cover', content: { title: 'ASSEMBLEA', day: '13', month: 'OTTOBRE', timeSlot: 'ORE 10:00' } }],
  };
}

test('dashboard searches, renames, duplicates and deletes projects without deleting the original', async ({ page }) => {
  await page.addInitScript((projects) => {
    if (!localStorage.getItem('gentileschi_studio_projects')) localStorage.setItem('gentileschi_studio_projects', JSON.stringify(projects));
  }, [seedProject('one', 'Assemblea scuola'), seedProject('two', 'Avviso biblioteca')]);
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Progetti dello studio', exact: true })).toBeVisible();
  await page.getByLabel('Cerca progetti').fill('biblioteca');
  await expect(page.getByRole('button', { name: 'Avviso biblioteca', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Assemblea scuola', exact: true })).toHaveCount(0);
  await page.getByLabel('Cerca progetti').fill('');
  await page.getByRole('button', { name: 'Rinomina Assemblea scuola', exact: true }).click();
  await page.getByLabel('Nuovo titolo del progetto').fill('Assemblea ottobre');
  await page.getByRole('button', { name: 'Salva titolo', exact: true }).click();
  await page.getByRole('button', { name: 'Duplica Assemblea ottobre', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assemblea ottobre (Copia)', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Elimina Assemblea ottobre (Copia)', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Le fotografie resteranno nella libreria');
  await page.getByRole('button', { name: 'Elimina progetto', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Assemblea ottobre (Copia)', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Assemblea ottobre', exact: true })).toBeVisible();
  await neutralChrome(page, '.studio-sidebar, .studio-toolbar, h1');
});

test('account persists its display name and omits administrator actions for a local editor', async ({ page }) => {
  await page.goto('/account');
  await expect(page.getByLabel('Nome visualizzato')).toHaveValue('Questo dispositivo');
  await page.getByLabel('Nome visualizzato').fill('Rappresentante scuola');
  await page.getByRole('button', { name: 'Salva nome', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nome salvato.' })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nome visualizzato')).toHaveValue('Rappresentante scuola');
  await expect(page.getByRole('link', { name: 'Utenti', exact: true })).toHaveCount(0);
  await neutralChrome(page, '.studio-sidebar, .studio-account-identity, .studio-stat-strip, h1');
});

test('library preserves an upload after reload, filters results and restores focus when closing its preview', async ({ page }) => {
  await page.goto('/library');
  await page.getByLabel('Carica una fotografia', { exact: true }).setInputFiles('src/assets/figma/students-group.png');
  const preview = page.getByRole('button', { name: /^Anteprima Foto / }).first();
  await expect(preview).toBeVisible();
  await preview.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(preview).toBeFocused();
  await page.getByLabel('Cerca fotografie').fill('inesistente');
  await expect(page.getByRole('heading', { name: 'Nessuna foto corrisponde alla ricerca' })).toBeVisible();
  await page.getByLabel('Cerca fotografie').fill('');
  await page.reload();
  await expect(preview).toBeVisible();
  await page.getByLabel('Carica una fotografia', { exact: true }).setInputFiles({ name: 'errore.txt', mimeType: 'text/plain', buffer: Buffer.from('file non fotografico') });
  await expect(page.getByRole('alert')).toContainText('Carica un file PNG, JPG o WEBP');
  await expect(preview).toBeVisible();
  await neutralChrome(page, '.studio-sidebar, .studio-toolbar, .app-error, h1');
});

test('mobile navigation remains usable across all studio pages and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  for (const [name, title] of [['Progetti', 'Progetti dello studio'], ['Libreria', 'Libreria fotografica'], ['Account', 'Il tuo account']] as const) {
    await page.getByRole('button', { name: 'Apri navigazione', exact: true }).click();
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await neutralChrome(page, '.studio-sidebar, h1');
  }
  await page.getByRole('button', { name: 'Apri navigazione', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Apri navigazione', exact: true })).toBeFocused();
});

test('login shows canceled consent safely, clears provider parameters and supports retry', async ({ page }) => {
  await page.goto('/tests/auth-fixture.html?error=access_denied&error_description=private-description');
  await expect(page.getByRole('alert')).toContainText('Accesso con Google annullato');
  await expect(page.getByRole('alert')).not.toContainText('private-description');
  await expect(page).not.toHaveURL(/error=/);
  await page.getByRole('button', { name: 'Continua con Google', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('L’accesso online non è configurato');
  await expect(page.getByRole('button', { name: 'Continua con Google', exact: true })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Informativa sulla privacy', exact: true })).toHaveAttribute('href', '/privacy');
  await neutralChrome(page, '.auth-card');
});

test('privacy is available without a session on desktop and mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Informativa sulla privacy', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Torna a Gentileschi Studio', exact: true })).toHaveAttribute('href', '/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await neutralChrome(page, '.privacy-card');
  }
});
