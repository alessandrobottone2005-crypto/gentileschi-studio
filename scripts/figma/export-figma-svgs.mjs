import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'ywejsvJaT41fwJ1KnwDsU2';

// Vector nodes and shapes to export as SVG
const SVG_NODES = {
  'star-burst-lime-1': '4:2760',
  'star-burst-blue-1': '4:2761',
  'drawn-circle-1': '4:2762',
  'sticker-lime-1': '4:2763',
  'drawn-arrow-1': '4:2786',
  'star-burst-lime-2': '4:2794',
  'star-burst-blue-2': '4:2795',
  'ring-drawn-2': '4:2796',
  'drawn-arrow-2': '4:2833',
  'star-burst-lime-3': '4:2841',
  'star-burst-blue-3': '4:2842',
  'drawn-circle-3': '4:2843',
  'star-lime-3': '4:2844',
  'drawn-arrow-3': '4:2866'
};

async function main() {
  const ids = Object.values(SVG_NODES).join(',');
  console.log(`Requesting SVGs for ids: ${ids}`);
  const res = await fetch(`https://api.figma.com/v1/images/${FILE_KEY}?ids=${ids}&format=svg`, {
    headers: { 'X-Figma-Token': FIGMA_TOKEN }
  });
  const data = await res.json();
  fs.mkdirSync('src/assets/figma/vectors', { recursive: true });

  for (const [name, id] of Object.entries(SVG_NODES)) {
    const url = data.images[id];
    if (url) {
      const svgRes = await fetch(url);
      const svgText = await svgRes.text();
      const dest = path.join('src/assets/figma/vectors', `${name}.svg`);
      fs.writeFileSync(dest, svgText);
      console.log(`Saved SVG: ${dest}`);
    } else {
      console.warn(`No SVG URL for ${name} (${id})`);
    }
  }
}

main().catch(console.error);
