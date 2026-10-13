import React from "react";
import {figmaStyle} from "../figmaStyle";
import imgArtemisiaKeyVisual from '../../../src/assets/figma/themes/0c7fe132-6107-4870-adae-21c8d593ba4c.png';
import imgImage from '../../../src/assets/figma/themes/37deeb39-4615-432a-bce3-76a1e30841bf.png';
import imgImage1 from '../../../src/assets/figma/themes/025b4e57-1d43-48ab-bbb2-a4f17a9809b7.png';
import imgCollageFasciaDiagonale from '../../../src/assets/figma/themes/1935be08-82fc-47ee-9546-e1e0d945a204.svg';
import imgCollageSticker from '../../../src/assets/figma/themes/56c122f7-390c-43e7-b116-cf2eb91ce664.svg';
import imgCollageCerchioAperto from '../../../src/assets/figma/themes/2adeac72-0428-427e-95e1-26f3ad43227e.svg';
import imgLogoCompleto from '../../../src/assets/figma/themes/037a0ea5-6566-4bbc-8c97-bfc4be344921.svg';
import imgPittogramma from '../../../src/assets/figma/themes/1363238c-4225-4b6b-b89d-b88aa3b26dfc.svg';

type GentileschiBadgeNumeratoProps = {
  className?: string;
  number?: string;
};

function GentileschiBadgeNumerato({ className, number = "01" }: GentileschiBadgeNumeratoProps) {
  return (
    <div className={className || "bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] size-[64px]"} data-node-id="30:231" data-name="Gentileschi/Badge numerato">
      <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[32px] not-italic relative shrink-0 text-[28px] text-[color:var(--gentileschi-white,white)] text-center w-[48px]")} data-node-id="30:232">
        {number}
      </p>
    </div>
  );
}

export default function Assemblea03() {
  return (
    <div style={figmaStyle("bg-[#eaf3ff] content-stretch flex flex-col gap-[var(--gentileschi-space-32,32px)] items-start relative size-full")} data-node-id="53:2619" data-name="assemblea-03">
      <div style={figmaStyle("[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 text-[color:var(--gentileschi-navy,#102a52)] w-[3432px]")} data-node-id="53:2620" data-name="Descrizione preset">
        <p style={figmaStyle("font-['Inter:Bold'] font-bold leading-[44px] relative shrink-0 text-[36px] w-[3432px]")} data-node-id="53:2621">
          03 / BLU NOTTE
        </p>
        <p style={figmaStyle("font-['Inter:Regular'] font-normal leading-[40px] relative shrink-0 text-[28px] w-[3432px]")} data-node-id="53:2622">
          Fascia diagonale · #102A52 / #78ADFF / #B8D6FF · Artemisia fissa + 2 fotografie variabili
        </p>
      </div>
      <div style={figmaStyle("content-stretch flex gap-[96px] h-[1350px] items-start relative shrink-0 w-[3432px]")} data-node-id="53:2623" data-name="Slide">
        <div style={figmaStyle("bg-[var(--assemblea-03-bg,#102a52)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2624" data-name="assemblea-03/cover">
          <div style={figmaStyle("absolute h-[624px] left-0 top-[668px] w-[1080px]")} data-node-id="53:2625" data-name="Collage / fascia diagonale">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageFasciaDiagonale} />
          </div>
          <div style={figmaStyle("absolute left-[940px] size-[176px] top-[296px]")} data-node-id="53:2627" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute left-[720px] size-[300px] top-[468px]")} data-node-id="53:2628" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute h-[113.403px] left-[64px] top-[56px] w-[272px]")} data-node-id="53:2629" data-name="logo">
            <div style={figmaStyle("absolute inset-[12.3%_5.13%]")} data-node-id="I53:2629;53:3449" data-name="LogoCompleto">
              <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgLogoCompleto} />
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[72px] w-[284px]")} data-node-id="53:2630">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[144px] w-[140px]")} data-node-id="53:2631">
            01 / 03
          </p>
          <div style={figmaStyle("absolute flex h-[292.703px] items-center justify-center left-[64px] top-[211.23px] w-[957.707px]")} data-node-id="53:2632">
            <div style={figmaStyle("flex-none rotate-[-1.25deg]")}>
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[12px_16px_0px_rgba(16,42,82,0.22)] flex flex-col items-start px-[var(--gentileschi-space-32,32px)] py-[24px] relative w-[952px]")} data-name="title / cartiglio">
                <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[120px] text-[color:var(--assemblea-03-ink,#102a52)] tracking-[-4.8px] w-[888px]")} data-node-id="I53:2632;30:234">
                  <p style={figmaStyle("leading-[112px] mb-0")}>ASSEMBLEA</p>
                  <p style={figmaStyle("leading-[112px]")}>D’ISTITUTO</p>
                </div>
              </div>
            </div>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[352px] left-[64px] not-italic text-[360px] text-[color:var(--assemblea-03-text,white)] top-[504px] tracking-[-14.4px] w-[584px]")} data-node-id="53:2633">
            20
          </p>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start left-[64px] top-[924px] w-[480px]")} data-node-id="53:2634" data-name="Data e orari">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[68px] not-italic relative shrink-0 text-[64px] text-[color:var(--gentileschi-navy,#102a52)] w-[464px]")} data-node-id="53:2635">
              NOVEMBRE
            </p>
            <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] h-[10px] relative shrink-0 w-[240px]")} data-node-id="53:2636" data-name="Collage / sottolineatura" />
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--gentileschi-navy,#102a52)] w-[448px]")} data-node-id="53:2637">
              <p style={figmaStyle("leading-[40px] mb-0")}>DALLE ORE 10:00</p>
              <p style={figmaStyle("leading-[40px]")}>ALLE ORE 13:00</p>
            </div>
          </div>
          <div style={figmaStyle("absolute h-[864px] left-[440px] top-[486px] w-[638.892px]")} data-node-id="53:2638" data-name="Artemisia / keyVisual">
            <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgArtemisiaKeyVisual} />
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[64px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[1208px] w-[280px]")} data-node-id="53:2639">
            <p style={figmaStyle("leading-[32px] mb-0")}>LE TUE IDEE</p>
            <p style={figmaStyle("leading-[32px]")}>CONTANO.</p>
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-03-bg,#102a52)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2640" data-name="assemblea-03/agenda">
          <div style={figmaStyle("absolute h-[624px] left-0 top-[668px] w-[1080px]")} data-node-id="53:2641" data-name="Collage / fascia diagonale">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageFasciaDiagonale} />
          </div>
          <div style={figmaStyle("absolute left-[940px] size-[176px] top-[296px]")} data-node-id="53:2643" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute left-[720px] size-[300px] top-[468px]")} data-node-id="53:2644" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:2645" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:2645;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[72px] w-[284px]")} data-node-id="53:2646">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[144px] w-[140px]")} data-node-id="53:2647">
            02 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[152px] left-[64px] not-italic text-[152px] text-[color:var(--assemblea-03-text,white)] top-[208px] w-[720px]")} data-node-id="53:2648">
            O.D.G.
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-03-surface,white)] h-[48px] left-[64px] top-[352px] w-[344px]")} data-node-id="53:2649" data-name="Sottotitolo / cartiglio">
            <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[16px] not-italic text-[24px] text-[color:var(--assemblea-03-ink,#102a52)] top-[8px] w-[312px]")} data-node-id="53:2650">
              ORDINE DEL GIORNO
            </p>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[934px] items-end left-[64px] overflow-clip top-[416px] w-[952px]")} data-node-id="53:2651" data-name="Contenuto adattivo / agenda">
            <div style={figmaStyle("content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start relative shrink-0 w-[952px]")} data-node-id="53:2652" data-name="items">
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2653" data-name="item-01">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[824px]")} data-node-id="53:2655">
                  Proposte degli studenti e confronto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2656" data-name="item-02">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="02" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[824px]")} data-node-id="53:2658">
                  Aggiornamenti sulle attività d’istituto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2659" data-name="item-03">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="03" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[824px]")} data-node-id="53:2661">
                  Organizzazione dei prossimi progetti.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] border-4 border-[var(--assemblea-03-accent,#b8d6ff)] border-solid content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[960px]")} data-node-id="53:2662" data-name="item-04">
                <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} data-node-id="53:2663" data-name="number">
                  <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[32px] not-italic relative shrink-0 text-[28px] text-[color:var(--gentileschi-navy,#102a52)] text-center w-[48px]")} data-node-id="I53:2663;30:232">
                    04
                  </p>
                </div>
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[40px] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-03-ink,#102a52)] w-[824px]")} data-node-id="53:2664">
                  SPAZIO ALLE IDEE DELLE CLASSI
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2665" data-name="item-05">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="05" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[824px]")} data-node-id="53:2667">
                  Varie ed eventuali.
                </p>
              </div>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start justify-between min-h-px overflow-clip relative w-full")} data-node-id="53:2668" data-name="Richiamo e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[352px]")} data-node-id="53:2669" data-name="Richiamo / area protetta">
                <div style={figmaStyle("bg-[var(--gentileschi-logo-surface,white)] content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[24px] relative shrink-0 w-[336px]")} data-node-id="53:2670" data-name="Richiamo / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] h-[8px] relative shrink-0 w-[288px]")} data-node-id="53:2671" data-name="Collage / accento richiamo" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--gentileschi-ink,#102a52)] w-[288px]")} data-node-id="53:2672">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARLIAMONE</p>
                    <p style={figmaStyle("leading-[40px]")}>INSIEME.</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[600px]")} data-node-id="53:2673" data-name="image">
                <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgImage} />
              </div>
            </div>
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-03-bg,#102a52)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2674" data-name="assemblea-03/notice">
          <div style={figmaStyle("absolute h-[624px] left-0 top-[668px] w-[1080px]")} data-node-id="53:2675" data-name="Collage / fascia diagonale">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageFasciaDiagonale} />
          </div>
          <div style={figmaStyle("absolute left-[940px] size-[176px] top-[296px]")} data-node-id="53:2677" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute left-[720px] size-[300px] top-[468px]")} data-node-id="53:2678" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:2679" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:2679;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[72px] w-[284px]")} data-node-id="53:2680">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-03-text,white)] top-[144px] w-[140px]")} data-node-id="53:2681">
            03 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[100px] left-[64px] not-italic text-[96px] text-[color:var(--assemblea-03-text,white)] top-[224px] w-[952px]")} data-node-id="53:2682">
            IMPORTANTE!
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-32,32px)] h-[176px] items-center left-[64px] px-[32px] py-[24px] top-[376px] w-[952px]")} data-node-id="53:2683" data-name="Avviso / cartiglio">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[72px] not-italic relative shrink-0 text-[64px] text-[color:var(--assemblea-03-ink,#102a52)] w-[240px]")} data-node-id="53:2684">
              TUTTI
            </p>
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-03-ink,#102a52)] w-[388px]")} data-node-id="53:2685">
              <p style={figmaStyle("leading-[40px] mb-0")}>GLI STUDENTI</p>
              <p style={figmaStyle("leading-[40px]")}>SONO INVITATI</p>
            </div>
            <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] h-[72px] relative shrink-0 w-[184px]")} data-node-id="53:2686" data-name="Badge / etichetta">
              <div style={figmaStyle("-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[92px] not-italic text-[24px] text-[color:var(--gentileschi-navy,#102a52)] text-center top-[4px] w-[160px]")} data-node-id="53:2687">
                <p style={figmaStyle("leading-[32px] mb-0")}>LA TUA</p>
                <p style={figmaStyle("leading-[32px]")}>VOCE</p>
              </div>
            </div>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[750px] items-end left-[64px] overflow-clip top-[600px] w-[952px]")} data-node-id="53:2688" data-name="Contenuto adattivo / notice">
            <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[var(--gentileschi-space-24,24px)] items-start px-[var(--gentileschi-space-32,32px)] py-[32px] relative shrink-0 w-[952px]")} data-node-id="53:2689" data-name="Paragrafi / cartiglio">
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[888px]")} data-node-id="53:2690">
                L’assemblea è il momento per condividere proposte, discutere le esigenze delle classi e costruire insieme le prossime attività.
              </p>
              <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] h-[8px] relative shrink-0 w-[888px]")} data-node-id="53:2691" data-name="Collage / separatore" />
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-03-ink,#102a52)] w-[888px]")} data-node-id="53:2692">
                Porta le tue idee e confrontati con i rappresentanti. La partecipazione di ciascuno rende la scuola più aperta e vicina agli studenti.
              </p>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start min-h-px overflow-clip relative w-full")} data-node-id="53:2693" data-name="CTA e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[432px]")} data-node-id="53:2694" data-name="CTA / area protetta">
                <div style={figmaStyle("bg-[var(--assemblea-03-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[12px] items-start p-[24px] relative shrink-0 w-[432px]")} data-node-id="53:2695" data-name="CTA / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-03-accent,#b8d6ff)] h-[8px] relative shrink-0 w-[384px]")} data-node-id="53:2696" data-name="Collage / accento CTA" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--assemblea-03-ink,#102a52)] w-[384px]")} data-node-id="53:2697">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARTECIPARE FA</p>
                    <p style={figmaStyle("leading-[40px]")}>LA DIFFERENZA</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[520px]")} data-node-id="53:2698" data-name="image">
                <div style={figmaStyle("absolute inset-0 overflow-hidden pointer-events-none")}>
                  <img alt="" style={figmaStyle("absolute h-[138.62%] left-0 max-w-none top-[-8.37%] w-full")} src={imgImage1} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
