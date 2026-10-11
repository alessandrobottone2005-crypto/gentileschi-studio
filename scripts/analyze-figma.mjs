import fs from 'fs';

const nodesData = JSON.parse(fs.readFileSync('scripts/figma-nodes.json', 'utf8'));

function analyzeNode(node, depth = 0) {
  const indent = '  '.repeat(depth);
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    box: node.absoluteBoundingBox,
    fills: node.fills?.map(f => ({ type: f.type, color: f.color, opacity: f.opacity, imageRef: f.imageRef })),
    strokes: node.strokes?.map(s => ({ type: s.type, color: s.color })),
    effects: node.effects?.map(e => ({ type: e.type, radius: e.radius, offset: e.offset, color: e.color })),
    rotation: node.rotation,
    style: node.style ? {
      fontFamily: node.style.fontFamily,
      fontWeight: node.style.fontWeight,
      fontSize: node.style.fontSize,
      textAlignHorizontal: node.style.textAlignHorizontal,
      lineHeightPx: node.style.lineHeightPx,
      letterSpacing: node.style.letterSpacing,
      textCase: node.style.textCase,
    } : undefined,
    characters: node.characters
  };

  console.log(`${indent}[${node.type}] "${node.name}" (id: ${node.id}) ${node.characters ? `text: "${node.characters}"` : ''}`);
  if (node.style) {
    console.log(`${indent}   Font: ${node.style.fontFamily} ${node.style.fontWeight} ${node.style.fontSize}px`);
  }
  if (node.fills && node.fills.length > 0) {
    console.log(`${indent}   Fills: ${JSON.stringify(node.fills)}`);
  }
  if (node.effects && node.effects.length > 0) {
    console.log(`${indent}   Effects: ${JSON.stringify(node.effects)}`);
  }
  if (node.absoluteBoundingBox) {
    console.log(`${indent}   Box: w:${node.absoluteBoundingBox.width} h:${node.absoluteBoundingBox.height} x:${node.absoluteBoundingBox.x} y:${node.absoluteBoundingBox.y}`);
  }

  if (node.children) {
    for (const child of node.children) {
      analyzeNode(child, depth + 1);
    }
  }
}

for (const [nodeId, nodeObj] of Object.entries(nodesData.nodes)) {
  console.log(`\n========================================`);
  console.log(`FRAME ${nodeId}: ${nodeObj.document.name}`);
  console.log(`========================================`);
  analyzeNode(nodeObj.document);
}
