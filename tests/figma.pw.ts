import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";
for (let theme = 1; theme <= 12; theme++)
  test(`Figma set ${theme}: all three editable compositions match the source`, async ({
    page,
  }, info) => {
    await page.goto(`/tests/import-fixture.html?theme=${theme}&compare=1`);
    await page.waitForFunction(
      () => typeof (window as any).capture === "function",
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    const reports = [];
    for (const role of ["cover", "agenda", "notice"]) {
      const name = `assemblea-${String(theme).padStart(2, "0")}/${role}`;
      const a = PNG.sync.read(
        await page.locator(`[data-name="${name}"]`).screenshot(),
      );
      const actual = await page
        .getByTestId(`scene-${role}`)
        .screenshot({ path: info.outputPath(`${role}.png`) });
      const b = PNG.sync.read(actual);
      expect([b.width, b.height]).toEqual([a.width, a.height]);
      let diff = 0;
      for (let p = 0; p < a.data.length; p += 4)
        if (
          Math.max(
            ...[0, 1, 2].map((c) => Math.abs(a.data[p + c] - b.data[p + c])),
          ) > 20
        )
          diff++;
      reports.push({ role, difference: diff / (a.width * a.height) });
      expect(
        diff / (a.width * a.height),
        `${name} pixel mismatch`,
      ).toBeLessThan(0.007);
      await expect(
        page.getByTestId(`scene-${role}`).locator("[data-missing-media]"),
      ).toHaveCount(0);
    }
    await info.attach("comparison", {
      body: JSON.stringify(reports),
      contentType: "application/json",
    });
  });
