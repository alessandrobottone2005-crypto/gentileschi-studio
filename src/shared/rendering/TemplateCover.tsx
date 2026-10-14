import React from "react";
import { CoverSlideContent } from "../types/template";
import { calculateAdaptiveFontSize } from "../composition/adaptiveLayout";
import StarBurstLime from "../../assets/figma/vectors/star-burst-lime-1.svg";
import StarBurstBlue from "../../assets/figma/vectors/star-burst-blue-1.svg";
import DrawnCircle from "../../assets/figma/vectors/drawn-circle-1.svg";
import StickerLime from "../../assets/figma/vectors/sticker-lime-1.svg";
import DrawnArrow from "../../assets/figma/vectors/drawn-arrow-1.svg";
import DefaultImage from "../../assets/figma/gentileschi-statue.png";

interface TemplateCoverProps {
  content: CoverSlideContent;
}

export const TemplateCover: React.FC<TemplateCoverProps> = ({ content }) => {
  const titleSize = calculateAdaptiveFontSize(content.title, 128, 80, 20);
  const imageUrl = content.image?.url || DefaultImage;
  const imageScale = content.image?.scale ?? 1;
  const imagePosX = content.image?.posX ?? 0;
  const imagePosY = content.image?.posY ?? 0;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        backgroundColor: "#1728e8", // Electric Blue
        position: "relative",
        overflow: "hidden",
        color: "#ffffff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Texture Noise Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          backgroundImage: `radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Decorative Diagonal Dark Stripe */}
      <div
        style={{
          position: "absolute",
          width: 1350,
          height: 472,
          left: -180,
          top: 620,
          backgroundColor: "#10108c", // Deep Royal Blue
          transform: "rotate(-8deg)",
          zIndex: 2,
        }}
      />

      {/* Vector Decorators */}
      {/* 1. Lime Starburst Top Right */}
      <img
        src={StarBurstLime}
        alt=""
        style={{
          position: "absolute",
          width: 316,
          height: 316,
          right: -55,
          top: -80,
          transform: "rotate(8deg)",
          zIndex: 3,
        }}
      />

      {/* 2. Blue Starburst Left */}
      <img
        src={StarBurstBlue}
        alt=""
        style={{
          position: "absolute",
          width: 265,
          height: 265,
          left: -96,
          top: 443,
          transform: "rotate(-12deg)",
          zIndex: 3,
        }}
      />

      {/* 3. Hand-drawn Circle Behind Statue */}
      <img
        src={DrawnCircle}
        alt=""
        style={{
          position: "absolute",
          width: 429,
          height: 429,
          right: 40,
          top: 195,
          transform: "rotate(-8deg)",
          zIndex: 3,
        }}
      />

      {/* 4. Cutout Image (Statue / Custom Photo) */}
      <div
        style={{
          position: "absolute",
          width: 982,
          height: 1328,
          right: -67,
          bottom: -78,
          zIndex: 4,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <img
          data-content-field="image"
          src={imageUrl}
          alt="Gentileschi Cover Visual"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom right",
            transform: `translate(${imagePosX}px, ${imagePosY}px) scale(${imageScale})`,
            transformOrigin: "bottom right",
          }}
        />
      </div>

      {/* 5. Title Paper Card (Rotated -1.2 deg with hard shadow) */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 54,
          width: 964,
          backgroundColor: "#f4f0e6", // Warm White
          padding: "24px 36px",
          boxShadow: "12px 16px 0px rgba(8, 13, 92, 0.26)",
          transform: "rotate(-1.2deg)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: `${titleSize}px`,
            lineHeight: 0.88,
            color: "#10143d", // Dark Navy
            textTransform: "uppercase",
            whiteSpace: "pre-line",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
          data-content-field="title"
        >
          {content.title}
        </h1>
      </div>

      {/* 6. Day Giant Number */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 360,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: "400px",
            lineHeight: "304px",
            color: "#dfff2f", // Acid Lime
            letterSpacing: "-18px",
            display: "block",
          }}
          data-content-field="day"
        >
          {content.day}
        </span>
      </div>

      {/* 7. Drawn Arrow */}
      <img
        src={DrawnArrow}
        alt=""
        style={{
          position: "absolute",
          width: 162,
          height: 116,
          right: 90,
          top: 696,
          transform: "rotate(8deg)",
          zIndex: 10,
        }}
      />

      {/* 8. Month & Time Box */}
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 840,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Month text */}
        <div style={{ position: "relative" }}>
          <span
            style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: "70px",
              lineHeight: "62px",
              color: "#ffffff",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              display: "inline-block",
            }}
            data-content-field="month"
          >
            {content.month}
          </span>
          {/* Underline */}
          <div
            style={{
              width: 176,
              height: 18,
              backgroundColor: "#dfff2f",
              marginTop: 6,
              transform: "rotate(-2deg)",
            }}
          />
        </div>

        {/* Time Slot */}
        <p
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontWeight: 700,
            fontSize: "30px",
            lineHeight: "39px",
            color: "#ffffff",
            whiteSpace: "pre-line",
            marginTop: 10,
          }}
          data-content-field="timeSlot"
        >
          {content.timeSlot}
        </p>
      </div>

      {/* 9. Bottom Sticker (Adesivo lime con asterisco) */}
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 86,
          width: 170,
          height: 170,
          transform: "rotate(14deg)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={StickerLime}
          alt=""
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />
        <span
          style={{
            position: "relative",
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: "72px",
            color: "#10143d",
            lineHeight: 1,
            zIndex: 2,
          }}
        >
          *
        </span>
      </div>

      {/* 10. Registration Marks (Crosshairs at bottom) */}
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
            backgroundColor: "#dfff2f",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 0,
            width: 6,
            height: 54,
            backgroundColor: "#dfff2f",
          }}
        />
      </div>
    </div>
  );
};
