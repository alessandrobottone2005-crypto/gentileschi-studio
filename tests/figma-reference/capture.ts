import type { Slide, TemplateType } from '../../src/shared/types/template';
import type { SceneNode, NodeStyle } from '../../src/shared/types/scene';
import { assetIdForUrl } from '../../src/shared/composition/sceneAssets';
import { allNodes, clone } from '../../src/shared/composition/scene';

// Geometry comes exclusively from the native-CSS conversion of Figma's context.
export function captureFigmaFrame(frame: HTMLElement, type: TemplateType): Slide {
  const slide: Slide = {id:frame.dataset.nodeId!,templateType:type,content:{} as Slide['content']};
  const elements=[frame,...frame.querySelectorAll<HTMLElement>('*')];
  const transforms=new Map(elements.map(el=>[el,el.style.transform]));
  elements.forEach(el=>el.style.transform='none');
  const boxes=new Map(elements.map(el=>[el,el.getBoundingClientRect()]));
  let index=0;
  const items: Array<{id:string;number:string;text:string;isHighlight:boolean}>=[];
  const read=(el:HTMLElement,parent:HTMLElement,agendaId?:string):SceneNode=>{
    const box=boxes.get(el)!,parentBox=boxes.get(parent)!;
    const children=[...el.children] as HTMLElement[];
    const name=el.dataset.name||'';
    const row=name.match(/^item-(\d+)$/);
    const context=row?String(Number(row[1])):agendaId;
    if(row)items.push({id:context!,number:row[1],text:'',isHighlight:row[1]==='04'});
    const image=el instanceof HTMLImageElement;
    const photo=image&&!!assetIdForUrl(el.getAttribute('src')||'')?.endsWith('.png');
    const textOnly=el.tagName==='P'||(children.length>0&&children.every(c=>c.tagName==='P')&&!!el.style.fontFamily&&!!el.style.fontSize);
    const kind=photo?'image':image?'vector':textOnly?'text':children.length?'group':'shape';
    const cs=getComputedStyle(el);const style:NodeStyle={};
    for(const p of ['backgroundColor','backgroundImage','backgroundSize','boxShadow','filter','borderRadius','border','overflow','color','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textAlign','textTransform','whiteSpace','objectFit','objectPosition','transformOrigin'] as const){if(cs[p])(style as Record<string,unknown>)[p]=cs[p];}
    const text=textOnly?(children.length?children.map(c=>c.textContent?.trim()).join('\n'):el.textContent?.trim()||''):undefined;
    if(textOnly){if(text?.includes('\n'))style.whiteSpace='pre-wrap';if(children.length)style.lineHeight=getComputedStyle(children[0]).lineHeight;}
    let binding:string|undefined;
    if(textOnly){
      const fields:Record<string,string>={'ASSEMBLEA\nD’ISTITUTO':'title','20':'day','NOVEMBRE':'month','DALLE ORE 10:00\nALLE ORE 13:00':'timeSlot','O.D.G.':'title','ORDINE DEL GIORNO':'subtitle','IMPORTANTE!':'title','TUTTI':'highlightQuantity','GLI STUDENTI\nSONO INVITATI':'highlightLabel','LA TUA\nVOCE':'badgeText','PARTECIPARE FA\nLA DIFFERENZA':'ctaText'};
      binding=fields[text!];
      if(text==='ASSEMBLEA\nD’ISTITUTO'&&parseFloat(cs.fontSize)<50)binding=undefined;
      if(text?.startsWith('L’assemblea è il momento'))binding='paragraph1';
      if(text?.startsWith('Porta le tue idee'))binding='paragraph2';
      if(context){const item=items.find(x=>x.id===context)!;const field=/^\d\d$/.test(text!)?'number':'text';binding=`item:${context}:${field}`;item[field]=text!;}
      else if(binding)(slide.content as unknown as Record<string,unknown>)[binding]=text;
    }
    const pic=image?el:undefined;
    const src=pic?.getAttribute('src')||'';
    const media=pic?{assetId:assetIdForUrl(src),...(photo?{isTransparent:true}:{})}:undefined;
    if(photo){binding='image';style.overflow='visible';slide.content.image=media;}
    const raw=transforms.get(el);const rotate=raw?.match(/^rotate\((-?[\d.]+)deg\)$/);
    return {id:`figma:${el.dataset.nodeId||frame.dataset.nodeId+':'+ ++index}`,name:name||text?.slice(0,32)||'Decorazione',kind,x:box.left-parentBox.left-parseFloat(getComputedStyle(parent).borderLeftWidth),y:box.top-parentBox.top-parseFloat(getComputedStyle(parent).borderTopWidth),width:box.width,height:box.height,rotation:rotate?Number(rotate[1]):0,baseTransform:rotate?undefined:raw||undefined,opacity:Number(cs.opacity),visible:true,locked:false,style,text,binding,media,children:!textOnly&&!image&&!photo?children.map(c=>read(c,el,context)):undefined,agendaItemId:row?context:undefined,agendaContext:context,agendaRole:row?"row":context?(name==="number"?"badge":kind==="text"?(binding?.endsWith(":number")?"number":"text"):undefined):undefined,autoStyle:context?"theme":undefined};
  };
  const nodes=[...frame.children].map(el=>read(el as HTMLElement,frame));
  if(type==='agenda')(slide.content as any).items=items;
  slide.scene={version:1,width:1080,height:1350,background:getComputedStyle(frame).backgroundColor,nodes};
  const container=allNodes(nodes).find(n=>n.name==='items');
  if(container){slide.scene.agendaContainerId=container.id;slide.scene.agendaPrototype=clone(container.children![0]);slide.scene.agendaGap=16;
    const normal:Record<string,NodeStyle>={},highlight:Record<string,NodeStyle>={};
    for(const node of allNodes(container.children||[]))if(node.agendaRole){const target=node.agendaContext==='4'?highlight:normal;if(!target[node.agendaRole])target[node.agendaRole]=clone(node.style);}
    slide.scene.agendaStyles={normal,highlight};}
  elements.forEach(el=>el.style.transform=transforms.get(el)||'');
  return slide;
}
