import React from "react";
import {figmaStyle} from "../figmaStyle";
import imgArtemisiaKeyVisual from '../../../src/assets/figma/themes/0c7fe132-6107-4870-adae-21c8d593ba4c.png';
import imgImage from '../../../src/assets/figma/themes/37deeb39-4615-432a-bce3-76a1e30841bf.png';
import imgImage1 from '../../../src/assets/figma/themes/025b4e57-1d43-48ab-bbb2-a4f17a9809b7.png';
import imgCollageSticker from '../../../src/assets/figma/themes/deaa7e94-da1a-4e6c-b1d1-3a2ea180a441.svg';
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

export default function Assemblea10() {
  return (
    <div style={figmaStyle("bg-[#eaf3ff] content-stretch flex flex-col gap-[var(--gentileschi-space-32,32px)] items-start relative size-full")} data-node-id="53:3203" data-name="assemblea-10">
      <div style={figmaStyle("[word-break:break-word] content-stretch flex flex-col gap-[8px] items-start not-italic relative shrink-0 text-[color:var(--gentileschi-navy,#102a52)] w-[3432px]")} data-node-id="53:3204" data-name="Descrizione preset">
        <p style={figmaStyle("font-['Inter:Bold'] font-bold leading-[44px] relative shrink-0 text-[36px] w-[3432px]")} data-node-id="53:3205">
          10 / EDITORIALE LIME
        </p>
        <p style={figmaStyle("font-['Inter:Regular'] font-normal leading-[40px] relative shrink-0 text-[28px] w-[3432px]")} data-node-id="53:3206">
          Blocchi sfalsati · #2E80FF / #102A52 / #DFFF2F · Artemisia fissa + 2 fotografie variabili
        </p>
      </div>
      <div style={figmaStyle("content-stretch flex gap-[96px] h-[1350px] items-start relative shrink-0 w-[3432px]")} data-node-id="53:3207" data-name="Slide">
        <div style={figmaStyle("bg-[var(--assemblea-10-bg,#2e80ff)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:3208" data-name="assemblea-10/cover">
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[784px] left-[904px] top-[296px] w-[176px]")} data-node-id="53:3209" data-name="Collage / blocco laterale" />
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[238px] left-0 top-[1112px] w-[1080px]")} data-node-id="53:3210" data-name="Collage / blocco inferiore" />
          <div style={figmaStyle("absolute left-[904px] size-[104px] top-[1136px]")} data-node-id="53:3211" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-accent,#dfff2f)] h-[12px] left-[880px] top-[192px] w-[136px]")} data-node-id="53:3212" data-name="Collage / filetti" />
          <div style={figmaStyle("absolute h-[113.403px] left-[64px] top-[56px] w-[272px]")} data-node-id="53:3213" data-name="logo">
            <div style={figmaStyle("absolute inset-[12.3%_5.13%]")} data-node-id="I53:3213;53:3449" data-name="LogoCompleto">
              <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgLogoCompleto} />
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[72px] w-[284px]")} data-node-id="53:3214">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[144px] w-[140px]")} data-node-id="53:3215">
            01 / 03
          </p>
          <div style={figmaStyle("absolute flex h-[281.954px] items-center justify-center left-[64px] top-[222.03px] w-[954.796px]")} data-node-id="53:3216">
            <div style={figmaStyle("flex-none rotate-[-0.6deg]")}>
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[12px_16px_0px_rgba(16,42,82,0.22)] flex flex-col items-start px-[var(--gentileschi-space-32,32px)] py-[24px] relative w-[952px]")} data-name="title / cartiglio">
                <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[120px] text-[color:var(--assemblea-10-ink,#102a52)] tracking-[-4.8px] w-[888px]")} data-node-id="I53:3216;30:234">
                  <p style={figmaStyle("leading-[112px] mb-0")}>ASSEMBLEA</p>
                  <p style={figmaStyle("leading-[112px]")}>D’ISTITUTO</p>
                </div>
              </div>
            </div>
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-surface,white)] h-[384px] left-[64px] shadow-[8px_12px_0px_0px_rgba(10,26,56,0.2)] top-[536px] w-[488px]")} data-node-id="53:3217" data-name="Data / cartiglio" />
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[352px] left-[88px] not-italic text-[360px] text-[color:var(--assemblea-10-ink,#102a52)] top-[532px] tracking-[-14.4px] w-[584px]")} data-node-id="53:3218">
            20
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-surface,white)] h-[232px] left-[40px] shadow-[8px_12px_0px_0px_rgba(10,26,56,0.2)] top-[908px] w-[520px]")} data-node-id="53:3219" data-name="Data / supporto" />
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start left-[64px] top-[924px] w-[480px]")} data-node-id="53:3220" data-name="Data e orari">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[68px] not-italic relative shrink-0 text-[64px] text-[color:var(--gentileschi-navy,#102a52)] w-[464px]")} data-node-id="53:3221">
              NOVEMBRE
            </p>
            <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] h-[10px] relative shrink-0 w-[240px]")} data-node-id="53:3222" data-name="Collage / sottolineatura" />
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--gentileschi-navy,#102a52)] w-[448px]")} data-node-id="53:3223">
              <p style={figmaStyle("leading-[40px] mb-0")}>DALLE ORE 10:00</p>
              <p style={figmaStyle("leading-[40px]")}>ALLE ORE 13:00</p>
            </div>
          </div>
          <div style={figmaStyle("absolute h-[800px] left-[516px] top-[550px] w-[591.566px]")} data-node-id="53:3224" data-name="Artemisia / keyVisual">
            <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgArtemisiaKeyVisual} />
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-10-bg,#2e80ff)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:3225" data-name="assemblea-10/agenda">
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[784px] left-[904px] top-[296px] w-[176px]")} data-node-id="53:3226" data-name="Collage / blocco laterale" />
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[238px] left-0 top-[1112px] w-[1080px]")} data-node-id="53:3227" data-name="Collage / blocco inferiore" />
          <div style={figmaStyle("absolute left-[904px] size-[104px] top-[1136px]")} data-node-id="53:3228" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-accent,#dfff2f)] h-[12px] left-[880px] top-[192px] w-[136px]")} data-node-id="53:3229" data-name="Collage / filetti" />
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:3230" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:3230;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[72px] w-[284px]")} data-node-id="53:3231">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[144px] w-[140px]")} data-node-id="53:3232">
            02 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[152px] left-[64px] not-italic text-[152px] text-[color:var(--assemblea-10-text,white)] top-[208px] w-[720px]")} data-node-id="53:3233">
            O.D.G.
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-surface,white)] h-[48px] left-[64px] top-[352px] w-[344px]")} data-node-id="53:3234" data-name="Sottotitolo / cartiglio">
            <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[16px] not-italic text-[24px] text-[color:var(--assemblea-10-ink,#102a52)] top-[8px] w-[312px]")} data-node-id="53:3235">
              ORDINE DEL GIORNO
            </p>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[934px] items-end left-[64px] overflow-clip top-[416px] w-[952px]")} data-node-id="53:3236" data-name="Contenuto adattivo / agenda">
            <div style={figmaStyle("content-stretch flex flex-col gap-[var(--gentileschi-space-16,16px)] items-start relative shrink-0 w-[952px]")} data-node-id="53:3237" data-name="items">
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:3238" data-name="item-01">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[824px]")} data-node-id="53:3240">
                  Proposte degli studenti e confronto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:3241" data-name="item-02">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="02" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[824px]")} data-node-id="53:3243">
                  Aggiornamenti sulle attività d’istituto.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:3244" data-name="item-03">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="03" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[824px]")} data-node-id="53:3246">
                  Organizzazione dei prossimi progetti.
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] border-4 border-[var(--assemblea-10-accent,#dfff2f)] border-solid content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[960px]")} data-node-id="53:3247" data-name="item-04">
                <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} data-node-id="53:3248" data-name="number">
                  <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[32px] not-italic relative shrink-0 text-[28px] text-[color:var(--gentileschi-navy,#102a52)] text-center w-[48px]")} data-node-id="I53:3248;30:232">
                    04
                  </p>
                </div>
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[40px] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-10-ink,#102a52)] w-[824px]")} data-node-id="53:3249">
                  SPAZIO ALLE IDEE DELLE CLASSI
                </p>
              </div>
              <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-24,24px)] items-center pl-[var(--gentileschi-space-16,16px)] pr-[var(--gentileschi-space-24,24px)] py-[16px] relative shrink-0 w-[952px]")} data-node-id="53:3250" data-name="item-05">
                <GentileschiBadgeNumerato style={figmaStyle("bg-[var(--gentileschi-brand,#2e80ff)] content-stretch flex items-center justify-center relative rounded-[32px] shrink-0 size-[64px]")} number="05" />
                <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[824px]")} data-node-id="53:3252">
                  Varie ed eventuali.
                </p>
              </div>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start justify-between min-h-px overflow-clip relative w-full")} data-node-id="53:3253" data-name="Richiamo e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[352px]")} data-node-id="53:3254" data-name="Richiamo / area protetta">
                <div style={figmaStyle("bg-[var(--gentileschi-logo-surface,white)] content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[24px] relative shrink-0 w-[336px]")} data-node-id="53:3255" data-name="Richiamo / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] h-[8px] relative shrink-0 w-[288px]")} data-node-id="53:3256" data-name="Collage / accento richiamo" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--gentileschi-ink,#102a52)] w-[288px]")} data-node-id="53:3257">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARLIAMONE</p>
                    <p style={figmaStyle("leading-[40px]")}>INSIEME.</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[600px]")} data-node-id="53:3258" data-name="image">
                <img alt="" style={figmaStyle("absolute inset-0 max-w-none object-contain pointer-events-none size-full")} src={imgImage} />
              </div>
            </div>
          </div>
        </div>
        <div style={figmaStyle("bg-[var(--assemblea-10-bg,#2e80ff)] h-[1350px] overflow-clip relative shrink-0 w-[1080px]")} data-node-id="53:3259" data-name="assemblea-10/notice">
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[784px] left-[904px] top-[296px] w-[176px]")} data-node-id="53:3260" data-name="Collage / blocco laterale" />
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-secondary,#102a52)] h-[238px] left-0 top-[1112px] w-[1080px]")} data-node-id="53:3261" data-name="Collage / blocco inferiore" />
          <div style={figmaStyle("absolute left-[904px] size-[104px] top-[1136px]")} data-node-id="53:3262" data-name="Collage / sticker">
            <img alt="" style={figmaStyle("absolute block inset-0 max-w-none size-full")} src={imgCollageSticker} />
          </div>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-accent,#dfff2f)] h-[12px] left-[880px] top-[192px] w-[136px]")} data-node-id="53:3263" data-name="Collage / filetti" />
          <div style={figmaStyle("absolute h-[73.53px] left-[64px] top-[56px] w-[120px]")} data-node-id="53:3264" data-name="logo">
            <div style={figmaStyle("absolute inset-[17.18%_10.53%]")} data-node-id="I53:3264;53:3684" data-name="Pittogramma">
              <div style={figmaStyle("absolute inset-[0_-0.29%_-0.57%_0]")}>
                <img alt="" style={figmaStyle("block max-w-none size-full")} src={imgPittogramma} />
              </div>
            </div>
          </div>
          <div style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[72px] w-[284px]")} data-node-id="53:3265">
            <p style={figmaStyle("leading-[32px] mb-0")}>ASSEMBLEA</p>
            <p style={figmaStyle("leading-[32px]")}>D’ISTITUTO</p>
          </div>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[32px] left-[732px] not-italic text-[24px] text-[color:var(--assemblea-10-text,white)] top-[144px] w-[140px]")} data-node-id="53:3266">
            03 / 03
          </p>
          <p style={figmaStyle("[word-break:break-word] absolute font-['Inter:Black'] font-black leading-[100px] left-[64px] not-italic text-[96px] text-[color:var(--assemblea-10-text,white)] top-[224px] w-[952px]")} data-node-id="53:3267">
            IMPORTANTE!
          </p>
          <div style={figmaStyle("absolute bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex gap-[var(--gentileschi-space-32,32px)] h-[176px] items-center left-[64px] px-[32px] py-[24px] top-[376px] w-[952px]")} data-node-id="53:3268" data-name="Avviso / cartiglio">
            <p style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[72px] not-italic relative shrink-0 text-[64px] text-[color:var(--assemblea-10-ink,#102a52)] w-[240px]")} data-node-id="53:3269">
              TUTTI
            </p>
            <div style={figmaStyle("[word-break:break-word] font-['Inter:Bold'] font-bold leading-[0] not-italic relative shrink-0 text-[32px] text-[color:var(--assemblea-10-ink,#102a52)] w-[388px]")} data-node-id="53:3270">
              <p style={figmaStyle("leading-[40px] mb-0")}>GLI STUDENTI</p>
              <p style={figmaStyle("leading-[40px]")}>SONO INVITATI</p>
            </div>
            <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] h-[72px] relative shrink-0 w-[184px]")} data-node-id="53:3271" data-name="Badge / etichetta">
              <div style={figmaStyle("-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Bold'] font-bold leading-[0] left-[92px] not-italic text-[24px] text-[color:var(--gentileschi-navy,#102a52)] text-center top-[4px] w-[160px]")} data-node-id="53:3272">
                <p style={figmaStyle("leading-[32px] mb-0")}>LA TUA</p>
                <p style={figmaStyle("leading-[32px]")}>VOCE</p>
              </div>
            </div>
          </div>
          <div style={figmaStyle("absolute content-stretch flex flex-col gap-[24px] h-[750px] items-end left-[64px] overflow-clip top-[600px] w-[952px]")} data-node-id="53:3273" data-name="Contenuto adattivo / notice">
            <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[var(--gentileschi-space-24,24px)] items-start px-[var(--gentileschi-space-32,32px)] py-[32px] relative shrink-0 w-[952px]")} data-node-id="53:3274" data-name="Paragrafi / cartiglio">
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[888px]")} data-node-id="53:3275">
                L’assemblea è il momento per condividere proposte, discutere le esigenze delle classi e costruire insieme le prossime attività.
              </p>
              <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] h-[8px] relative shrink-0 w-[888px]")} data-node-id="53:3276" data-name="Collage / separatore" />
              <p style={figmaStyle("[word-break:break-word] font-['Inter:Regular'] font-normal leading-[40px] not-italic relative shrink-0 text-[30px] text-[color:var(--assemblea-10-ink,#102a52)] w-[888px]")} data-node-id="53:3277">
                Porta le tue idee e confrontati con i rappresentanti. La partecipazione di ciascuno rende la scuola più aperta e vicina agli studenti.
              </p>
            </div>
            <div style={figmaStyle("content-stretch flex flex-[1_0_0] items-start min-h-px overflow-clip relative w-full")} data-node-id="53:3278" data-name="CTA e fotografia">
              <div style={figmaStyle("content-stretch flex flex-col h-full items-start justify-end overflow-clip pb-[64px] relative shrink-0 w-[432px]")} data-node-id="53:3279" data-name="CTA / area protetta">
                <div style={figmaStyle("bg-[var(--assemblea-10-surface,white)] content-stretch drop-shadow-[8px_12px_0px_rgba(10,26,56,0.2)] flex flex-col gap-[12px] items-start p-[24px] relative shrink-0 w-[432px]")} data-node-id="53:3280" data-name="CTA / cartiglio">
                  <div style={figmaStyle("bg-[var(--assemblea-10-accent,#dfff2f)] h-[8px] relative shrink-0 w-[384px]")} data-node-id="53:3281" data-name="Collage / accento CTA" />
                  <div style={figmaStyle("[word-break:break-word] font-['Inter:Black'] font-black leading-[0] not-italic relative shrink-0 text-[36px] text-[color:var(--assemblea-10-ink,#102a52)] w-[384px]")} data-node-id="53:3282">
                    <p style={figmaStyle("leading-[40px] mb-0")}>PARTECIPARE FA</p>
                    <p style={figmaStyle("leading-[40px]")}>LA DIFFERENZA</p>
                  </div>
                </div>
              </div>
              <div style={figmaStyle("h-full relative shrink-0 w-[520px]")} data-node-id="53:3283" data-name="image">
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
