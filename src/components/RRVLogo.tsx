/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface RRVLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'screen';
  showText?: boolean;
  animated?: boolean;
  lightMode?: boolean;
  subtitle?: string;
  onAnimationComplete?: () => void;
}

export const RRVLogo: React.FC<RRVLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  animated = false,
  lightMode = false,
  subtitle = 'A DIVISION OF RRV TRADING LLC',
  onAnimationComplete
}) => {
  // Sizing definitions
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-60 h-60',
    '2xl': 'w-76 h-76',
    'screen': 'w-full max-w-[420px] aspect-square'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  const fadeVariants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const strokeColor = lightMode ? '#1A1A1A' : '#FFFFFF';

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* 3D Metallic Silver RRV Monogram Vector */}
      <div className={`relative ${currentSizeClass} flex items-center justify-center`}>
        <motion.svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={animated ? "hidden" : "visible"}
          animate="visible"
          variants={animated ? fadeVariants : undefined}
          onAnimationComplete={onAnimationComplete}
          className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
        >
          <defs>
            {/* Metallic Silver Main Gradient */}
            <linearGradient id="rrvSilverBody" x1="120" y1="100" x2="380" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="15%" stopColor="#DDE3EA" />
              <stop offset="32%" stopColor="#B2BAC6" />
              <stop offset="48%" stopColor="#F6F8FA" />
              <stop offset="65%" stopColor="#8C96A5" />
              <stop offset="82%" stopColor="#E0E5EC" />
              <stop offset="100%" stopColor="#7B8594" />
            </linearGradient>

            {/* Top Bar Specular Highlight */}
            <linearGradient id="rrvHighlight" x1="140" y1="100" x2="320" y2="240" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#C4CCD8" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#94A0B0" stopOpacity="0.4" />
            </linearGradient>

            {/* 3D Chamfer Edge Stroke Gradient */}
            <linearGradient id="rrvEdge" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#6E7887" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#454D59" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E2E7ED" stopOpacity="0.95" />
            </linearGradient>

            {/* Inner Dark Depth Drop Shadow */}
            <filter id="rrvDepthShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="5" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* Background Ambient Glow (Luxury metallic aura) */}
          <circle
            cx="250"
            cy="250"
            r="210"
            fill="none"
            stroke="url(#rrvSilverBody)"
            strokeWidth="0.5"
            strokeOpacity="0.12"
            strokeDasharray="4 6"
          />
          <circle
            cx="250"
            cy="250"
            r="230"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="0.3"
            strokeOpacity="0.08"
          />

          {/* MAIN RRV METALLIC MONOGRAM SHAPES */}
          <g filter="url(#rrvDepthShadow)" className="origin-center">
            {/* 1. TOP UPPER RIBBON OF 'R' */}
            <path
              d="M 152 112 
                 H 272 
                 C 318 112, 350 142, 350 184 
                 C 350 226, 318 256, 272 256 
                 H 152 
                 C 146 256, 142 252, 142 246 
                 V 230 
                 C 142 224, 146 220, 152 220 
                 H 264 
                 C 290 220, 312 205, 312 184 
                 C 312 163, 290 148, 264 148 
                 H 152 
                 C 146 148, 142 144, 142 138 
                 V 120 
                 C 142 114, 146 112, 152 112 Z"
              fill="url(#rrvSilverBody)"
              stroke="url(#rrvEdge)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Specular Glint on Top Curve */}
            <path
              d="M 154 116 H 270 C 314 116, 344 144, 344 184 C 344 206, 332 226, 312 238"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.65"
              fill="none"
              strokeLinecap="round"
            />

            {/* 2. MIDDLE SLICED HORIZONTAL ACCENT OF 'R' */}
            <path
              d="M 152 168 
                 H 258 
                 C 268 168, 274 174, 274 184 
                 C 274 194, 268 200, 258 200 
                 H 152 
                 C 146 200, 142 196, 142 190 
                 V 178 
                 C 142 172, 146 168, 152 168 Z"
              fill="url(#rrvSilverBody)"
              stroke="url(#rrvEdge)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* 3. LOWER-LEFT ANGLED DIAGONAL LEG OF 'R' */}
            <path
              d="M 152 278 
                 H 206 
                 L 278 388 
                 C 282 394, 280 402, 272 406 
                 L 254 414 
                 C 246 418, 238 414, 234 406 
                 L 142 292 
                 C 138 286, 142 278, 152 278 Z"
              fill="url(#rrvSilverBody)"
              stroke="url(#rrvEdge)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Highlight line on left leg */}
            <line
              x1="202"
              y1="282"
              x2="268"
              y2="390"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeOpacity="0.5"
              strokeLinecap="round"
            />

            {/* 4. LOWER-RIGHT 'V' SHARP EXTENSION WEDGE (Connecting R and V) */}
            <path
              d="M 218 278 
                 H 268 
                 L 332 374 
                 L 404 262 
                 C 408 256, 416 254, 422 258 
                 L 434 266 
                 C 440 270, 442 278, 436 286 
                 L 348 416 
                 C 342 424, 330 424, 324 416 
                 L 226 294 
                 C 220 286, 222 278, 218 278 Z"
              fill="url(#rrvSilverBody)"
              stroke="url(#rrvEdge)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Specular Light Sweep on Right V Wing */}
            <line
              x1="334"
              y1="384"
              x2="416"
              y2="268"
              stroke="#FFFFFF"
              strokeWidth="1.8"
              strokeOpacity="0.75"
              strokeLinecap="round"
            />

            {/* Precision Micro-Bevel Light Inset */}
            <path
              d="M 270 120 C 310 120, 338 146, 338 184"
              stroke="#FFFFFF"
              strokeWidth="1.2"
              strokeOpacity="0.8"
              fill="none"
            />
          </g>
        </motion.svg>
      </div>

      {/* Brand Text Block */}
      {showText && (
        <div className="mt-7 space-y-2.5">
          <h2 
            className={`font-serif tracking-[0.22em] font-bold leading-none uppercase ${
              size === 'sm' || size === 'xs' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-3xl'
            } ${lightMode ? 'text-black' : 'text-white'}`}
            style={{ fontFamily: "'Cinzel', 'Playfair Display', 'Didot', serif" }}
          >
            RRV <span className="text-[#C5A059] font-normal">PERFUME</span>
          </h2>
          <p className="text-[9px] md:text-[10px] font-sans tracking-[0.4em] uppercase font-bold text-gray-400">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
};
