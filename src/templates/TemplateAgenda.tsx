import React from "react";
import { AgendaSlideContent } from "../types/template";
import StarBurstLime2 from "../assets/figma/vectors/star-burst-lime-2.svg";
import StarBurstBlue2 from "../assets/figma/vectors/star-burst-blue-2.svg";
import RingDrawn2 from "../assets/figma/vectors/ring-drawn-2.svg";
import DrawnArrow2 from "../assets/figma/vectors/drawn-arrow-2.svg";
import DefaultAirplane from "../assets/figma/airplane-trip.png";

interface TemplateAgendaProps {
  content: AgendaSlideContent;
}

const ROTATIONS = [-0.8, 0.8, -0.4, 0.9, -0.7, 0.6];

export const TemplateAgenda: React.FC<TemplateAgendaProps> = ({ content }) => {
  const imageUrl = content.image?.url || DefaultAirplane;
  const imageScale = content.image?.scale ?? 1;
  const imagePosX = content.image?.posX ?? 0;
  const imagePosY = content.image?.posY ?? 0;

  return (
    <div
      style={{
        width: 1080,
        height: 1350,
        backgroundColor: "#10108c", // Deep Royal Blue
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

      {/* Decorative Electric Blue Field */}
      <div
        style={{
          position: "absolute",
          width: 814,
          height: 1429,
          left: 348,
          top: 0,
          backgroundColor: "#1728e8",
          transform: "rotate(9deg)",
          zIndex: 2,
        }}
      />

      {/* Decorative Stripe */}
      <div
        style={{
          position: "absolute",
          width: 1288,
          height: 261,
          left: -90,
          top: 230,
          backgroundColor: "#304bff",
          transform: "rotate(-5deg)",
          zIndex: 2,
        }}
      />

      {/* Vector Decorators */}
      {/* Top Left Lime Starburst */}
      <img
        src={StarBurstLime2}
        alt=""
        style={{
          position: "absolute",
          width: 246,
          height: 246,
          left: -64,
          top: -80,
          zIndex: 3,
        }}
      />

      {/* Bottom Right Blue Starburst */}
      <img
        src={StarBurstBlue2}
        alt=""
        style={{
          position: "absolute",
          width: 261,
          height: 261,
          right: -41,
          bottom: -37,
          transform: "rotate(12deg)",
          zIndex: 3,
        }}
      />

      {/* Drawn Ring */}
      <img
        src={RingDrawn2}
        alt=""
        style={{
          position: "absolute",
          width: 205,
          height: 205,
          right: 91,
          top: 170,
          transform: "rotate(7deg)",
          zIndex: 3,
        }}
      />

      {/* Drawn Arrow */}
      <img
        src={DrawnArrow2}
        alt=""
        style={{
          position: "absolute",
          width: 178,
          height: 137,
          right: 92,
          top: 577,
          transform: "rotate(-12deg)",
          zIndex: 15,
        }}
      />

      {/* Header Container */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 54,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontFamily: "'Archivo Black', sans-serif",
            fontSize: "162px",
            lineHeight: "133px",
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
          data-content-field="title"
        >
          {content.title}
        </h1>

        {/* Subtitle / Expansion Tag */}
        <div
          style={{
            display: "inline-block",
            backgroundColor: "#dfff2f", // Acid Lime
            padding: "10px 18px",
            marginTop: 4,
            transform: "rotate(-1.5deg)",
          }}
        >
          <span
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontWeight: 700,
              fontSize: "19px",
              color: "#10143d",
              letterSpacing: "0.04em",
            }}
            data-content-field="subtitle"
          >
            {content.subtitle}
          </span>
        </div>
      </div>

      {/* Agenda Items List */}
      <div
        style={{
          position: "absolute",
          left: 58,
          top: 342,
          width: 801,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {content.items.map((item, index) => {
          const rotation = ROTATIONS[index % ROTATIONS.length];
          const isHigh = item.isHighlight;

          return (
            <div
              key={item.id || index}
              data-agenda-item={item.id}
              data-agenda-role="row"
              style={{
                width: 801,
                minHeight: 120,
                backgroundColor: isHigh ? "#dfff2f" : "#f4f0e6",
                boxShadow: "12px 16px 0px rgba(8, 13, 92, 0.26)",
                transform: `rotate(${rotation}deg)`,
                display: "flex",
                alignItems: "center",
                padding: "18px 24px",
                gap: 20,
                boxSizing: "border-box",
              }}
            >
              {/* Number Square Badge */}
              <div
                data-agenda-id={item.id}
                data-agenda-role="badge"
                style={{
                  width: 73,
                  height: 73,
                  flexShrink: 0,
                  backgroundColor: isHigh ? "#10143d" : "#1728e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontWeight: 700,
                    fontSize: "25px",
                    color: "#ffffff",
                  }}
                  data-agenda-id={item.id}
                  data-content-field="number"
                  data-agenda-role="number"
                >
                  {item.number.padStart(2, "0")}
                </span>
              </div>

              {/* Text Description */}
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: isHigh
                      ? "'Archivo Black', sans-serif"
                      : "'Inter', sans-serif",
                    fontSize: isHigh ? "38px" : "27px",
                    lineHeight: 1.25,
                    color: "#10143d",
                    fontWeight: isHigh ? 400 : 500,
                    textTransform: isHigh ? "uppercase" : "none",
                    display: "block",
                  }}
                  data-agenda-id={item.id}
                  data-content-field="text"
                  data-agenda-role="text"
                >
                  {item.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Airplane Cutout Image (Photographic visual overlapping at bottom right) */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 960,
          right: -250,
          bottom: -150,
          transform: "rotate(3deg)",
          zIndex: 8,
          pointerEvents: "none",
          overflow: "hidden",
          filter: "drop-shadow(12px 16px 0px rgba(8, 13, 92, 0.30))",
        }}
      >
        <img
          data-content-field="image"
          src={imageUrl}
          alt="Agenda Visual Decor"
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
