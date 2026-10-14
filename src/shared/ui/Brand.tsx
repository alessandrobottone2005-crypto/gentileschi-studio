import React from 'react';

/** School artwork from Figma; UI variants change only navy to black. */
export function Brand({ variant = 'standard', className = '' }: {
  variant?: 'standard' | 'compact' | 'school';
  className?: string;
}) {
  return (
    <span className={`brand brand-${variant} ${className}`} role="img" aria-label="Gentileschi Studio">
      <img
        className="brand-artwork"
        src={variant === 'school' ? '/brand/school-wordmark.svg' : '/brand/school-symbol.svg'}
        alt=""
        aria-hidden="true"
      />
      <span className="brand-name">
        {variant !== 'school' && <strong>Gentileschi</strong>}
        <span>Studio</span>
      </span>
    </span>
  );
}
