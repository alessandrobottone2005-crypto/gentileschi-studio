import React from "react";

interface TemplateWrapperProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
}

export const TemplateWrapper = React.forwardRef<
  HTMLDivElement,
  TemplateWrapperProps
>(
  (
    {
      children,
      scale = 1,
      className = "",
      style = {},
      width = 1080,
      height = 1350,
    },
    ref,
  ) => {
    return (
      <div
        style={{
          width: width * scale,
          height: height * scale,
          overflow: "hidden",
          position: "relative",
          flexShrink: 0,
          ...style,
        }}
        className={className}
      >
        <div
          ref={ref}
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
          data-template-frame="true"
        >
          {children}
        </div>
      </div>
    );
  },
);
