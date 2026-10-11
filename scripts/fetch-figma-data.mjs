import fs from 'fs';
import path from 'path';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FILE_KEY = 'ywejsvJaT41fwJ1KnwDsU2';
const NODE_IDS = ['4:2758', '4:2791', '4:2838'];

async function fetchFigma(endpoint) {
  const res = await fetch(`https://api.figma.com/v1/${endpoint}`, {
    headers: {
      'X-Figma-Token': FIGMA_TOKEN
    }
  });
  if (!res.ok) {
    throw new Error(`Figma API error on ${endpoint}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function main() {
  console.log('1. Fetching nodes...');
  const nodesData = await fetchFigma(`files/${FILE_KEY}/nodes?ids=${NODE_IDS.join(',')}&geometry=paths`);
  fs.writeFileSync('scripts/figma-nodes.json', JSON.stringify(nodesData, null, 2));
  console.log('Saved scripts/figma-nodes.json');

  console.log('2. Fetching rendered reference frames...');
  const renderData = await fetchFigma(`images/${FILE_KEY}?ids=${NODE_IDS.join(',')}&format=png&scale=1`);
  for (const [nodeId, url] of Object.entries(renderData.images)) {
    const filename = `reference-${nodeId.replace(':', '_')}.png`;
    const dest = path.join('src/assets/figma', filename);
    await downloadFile(url, dest);
    console.log(`Saved reference image: ${dest}`);
  }

  console.log('3. Fetching image fills...');
  try {
    const imagesMeta = await fetchFigma(`files/${FILE_KEY}/images`);
    fs.writeFileSync('scripts/figma-images-meta.json', JSON.stringify(imagesMeta, null, 2));
    if (imagesMeta.meta && imagesMeta.meta.images) {
      for (const [imageRef, url] of Object.entries(imagesMeta.meta.images)) {
        const dest = path.join('src/assets/figma', `fill-${imageRef}.png`);
        await downloadFile(url, dest);
        console.log(`Saved fill image: ${dest}`);
      }
    }
  } catch (err) {
    console.warn('Could not fetch image fills:', err.message);
  }

  console.log('Done preliminary fetch!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
