import { test, expect } from "@playwright/test";

test("photo outline does not amplify faint background-removal residue", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite serves this module directly in the browser.
    const { styledPhoto, GENTILESCHI_EFFECT } = await import("/src/services/image/photoEffects.ts");
    const source = document.createElement("canvas");
    source.width = source.height = 108;
    const context = source.getContext("2d")!;
    context.fillStyle = "#333333";
    context.fillRect(40, 40, 28, 28);
    context.fillStyle = "rgba(0,0,0,0.02)";
    context.fillRect(10, 10, 1, 1);
    context.fillStyle = "#333333";
    context.fillRect(20, 20, 3, 3);
    context.fillRect(80, 80, 12, 12);
    const rendered = await styledPhoto(source.toDataURL(), {
      ...GENTILESCHI_EFFECT, outline: 30, shadow: 0,
    });
    const image = new Image();
    image.src = rendered.url;
    await image.decode();
    const output = document.createElement("canvas");
    output.width = image.naturalWidth;
    output.height = image.naturalHeight;
    const pixels = output.getContext("2d")!;
    pixels.drawImage(image, 0, 0);
    const alpha = (x: number, y: number) => pixels.getImageData(x + rendered.padding, y + rendered.padding, 1, 1).data[3];
    return {
      residueRing: alpha(13, 10),
      softResidue: alpha(10, 10),
      subject: alpha(50, 50),
      subjectOutline: alpha(38, 50),
      detachedFragmentRing: alpha(25, 21),
      originalFragment: alpha(21, 21),
      secondSubjectOutline: alpha(78, 85),
    };
  });
  expect(result.residueRing).toBe(0);
  expect(result.softResidue).toBeLessThan(10);
  expect(result.subject).toBe(255);
  expect(result.subjectOutline).toBe(255);
  expect(result.detachedFragmentRing).toBe(0);
  expect(result.originalFragment).toBe(255);
  expect(result.secondSubjectOutline).toBe(255);
});
