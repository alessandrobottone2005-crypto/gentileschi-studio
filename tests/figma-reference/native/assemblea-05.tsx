import React from "react";
import {figmaStyle} from "../figmaStyle";
import imgArtemisiaKeyVisual from '../../../src/assets/figma/themes/0c7fe132-6107-4870-adae-21c8d593ba4c.png';
import imgImage from '../../../src/assets/figma/themes/37deeb39-4615-432a-bce3-76a1e30841bf.png';
import imgImage1 from '../../../src/assets/figma/themes/025b4e57-1d43-48ab-bbb2-a4f17a9809b7.png';
import imgCollageCerchioAperto from '../../../src/assets/figma/themes/2b409d03-8261-4667-a2cc-ad8dff86fd2f.svg';
import imgCollageCerchioAperto1 from '../../../src/assets/figma/themes/cdeaaac1-0e33-4e90-94d0-3b1eef2124b5.svg';
import imgCollageSticker from '../../../src/assets/figma/themes/22c24bd0-225f-451b-9ebb-e28d734368e6.svg';
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

export default function Assemblea05() {
  return (
    <div style={figmaStyle("bg-[#eaf3ff] content-stretch flex flex-col gap-[var(--gentileschi-space-32,32px)] items-start relative size-full")} data-node-id="53:2779" data-name="assemblea-05">
      <div style={figmaStyle("[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 text-[color:var(--gentileschi-navy,#102a52)] w-[3432px]")} data-node-id="53:2780" data-name="Descrizione preset">
        <p style={figmaStyle("font-['Inter:Bold'] font-bold leading-[44px] relative shrink-0 text-[36px] w-[3432px]")} data-node-id="53:2781">
          05 / ORBITA CELESTE
        </p>
        <p style={figmaStyle("font-['Inter:Regular'] font-normal leading-[40px] relative shrink-0 text-[28px] w-[3432px]")} data-node-id="53:2782">
          Cerchi e sovrapposizioni · #FFFFFF / #B8D6FF / #2E80FF · Artemisia fissa + 2 fotografie variabili
        </p>
      </div>
      <div style={figmaStyle("content-stretch flex gap-[96px] h-[1350px] items-start relative shrink-0 w-[3432px]")} data-node-id="53:2783" data-name="Slide">
        <div style={figmaStyle("bg-[var(--assemblea-05-bg,white)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2784" data-name="assemblea-05/cover">
          <div style={figmaStyle("absolute left-[-96px] size-[632px] top-[484px]")} data-node-id="53:2785" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute left-[768px] size-[344px] top-[272px]")} data-node-id="53:2786" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto1} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-05-secondary,#b8d6ff)] h-[250px] left-0 top-[1100px] w-[1080px]")} data-node-id="53:2787" data-name="Collage / fascia inferiore" />
          <div style={figmaStyle("absolute left-[892px] size-[184px] top-[1008px]")} data-node-id="53:2788" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute h-[113.403px] left-[64px] top-[56px] w-[272px]")} data-node-id="53:2789" data-name="logo">
            <div style={figmaStyle("absolute inset-[12.3%_5.13%]")} data-node-id="I53:2789;53:3449" data-name="LogoCompleto">
              <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgLogoCompleto} />
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[72px] w-[284px]")} data-node-id="53:2790">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[144px] w-[140px]")} data-node-id="53:2791">
            01 / 03
          </p>
          <div style={figmaStyle("absolute flex h-[291.878px] items-center justify-center left-[58.3px] top-[232px] w-[957.488px]")} data-node-id="53:2792">
            <div style={figmaStyle("flex-none rotate-[1.2deg]")}>
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[12px_16px_0px_rgba(16,42,82,0.22)] flex flex-col items-start px-[var(--gentileschi-space-32,32px)] py-[24px] relative w-[952px]")} data-name="title / cartiglio">
                <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[120px] text-[color:var(--assemblea-05-ink,#102a52)] tracking-[-4.8px] w-[888px]")} data-node-id="I53:2792;30:234">
                  <p style={figmaStyle("leading-[112px] mb-0")}>ASSEMBLEA</p>
                  <p style={figmaStyle("leading-[112px]")}>D’ISTITUTO</p>
                </div>
              </div>
            </div>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[352px] left-[64px] not-italic text-[360px] text-[color:var(--assemblea-05-text,#102a52)] top-[504px] tracking-[-14.4px] w-[584px]")} data-node-id="53:2793">
            20
          </p>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start left-[64px] top-[924px] w-[480px]")} data-node-id="53:2794" data-name="Data e orari">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[68px] not-italic relative shrink-0 text-[64px] text-[color:var(--gentileschi-navy,#102a52)] w-[464px]")} data-node-id="53:2795">
              NOVEMBRE
            </p>
            <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] h-[10px] relative shrink-0 w-[240px]")} data-node-id="53:2796" data-name="Collage / sottolineatura" />
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--gentileschi-navy,#102a52)] w-[448px]")} data-node-id="53:2797">
              <p style={figmaStyle("leading-[40px] mb-0")}>DALLE ORE 10:00</p>
              <p style={figmaStyle("leading-[40px]")}>ALLE ORE 13:00</p>
            </div>
          </div>
          <div style={figmaStyle("absolute h-[824px] left-[440px] top-[526px] w-[609.313px]")} data-node-id="53:2798" data-name="Artemisia / keyVisual">
            <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgArtemisiaKeyVisual} />
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[64px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[1208px] w-[280px]")} data-node-id="53:2799">
            <p style={figmaStyle("leading-[32px] mb-0")}>LE TUE IDEE</p>
            <p style={figmaStyle("leading-[32px]")}>CONTANO.</p>
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-05-bg,white)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2800" data-name="assemblea-05/agenda">
          <div style={figmaStyle("absolute left-[-96px] size-[632px] top-[484px]")} data-node-id="53:2801" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute left-[768px] size-[344px] top-[272px]")} data-node-id="53:2802" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto1} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-05-secondary,#b8d6ff)] h-[250px] left-0 top-[1100px] w-[1080px]")} data-node-id="53:2803" data-name="Collage / fascia inferiore" />
          <div style={figmaStyle("absolute left-[892px] size-[184px] top-[1008px]")} data-node-id="53:2804" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:2805" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:2805;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[72px] w-[284px]")} data-node-id="53:2806">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[144px] w-[140px]")} data-node-id="53:2807">
            02 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[152px] left-[64px] not-italic text-[152px] text-[color:var(--assemblea-05-text,#102a52)] top-[208px] w-[720px]")} data-node-id="53:2808">
            O.D.G.
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-05-surface,#eaf3ff)] h-[48px] left-[64px] top-[352px] w-[344px]")} data-node-id="53:2809" data-name="Sottotitolo / cartiglio">
            <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[16px] not-italic text-[24px] text-[color:var(--assemblea-05-ink,#102a52)] top-[8px] w-[312px]")} data-node-id="53:2810">
              ORDINE DEL GIORNO
            </p>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[934px] items-end left-[64px] overflow-clip top-[416px] w-[952px]")} data-node-id="53:2811" data-name="Contenuto adattivo / agenda">
            <div style={figmaStyle("content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start relative shrink-0 w-[952px]")} data-node-id="53:2812" data-name="items">
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2813" data-name="item-01">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[824px]")} data-node-id="53:2815">
                  Proposte degli studenti e confronto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2816" data-name="item-02">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="02" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[824px]")} data-node-id="53:2818">
                  Aggiornamenti sulle attività d’istituto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2819" data-name="item-03">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="03" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[824px]")} data-node-id="53:2821">
                  Organizzazione dei prossimi progetti.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] border-4 border-[var(--assemblea-05-accent,#2e80ff)] border-solid content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[960px]")} data-node-id="53:2822" data-name="item-04">
                <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} data-node-id="53:2823" data-name="number">
                  <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[32px] not-italic relative shrink-0 text-[28px] text-[color:var(--gentileschi-navy,#102a52)] text-center w-[48px]")} data-node-id="I53:2823;30:232">
                    04
                  </p>
                </div>
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[40px] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-05-ink,#102a52)] w-[824px]")} data-node-id="53:2824">
                  SPAZIO ALLE IDEE DELLE CLASSI
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:2825" data-name="item-05">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="05" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[824px]")} data-node-id="53:2827">
                  Varie ed eventuali.
                </p>
              </div>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start justify-between min-h-px overflow-clip relative w-full")} data-node-id="53:2828" data-name="Richiamo e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[352px]")} data-node-id="53:2829" data-name="Richiamo / area protetta">
                <div style={figmaStyle("bg-[var(--gentileschi-logo-surface,white)] content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[24px] relative shrink-0 w-[336px]")} data-node-id="53:2830" data-name="Richiamo / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] h-[8px] relative shrink-0 w-[288px]")} data-node-id="53:2831" data-name="Collage / accento richiamo" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--gentileschi-ink,#102a52)] w-[288px]")} data-node-id="53:2832">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARLIAMONE</p>
                    <p style={figmaStyle("leading-[40px]")}>INSIEME.</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[600px]")} data-node-id="53:2833" data-name="image">
                <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgImage} />
              </div>
            </div>
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-05-bg,white)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:2834" data-name="assemblea-05/notice">
          <div style={figmaStyle("absolute left-[-96px] size-[632px] top-[484px]")} data-node-id="53:2835" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto} />
          </div>
          <div style={figmaStyle("absolute left-[768px] size-[344px] top-[272px]")} data-node-id="53:2836" data-name="Collage / cerchio aperto">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageCerchioAperto1} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-05-secondary,#b8d6ff)] h-[250px] left-0 top-[1100px] w-[1080px]")} data-node-id="53:2837" data-name="Collage / fascia inferiore" />
          <div style={figmaStyle("absolute left-[892px] size-[184px] top-[1008px]")} data-node-id="53:2838" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:2839" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:2839;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[72px] w-[284px]")} data-node-id="53:2840">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-05-text,#102a52)] top-[144px] w-[140px]")} data-node-id="53:2841">
            03 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[100px] left-[64px] not-italic text-[96px] text-[color:var(--assemblea-05-text,#102a52)] top-[224px] w-[952px]")} data-node-id="53:2842">
            IMPORTANTE!
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-32,32px)] h-[176px] items-center left-[64px] px-[32px] py-[24px] top-[376px] w-[952px]")} data-node-id="53:2843" data-name="Avviso / cartiglio">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[72px] not-italic relative shrink-0 text-[64px] text-[color:var(--assemblea-05-ink,#102a52)] w-[240px]")} data-node-id="53:2844">
              TUTTI
            </p>
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-05-ink,#102a52)] w-[388px]")} data-node-id="53:2845">
              <p style={figmaStyle("leading-[40px] mb-0")}>GLI STUDENTI</p>
              <p style={figmaStyle("leading-[40px]")}>SONO INVITATI</p>
            </div>
            <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] h-[72px] relative shrink-0 w-[184px]")} data-node-id="53:2846" data-name="Badge / etichetta">
              <div style={figmaStyle("-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[92px] not-italic text-[24px] text-[color:var(--gentileschi-navy,#102a52)] text-center top-[4px] w-[160px]")} data-node-id="53:2847">
                <p style={figmaStyle("leading-[32px] mb-0")}>LA TUA</p>
                <p style={figmaStyle("leading-[32px]")}>VOCE</p>
              </div>
            </div>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[750px] items-end left-[64px] overflow-clip top-[600px] w-[952px]")} data-node-id="53:2848" data-name="Contenuto adattivo / notice">
            <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[var(--gentileschi-space-24,24px)] items-start px-[var(--gentileschi-space-32,32px)] py-[32px] relative shrink-0 w-[952px]")} data-node-id="53:2849" data-name="Paragrafi / cartiglio">
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[888px]")} data-node-id="53:2850">
                L’assemblea è il momento per condividere proposte, discutere le esigenze delle classi e costruire insieme le prossime attività.
              </p>
              <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] h-[8px] relative shrink-0 w-[888px]")} data-node-id="53:2851" data-name="Collage / separatore" />
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-05-ink,#102a52)] w-[888px]")} data-node-id="53:2852">
                Porta le tue idee e confrontati con i rappresentanti. La partecipazione di ciascuno rende la scuola più aperta e vicina agli studenti.
              </p>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start min-h-px overflow-clip relative w-full")} data-node-id="53:2853" data-name="CTA e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[432px]")} data-node-id="53:2854" data-name="CTA / area protetta">
                <div style={figmaStyle("bg-[var(--assemblea-05-surface,#eaf3ff)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[12px] items-start p-[24px] relative shrink-0 w-[432px]")} data-node-id="53:2855" data-name="CTA / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-05-accent,#2e80ff)] h-[8px] relative shrink-0 w-[384px]")} data-node-id="53:2856" data-name="Collage / accento CTA" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--assemblea-05-ink,#102a52)] w-[384px]")} data-node-id="53:2857">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARTECIPARE FA</p>
                    <p style={figmaStyle("leading-[40px]")}>LA DIFFERENZA</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[520px]")} data-node-id="53:2858" data-name="image">
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
