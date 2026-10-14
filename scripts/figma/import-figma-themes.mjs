import fs from 'node:fs/promises';
import path from 'node:path';
const folder='tests/figma-reference';
await fs.mkdir(folder+'/native',{recursive:true});
const manifest={};
for(const file of (await fs.readdir(folder)).filter(x=>x.endsWith('.txt')).sort()){
  let code=await fs.readFile(folder+'/'+file,'utf8');
  for(const match of [...code.matchAll(/const (\w+) = "(https:\/\/www.figma.com\/api\/mcp\/asset\/([^\"]+))";/g)]){
    const [statement,variable,url,name]=match;
    const target='src/assets/figma/themes/'+name;
    try{await fs.access(target);}catch{const r=await fetch(url);if(!r.ok)throw new Error('Asset '+r.status+' '+name);await fs.writeFile(target,Buffer.from(await r.arrayBuffer()));}
    manifest[name]=url;
    code=code.replace(statement,`import ${variable} from '../../../src/assets/figma/themes/${name}';`);
  }
  code=code.replace(/className="([^"]*)"/g,(_,classes)=>`style={figmaStyle(${JSON.stringify(classes)})}`);
  code='import React from "react";\nimport {figmaStyle} from "../figmaStyle";\n'+code;
  await fs.writeFile(folder+'/native/'+file.replace('.txt','.tsx'),code);
}
await fs.writeFile(folder+'/assets.json',JSON.stringify(manifest,null,2));
console.log('12 reference components converted; original assets downloaded.');
// Reuse exact-byte matches rather than bundling duplicate exported photos and logos.
const {createHash}=await import('node:crypto');
const assetFolder='src/assets/figma/themes';const hashes=new Map(),mapping=new Map();
for(const file of (await fs.readdir(assetFolder)).sort()){
  const hash=createHash('sha256').update(await fs.readFile(assetFolder+'/'+file)).digest('hex');
  if(!hashes.has(hash))hashes.set(hash,file);mapping.set(file,hashes.get(hash));
}
for(const file of await fs.readdir(folder+'/native')){
  let source=await fs.readFile(folder+'/native/'+file,'utf8');
  for(const [original,canonical]of mapping)source=source.replaceAll('/themes/'+original,'/themes/'+canonical);
  await fs.writeFile(folder+'/native/'+file,source);
}
for(const [original,canonical]of mapping)if(original!==canonical)await fs.unlink(assetFolder+'/'+original);
