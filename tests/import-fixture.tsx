import React from 'react';
import {createRoot} from 'react-dom/client';
import '../src/shared/styles/tokens.css';
import {captureFigmaFrame} from './figma-reference/capture';
import Theme1 from './figma-reference/native/assemblea-01';
import Theme2 from './figma-reference/native/assemblea-02';
import Theme3 from './figma-reference/native/assemblea-03';
import Theme4 from './figma-reference/native/assemblea-04';
import Theme5 from './figma-reference/native/assemblea-05';
import Theme6 from './figma-reference/native/assemblea-06';
import Theme7 from './figma-reference/native/assemblea-07';
import Theme8 from './figma-reference/native/assemblea-08';
import Theme9 from './figma-reference/native/assemblea-09';
import Theme10 from './figma-reference/native/assemblea-10';
import Theme11 from './figma-reference/native/assemblea-11';
import Theme12 from './figma-reference/native/assemblea-12';

const themes=[Theme1,Theme2,Theme3,Theme4,Theme5,Theme6,Theme7,Theme8,Theme9,Theme10,Theme11,Theme12];
const i=Number(new URLSearchParams(location.search).get('theme')||1)-1;
createRoot(document.getElementById('root')!).render(React.createElement(themes[i]));
(window as any).capture=async()=>{await document.fonts.ready;await Promise.all([...document.images].map(x=>x.decode()));return [...document.querySelectorAll<HTMLElement>('[data-name]')].filter(x=>/assemblea-\d+\/(cover|agenda|notice)$/.test(x.dataset.name||'')).map(x=>captureFigmaFrame(x,x.dataset.name!.split('/')[1] as any));};
import importedThemes from '../src/assets/figma/themes.json';
import {SceneRenderer} from '../src/shared/rendering/SceneRenderer';
if(new URLSearchParams(location.search).has('compare')){
  const host=document.createElement('div');host.style.marginTop='1700px';document.body.appendChild(host);
  createRoot(host).render(<div style={{display:'flex',gap:96,marginTop:40}}>{importedThemes[i].slides.map((slide:any)=><div data-testid={'scene-'+slide.templateType} key={slide.id}><SceneRenderer slide={slide}/></div>)}</div>);
}
