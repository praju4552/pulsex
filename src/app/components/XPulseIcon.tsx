import React from 'react';

interface XPulseIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const XPulseIcon: React.FC<XPulseIconProps> = ({ className = "w-8 h-8", style }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="20%" stopColor="#e2e8f0" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.6" />
          <stop offset="80%" stopColor="#cbd5e1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>
        
        <filter id="glass-blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
        </filter>
      </defs>

      <g transform="translate(50, 50)">
        {/* Long Line (Backslash) */}
        <g fill="url(#glass-gradient)">
          {/* Top-Left */}
          <path d="M -45 -45 Q -10 -35 0 0 Q -35 -10 -45 -45 Z" />
          {/* Bottom-Right */}
          <path transform="rotate(180)" d="M -45 -45 Q -10 -35 0 0 Q -35 -10 -45 -45 Z" />
        </g>

        {/* Short Line (Forward-slash) - Matched to visual height of text */}
        <g fill="url(#glass-gradient)">
          {/* Top-Right */}
          <path transform="rotate(90)" d="M -28 -28 Q -8 -25 0 0 Q -25 -8 -28 -28 Z" />
          {/* Bottom-Left */}
          <path transform="rotate(270)" d="M -28 -28 Q -8 -25 0 0 Q -25 -8 -28 -28 Z" />
        </g>

        {/* Highlight Reflection on the long stroke */}
        <path 
          d="M -40 -40 Q -10 -35 -5 -5 L -2 -2 Q -35 -10 -40 -40 Z" 
          fill="white" 
          opacity="0.25" 
          filter="url(#glass-blur)" 
        />
      </g>
    </svg>
  );
};

/**
 * Inline PULSE branding component: renders the "PULSE" text followed by the silver X icon.
 * Use this wherever you need to display the brand identity.
 */
export const XPulseLogo: React.FC<{
  iconClassName?: string;
  textClassName?: string;
  className?: string;
}> = ({
  iconClassName = "w-5 h-5",
  textClassName = "text-sm font-black tracking-tighter uppercase text-text-primary",
  className = "inline-flex items-center gap-2"
}) => {
  return (
    <span className={className}>
      <span className={textClassName}>PULSE</span>
      <XPulseIcon className={iconClassName} />
    </span>
  );
};
