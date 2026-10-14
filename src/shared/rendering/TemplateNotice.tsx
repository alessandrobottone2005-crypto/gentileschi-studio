import React from "react";
import { NoticeSlideContent } from "../types/template";
import { calculateAdaptiveFontSize } from "../composition/adaptiveLayout";
import StarBurstLime3 from "../../assets/figma/vectors/star-burst-lime-3.svg";
import StarBurstBlue3 from "../../assets/figma/vectors/star-burst-blue-3.svg";
import DrawnCircle3 from "../../assets/figma/vectors/drawn-circle-3.svg";
import StarLime3 from "../../assets/figma/vectors/star-lime-3.svg";
import DrawnArrow3 from "../../assets/figma/vectors/drawn-arrow-3.svg";
import DefaultStudents from "../../assets/figma/students-group.png";

interface TemplateNoticeProps {
  content: NoticeSlideContent;
}

export const TemplateNotice: React.FC<TemplateNoticeProps> = ({ content }) => {
  const imageUrl = content.image?.url || DefaultStudents;
  const imageScale = content.image?.scale ?? 1;
  const imagePosX = content.image?.posX ?? 0;
  const imagePosY = content.image?.posY ?? 0;

  const p1Size = calculateAdaptiveFontSize(content.paragraph1, 29, 21, 140);
  const p2Size = calculateAdaptiveFontSize(content.paragraph2, 27, 20, 140);

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        backgroundColor: "#f4f0e6", // Warm White
        position: "relative",
        overflow: "hidden",
        color: "#10143d",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Texture Noise Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          backgroundImage: `radial-gradient(circle at 50% 50%, #000000 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Top Electric Blue Band */}
      <div
        style={{
          position: "absolute",
          width: 1080,
          height: 382,
          left: 0,
          top: 0,
          backgroundColor: "#1728e8",
          zIndex: 2,
        }}
      />

      {/* Diagonal Dark Band */}
      <div
        style={{
          position: "absolute",
          width: 1270,
          height: 285,
          left: -95,
          top: 294,
          backgroundColor: "#10108c",
          transform: "rotate(5deg)",
          zIndex: 2,
        }}
      />

      {/* Vector Decorators */}
      {/* Star Lime Top Right */}
      <img
        src={StarLime3}
        alt=""
        style={{
          position: "absolute",
          width: 104,
          height: 104,
          right: 59,
          top: 62,
          transform: "rotate(8deg)",
          zIndex: 3,
        }}
      />

      {/* Lime Starburst Right */}
      <img
        src={StarBurstLime3}
        alt=""
        style={{
          position: "absolute",
          width: 250,
          height: 250,
          right: -42,
          top: 240,
          zIndex: 3,
        }}
      />

      {/* Blue Starburst Bottom Left */}
      <img
        src={StarBurstBlue3}
        alt=""
        style={{
          position: "absolute",
          width: 263,
          height: 263,
          left: -116,
          bottom: -3,
          transform: "rotate(9deg)",
          zIndex: 3,
        }}
      />

      {/* Drawn Circle Right */}
      <img
        src={DrawnCircle3}
        alt=""
        style={{
          position: "absolute",
          width: 286,
          height: 286,
          right: 34,
          top: 738,
          transform: "rotate(-9deg)",
          zIndex: 3,
        }}
      />

      {/* Drawn Arrow */}
      <img
        src={DrawnArrow3}
        alt=""
        style={{
          position: "absolute",
          width: 178,
          height: 127,
          right: 120,
          top: 700,
          transform: "rotate(4deg)",
          zIndex: 15,
        }}
      />

      {/* Title Header */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 130,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: "94px",
            lineHeight: 1,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
          data-content-field="title"
        >
          {content.title}
        </h1>
      </div>

      {/* Rule Card ("Regola" - Rotated -1deg with hard shadow) */}
      <div
        style={{
          position: "absolute",
          left: 56,
          top: 322,
          width: 968,
          minHeight: 228,
          backgroundColor: "#dfff2f", // Acid Lime
          boxShadow: "12px 16px 0px rgba(8, 13, 92, 0.26)",
          transform: "rotate(-1deg)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 36px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* Big Quantity Number */}
          <span
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: "148px",
              lineHeight: 1,
              color: "#10143d",
            }}
            data-content-field="highlightQuantity"
          >
            {content.highlightQuantity}
          </span>

          {/* Label Text */}
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              fontSize: "39px",
              lineHeight: "41px",
              color: "#10143d",
              whiteSpace: "pre-line",
              textTransform: "uppercase",
            }}
            data-content-field="highlightLabel"
          >
            {content.highlightLabel}
          </span>
        </div>

        {/* Sticker Tag */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "12px 20px",
            transform: "rotate(2deg)",
            boxShadow: "4px 6px 0px rgba(8, 13, 92, 0.15)",
          }}
        >
          <span
            style={{
              fontFamily: "'Comic Neue', cursive",
              fontWeight: 700,
              fontSize: "22px",
              color: "#10143d",
              letterSpacing: "0.04em",
            }}
            data-content-field="badgeText"
          >
            {content.badgeText}
          </span>
        </div>
      </div>

      {/* Message Card ("Messaggio") */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 580,
          width: 765,
          backgroundColor: "#ffffff",
          boxShadow: "12px 16px 0px rgba(8, 13, 92, 0.26)",
          transform: "rotate(0.6deg)",
          padding: "36px 40px",
          boxSizing: "border-box",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: `${p1Size}px`,
            lineHeight: 1.4,
            color: "#10143d",
            margin: 0,
          }}
          data-content-field="paragraph1"
        >
          {content.paragraph1}
        </p>

        {/* Separator Lime Bar */}
        <div
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "#dfff2f",
            transform: "rotate(-0.5deg)",
          }}
        />

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: `${p2Size}px`,
            lineHeight: 1.4,
            color: "#10143d",
            margin: 0,
          }}
          data-content-field="paragraph2"
        >
          {content.paragraph2}
        </p>
      </div>

      {/* CTA Sticker ("PARTECIPARE FA LA DIFFERENZA") */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 1070,
          width: 434,
          backgroundColor: "#dfff2f",
          transform: "rotate(-15deg)",
          padding: "24px 28px",
          boxSizing: "border-box",
          zIndex: 12,
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: "40px",
            lineHeight: "46px",
            color: "#10143d",
            textTransform: "uppercase",
            display: "block",
          }}
          data-content-field="ctaText"
        >
          {content.ctaText}
        </span>
      </div>

      {/* Students Cutout Image Overlapping */}
      <div
        style={{
          position: "absolute",
          width: 765,
          height: 552,
          right: -75,
          bottom: 30,
          zIndex: 11,
          pointerEvents: "none",
        }}
      >
        <img
          data-content-field="image"
          src={imageUrl}
          alt="Students Visual"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom right",
            transform: `translate(${imagePosX}px, ${imagePosY}px) scale(${imageScale})`,
          }}
        />
      </div>

      {/* Registration Marks Bottom Left */}
      <div
        style={{
          position: "absolute",
          left: 44,
          bottom: 40,
          zIndex: 10,
          width: 54,
          height: 54,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 24,
            width: 54,
            height: 6,
            backgroundColor: "#1728e8",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 0,
            width: 6,
            height: 54,
            backgroundColor: "#1728e8",
          }}
        />
      </div>
    </div>
  );
};
