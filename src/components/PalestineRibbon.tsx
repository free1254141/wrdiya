'use client';

import React, { useState } from 'react';

interface PalestineRibbonProps {
  className?: string;
  onClick?: () => void;
}

export const PalestineRibbon: React.FC<PalestineRibbonProps> = ({ className = '', onClick }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`fixed top-0 left-4 sm:left-6 z-30 select-none cursor-pointer transition-transform duration-300 hover:scale-105 hover:-rotate-1 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
      title="فلسطين في القلب دائماً وأبداً 🍉🇵🇸"
    >
      {/* Tooltip Popup */}
      {showTooltip && (
        <div className="absolute top-28 left-10 z-50 whitespace-nowrap rounded-xl border border-red-500/30 bg-black/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-1.5">
            <span>🍉</span>
            <span>فلسطين في القلب دائماً وأبداً</span>
            <span>🇵🇸</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-normal">
            Skanybot يقف مع فلسطين والعدالة الإنسانية
          </div>
        </div>
      )}

      {/* SVG Hanging Ribbon + Watermelon Emblem (Identical to egxbots design) */}
      <svg
        width="44"
        height="260"
        viewBox="0 0 44 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.55)]"
      >
        <defs>
          {/* Subtle gradient on ribbon stripes for fabric depth */}
          <linearGradient id="palGreen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          <linearGradient id="palWhite" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id="palBlack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#18181b" />
            <stop offset="100%" stopColor="#09090b" />
          </linearGradient>
          <linearGradient id="palRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          {/* Watermelon Rind Gradient */}
          <linearGradient id="melonRind" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Watermelon Flesh Gradient */}
          <radialGradient id="melonPulp" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="45%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </radialGradient>
        </defs>

        {/* --- Ribbon Body (Width 36, X: 4 to 40, Height 220) --- */}
        {/* Left Stripe: Green */}
        <rect x="4" y="0" width="12" height="225" fill="url(#palGreen)" />

        {/* Middle Stripe: White */}
        <rect x="16" y="0" width="12" height="225" fill="url(#palWhite)" />

        {/* Right Stripe: Black */}
        <rect x="28" y="0" width="12" height="225" fill="url(#palBlack)" />

        {/* Top Palestine Red Triangle Chevron */}
        <polygon points="4,0 40,0 22,28" fill="url(#palRed)" />

        {/* Fringe Tassels at bottom (شراريب القماش البيضاء المهدبة) */}
        <g stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" opacity="0.95">
          <line x1="6" y1="225" x2="6" y2="242" />
          <line x1="9" y1="225" x2="9" y2="246" />
          <line x1="12" y1="225" x2="12" y2="249" />
          <line x1="15" y1="225" x2="15" y2="251" />
          <line x1="18" y1="225" x2="18" y2="253" />
          <line x1="21" y1="225" x2="21" y2="254" />
          <line x1="24" y1="225" x2="24" y2="253" />
          <line x1="27" y1="225" x2="27" y2="251" />
          <line x1="30" y1="225" x2="30" y2="249" />
          <line x1="33" y1="225" x2="33" y2="246" />
          <line x1="36" y1="225" x2="36" y2="244" />
          <line x1="38" y1="225" x2="38" y2="240" />
        </g>
        {/* Horizontal hem line above tassels */}
        <line x1="4" y1="225" x2="40" y2="225" stroke="#cbd5e1" strokeWidth="1.2" />

        {/* --- Pinned Watermelon Badge (Tilted juicy slice at Y: 135) --- */}
        <g transform="translate(14, 138) rotate(-22 18 18) scale(0.95)" className="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]">
          {/* Dark Green Striped Rind */}
          <path
            d="M-8 10 C6 56 46 56 60 10 Z"
            fill="url(#melonRind)"
            stroke="#0f3e1f"
            strokeWidth="1.5"
          />
          {/* Light Rind inner boundary */}
          <path
            d="M-4 13 C8 50 44 50 56 13 Z"
            fill="#dcfce7"
          />
          {/* Red Pulp */}
          <path
            d="M0 16 C11 44 41 44 52 16 Z"
            fill="url(#melonPulp)"
          />
          {/* Seeds */}
          <ellipse cx="15" cy="27" rx="1.6" ry="2.8" fill="#09090b" transform="rotate(-15 15 27)" />
          <ellipse cx="26" cy="33" rx="1.6" ry="2.8" fill="#09090b" />
          <ellipse cx="37" cy="27" rx="1.6" ry="2.8" fill="#09090b" transform="rotate(15 37 27)" />
          <ellipse cx="26" cy="22" rx="1.4" ry="2.4" fill="#09090b" />

          {/* Cute highlight shine on fruit */}
          <path
            d="M8 20 C14 26 22 28 26 28"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </svg>
    </div>
  );
};

export default PalestineRibbon;
