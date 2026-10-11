import fs from 'fs';

const nodesData = JSON.parse(fs.readFileSync('scripts/figma-nodes.json', 'utf8'));

function rgbToHex(c) {
  if (!c) return null;
  const toHex = n => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function getRotationFromTransform(t) {
  if (!t) return 0;
  // t is [[a, c, tx], [b, d, ty]]
  const a = t[0][0];
  const b = t[1][0];
  const angleRad = Math.atan2(b, a);
  return Math.round((angleRad * 180 / Math.PI) * 100) / 100;
}

function processFrame(frameNode) {
  const frameBox = frameNode.absoluteBoundingBox;
  const frameOriginX = frameBox.x;
  const frameOriginY = frameBox.y;

  const results = [];

  function walk(node, parentPath = '') {
    const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
    const relX = node.absoluteBoundingBox ? Math.round((node.absoluteBoundingBox.x - frameOriginX) * 10) / 10 : null;
    const relY = node.absoluteBoundingBox ? Math.round((node.absoluteBoundingBox.y - frameOriginY) * 10) / 10 : null;
    const w = node.absoluteBoundingBox ? Math.round(node.absoluteBoundingBox.width * 10) / 10 : null;
    const h = node.absoluteBoundingBox ? Math.round(node.absoluteBoundingBox.height * 10) / 10 : null;
    const rotation = getRotationFromTransform(node.relativeTransform);

    const item = {
      id: node.id,
      name: node.name,
      type: node.type,
      path: currentPath,
      relX,
      relY,
      w,
      h,
      rotation,
      fills: node.fills?.map(f => ({
        type: f.type,
        hex: f.color ? rgbToHex(f.color) : null,
        opacity: f.opacity ?? 1,
        imageRef: f.imageRef,
        visible: f.visible !== false
      })),
      strokes: node.strokes?.map(s => ({
        type: s.type,
        hex: s.color ? rgbToHex(s.color) : null,
        weight: node.strokeWeight
      })),
      effects: node.effects?.map(e => ({
        type: e.type,
        offset: e.offset,
        radius: e.radius,
        hex: e.color ? rgbToHex(e.color) : null,
        alpha: e.color?.a
      })),
      style: node.style ? {
        fontFamily: node.style.fontFamily,
        fontWeight: node.style.fontWeight,
        fontSize: node.style.fontSize,
        lineHeightPx: node.style.lineHeightPx,
        letterSpacing: node.style.letterSpacing,
        textAlignHorizontal: node.style.textAlignHorizontal,
        textCase: node.style.textCase
      } : null,
      characters: node.characters
    };

    results.push(item);

    if (node.children) {
      for (const child of node.children) {
        walk(child, currentPath);
      }
    }
  }

  walk(frameNode);
  return results;
}

const detailed = {};
for (const [nodeId, obj] of Object.entries(nodesData.nodes)) {
  detailed[nodeId] = {
    name: obj.document.name,
    elements: processFrame(obj.document)
  };
}

fs.writeFileSync('scripts/figma-metrics.json', JSON.stringify(detailed, null, 2));
console.log('Saved scripts/figma-metrics.json');
