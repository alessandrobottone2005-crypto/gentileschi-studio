import React from 'react';

interface TemplateWrapperProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const TemplateWrapper = React.forwardRef<HTMLDivElement, TemplateWrapperProps>(
  ({ children, scale = 1, className = '', style = {} }, ref) => {
    return (
      <div
        style={{
          width: 1080 * scale,
          height: 1350 * scale,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          ...style,
        }}
        className={className}
      >
        <div
          ref={ref}
          style={{
            width: 1080,
            height: 1350,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
          data-template-frame="true"
        >
          {children}
        </div>
      </div>
    );
  }
);
