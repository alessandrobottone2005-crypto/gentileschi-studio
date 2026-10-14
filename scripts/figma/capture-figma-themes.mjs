import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const browser=await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:3432,height:1510}});
  const themes=[];
  for(let index=1;index<=12;index++){
    await page.goto(`http://127.0.0.1:5174/tests/import-fixture.html?theme=${index}`);
    await page.waitForFunction(()=>typeof window.capture==='function');
    const slides=await page.evaluate(()=>window.capture());
    const description=await page.locator('[data-name="Descrizione preset"]').innerText();
    themes.push({id:`assemblea-${String(index).padStart(2,'0')}`,name:description.split('\n')[0].replace(/^\d+ \/ /,''),official:true,format:'portrait',slides});
  }
  await fs.writeFile('src/assets/figma/themes.json',JSON.stringify(themes));
  console.log('Captured 36 original editable Figma compositions.');
}finally{await browser.close();}
