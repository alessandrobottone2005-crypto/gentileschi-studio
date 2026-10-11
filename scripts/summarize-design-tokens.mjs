import fs from 'fs';

const metrics = JSON.parse(fs.readFileSync('scripts/figma-metrics.json', 'utf8'));

const colors = new Set();
const fonts = new Set();
const effects = new Set();

for (const [frameId, frame] of Object.entries(metrics)) {
  console.log(`\n================================`);
  console.log(`FRAME: ${frame.name} (${frameId})`);
  console.log(`================================`);
  for (const el of frame.elements) {
    if (el.fills) {
      for (const f of el.fills) {
        if (f.hex) colors.add(f.hex);
      }
    }
    if (el.style) {
      const fStr = `${el.style.fontFamily} | weight: ${el.style.fontWeight} | size: ${el.style.fontSize}px | lh: ${el.style.lineHeightPx}px | case: ${el.style.textCase || 'none'}`;
      fonts.add(fStr);
    }
    if (el.effects && el.effects.length > 0) {
      for (const ef of el.effects) {
        effects.add(JSON.stringify(ef));
      }
    }
    if (el.rotation !== 0) {
      console.log(`ROTATED: "${el.name}" => ${el.rotation}° (relX: ${el.relX}, relY: ${el.relY}, w: ${el.w}, h: ${el.h})`);
    }
  }
}

console.log('\n--- ALL COLORS ---');
console.log([...colors].sort());

console.log('\n--- ALL TYPOGRAPHY ---');
console.log([...fonts].sort());

console.log('\n--- ALL EFFECTS ---');
console.log([...effects]);
