import type { CSSProperties } from 'react';
// Converts the exact classes returned by Figma to the project's native CSS.
export function figmaStyle(classes: string): CSSProperties {
  const s: Record<string,string|number>={boxSizing:'border-box'};
  const fixed: Record<string,Record<string,string|number>>={
    absolute:{position:'absolute'},relative:{position:'relative'},flex:{display:'flex'},block:{display:'block'},
    'flex-col':{flexDirection:'column'},'flex-none':{flex:'none'},'shrink-0':{flexShrink:0},
    'items-start':{alignItems:'flex-start'},'items-end':{alignItems:'flex-end'},'items-center':{alignItems:'center'},
    'justify-center':{justifyContent:'center'},'justify-end':{justifyContent:'flex-end'},'justify-between':{justifyContent:'space-between'},
    'content-stretch':{alignContent:'stretch'},'font-black':{fontWeight:900},'font-bold':{fontWeight:700},'font-normal':{fontWeight:400},
    'not-italic':{fontStyle:'normal'},'text-center':{textAlign:'center'},'object-contain':{objectFit:'contain'},
    'overflow-clip':{overflow:'hidden'},'overflow-hidden':{overflow:'hidden'},'pointer-events-none':{pointerEvents:'none'},
    'w-full':{width:'100%'},'h-full':{height:'100%'},'size-full':{width:'100%',height:'100%'},'max-w-none':{maxWidth:'none'},
    'min-h-px':{minHeight:1},'mb-0':{marginBottom:0},'left-0':{left:0},'top-0':{top:0},'inset-0':{inset:0},
    'border-4':{borderWidth:4},'border-solid':{borderStyle:'solid'},'[word-break:break-word]':{overflowWrap:'break-word'},
    '-translate-x-1/2':{transform:'translateX(-50%)'},
  };
  for(const c of classes.split(/\s+/)){
    if(fixed[c]){Object.assign(s,fixed[c]);continue;}
    const m=c.match(/^([\w-]+)-\[(.*)\]$/);if(!m)throw new Error('Unsupported Figma class '+c);
    const [,key,raw]=m;const value=raw.replaceAll('_',' ');
    if(key==='font'){s.fontFamily="'Inter', sans-serif";continue;}
    if(key==='text'){s[value.startsWith('color:')?'color':'fontSize']=value.replace(/^color:/,'');continue;}
    if(key==='size'){s.width=value;s.height=value;continue;}
    if(key==='rotate'){s.transform=`rotate(${value})`;continue;}
    if(key==='drop-shadow'){s.filter=`drop-shadow(${value})`;continue;}
    const keys:Record<string,string[]>={bg:['backgroundColor'],border:['borderColor'],w:['width'],h:['height'],left:['left'],top:['top'],inset:['inset'],gap:['gap'],leading:['lineHeight'],tracking:['letterSpacing'],rounded:['borderRadius'],p:['padding'],px:['paddingLeft','paddingRight'],py:['paddingTop','paddingBottom'],pb:['paddingBottom'],pl:['paddingLeft'],pr:['paddingRight'],shadow:['boxShadow'],flex:['flex']};
    if(!keys[key])throw new Error('Unsupported Figma property '+key);
    keys[key].forEach(k=>s[k]=value);
  }
  if(s.width==='64px' && s.textAlign==='center')s.whiteSpace='nowrap';
  return s as CSSProperties;
}
