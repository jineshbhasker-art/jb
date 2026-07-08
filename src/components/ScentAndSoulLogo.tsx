/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ScentAndSoulLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'screen';
  showText?: boolean;
  animated?: boolean;
  lightMode?: boolean;
  onAnimationComplete?: () => void;
}

export const ScentAndSoulLogo: React.FC<ScentAndSoulLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  animated = false,
  lightMode = false,
  onAnimationComplete
}) => {
  // Map sizing
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64',
    '2xl': 'w-80 h-80',
    'screen': 'w-full max-w-[450px] aspect-square'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Path drawing motion variants
  const drawPath = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: custom * 0.2, type: "spring", duration: 1.5, bounce: 0 },
        opacity: { delay: custom * 0.2, duration: 0.5 }
      }
    })
  };

  const fadeElement = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (custom: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: custom * 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }
    })
  };

  const activeVariants = animated ? "visible" : "visible";

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* 1. Vector Emblem container */}
      <div className={`relative ${currentSizeClass} flex items-center justify-center`}>
        <svg
          viewBox="0 0 500 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="scentCopper" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E66C23" />
              <stop offset="40%" stopColor="#C25916" />
              <stop offset="100%" stopColor="#873503" />
            </linearGradient>

            <linearGradient id="scentGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D996" />
              <stop offset="50%" stopColor="#C5A059" />
              <stop offset="100%" stopColor="#947434" />
            </linearGradient>

            <linearGradient id="scentTeal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ACC2A3" />
              <stop offset="50%" stopColor="#7E9675" />
              <stop offset="100%" stopColor="#4D6345" />
            </linearGradient>

            {/* Subtle background tile pattern for cream insert */}
            <pattern id="creamTile" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#E1DCD3" strokeWidth="0.5" />
              <circle cx="20" cy="20" r="1.5" fill="#C5A059" fillOpacity="0.2" />
            </pattern>

            {/* Drop Shadow filter */}
            <filter id="luxuryShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* BACKGROUND SPHERE */}
          {/* Subtle Outer Shadow Ring */}
          <circle cx="250" cy="250" r="236" fill="none" stroke="#C5A059" strokeWidth="1" strokeOpacity="0.15" />
          
          {/* Outer circle line */}
          <circle cx="250" cy="250" r="230" fill="none" stroke="#C5A059" strokeWidth="2" strokeOpacity="0.3" />

          {/* Textured Cream Core Circle */}
          <circle 
            cx="250" 
            cy="250" 
            r="224" 
            fill="#F4EFE6" 
            stroke="#DFD8CC" 
            strokeWidth="3" 
          />
          <circle 
            cx="250" 
            cy="250" 
            r="224" 
            fill="url(#creamTile)" 
          />

          {/* Inner luxury double-thin lines */}
          <circle cx="250" cy="250" r="212" fill="none" stroke="#C5A059" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="3 3" />
          <circle cx="250" cy="250" r="208" fill="none" stroke="#C5A059" strokeWidth="0.5" strokeOpacity="0.2" />

          {/* MONOGRAM VECTOR STRUCTURES */}
          <g filter="url(#luxuryShadow)" className="origin-center">
            
            {/* 1. Left Vertical Architectural Column */}
            <motion.g
              custom={1}
              initial="hidden"
              animate={activeVariants}
              variants={fadeElement}
            >
              {/* Column shaft background */}
              <rect x="170" y="152" width="22" height="196" fill="url(#scentCopper)" rx="2" />
              {/* Column flutes (vertical lines) */}
              <line x1="176" y1="160" x2="176" y2="340" stroke="#F5D996" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="181" y1="160" x2="181" y2="340" stroke="#F5D996" strokeWidth="1" strokeOpacity="0.5" />
              {/* Column Capital (Roman topper) */}
              <rect x="164" y="142" width="34" height="10" fill="url(#scentGold)" rx="1" />
              <rect x="160" y="136" width="42" height="6" fill="url(#scentGold)" rx="1" />
              {/* Column Base */}
              <rect x="164" y="348" width="34" height="10" fill="url(#scentGold)" rx="1" />
              <rect x="160" y="358" width="42" height="6" fill="url(#scentGold)" rx="1" />
            </motion.g>

            {/* 2. Right Vertical Architectural Column */}
            <motion.g
              custom={2.5}
              initial="hidden"
              animate={activeVariants}
              variants={fadeElement}
            >
              {/* Column shaft background */}
              <rect x="308" y="152" width="22" height="196" fill="url(#scentCopper)" rx="2" />
              {/* Column flutes */}
              <line x1="314" y1="160" x2="314" y2="340" stroke="#F5D996" strokeWidth="1" strokeOpacity="0.5" />
              <line x1="319" y1="160" x2="319" y2="340" stroke="#F5D996" strokeWidth="1" strokeOpacity="0.5" />
              {/* Column Capital */}
              <rect x="302" y="142" width="34" height="10" fill="url(#scentGold)" rx="1" />
              <rect x="298" y="136" width="42" height="6" fill="url(#scentGold)" rx="1" />
              {/* Column Base */}
              <rect x="302" y="348" width="34" height="10" fill="url(#scentGold)" rx="1" />
              <rect x="298" y="358" width="42" height="6" fill="url(#scentGold)" rx="1" />
            </motion.g>

            {/* 3. The Copper "U / S" Structural Monogram Overlap */}
            {/* The main copper loop wrapping columns */}
            <motion.path
              d="M 181 210 L 181 300 C 181 330, 319 330, 319 300 L 319 160 C 319 120, 270 120, 270 160 L 270 280 C 270 300, 230 300, 230 280 L 230 210"
              stroke="url(#scentCopper)"
              strokeWidth="18"
              strokeLinecap="round"
              strokeLinejoin="round"
              custom={2}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />
            {/* Inner accent golden stroke for high-end look */}
            <motion.path
              d="M 181 210 L 181 300 C 181 330, 319 330, 319 300 L 319 160 C 319 120, 270 120, 270 160 L 270 280 C 270 300, 230 300, 230 280 L 230 210"
              stroke="url(#scentGold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              custom={3.5}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
              strokeDasharray="10 5"
            />

            {/* 4. Elegant Calligraphic Ribbon (Sage Green-Teal) */}
            {/* Sweeping curves looping the columns like Arabic calligraphy */}
            <motion.path
              d="M 130 320 C 140 220, 220 200, 250 250 C 280 300, 370 280, 370 200 C 370 140, 320 160, 300 210 C 280 260, 220 340, 150 260 C 110 210, 180 140, 250 180"
              stroke="url(#scentTeal)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              custom={1.5}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />
            {/* Glowing gold shimmer accent on teal ribbon */}
            <motion.path
              d="M 130 320 C 140 220, 220 200, 250 250 C 280 300, 370 280, 370 200 C 370 140, 320 160, 300 210 C 280 260, 220 340, 150 260 C 110 210, 180 140, 250 180"
              stroke="url(#scentGold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              custom={3}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />

            {/* 5. Gold Ribbon Accents & Swirl flourishes */}
            {/* Top flame / flower bud swirl */}
            <motion.path
              d="M 250 180 C 255 140, 240 120, 255 90 C 265 110, 260 140, 250 180 Z"
              fill="url(#scentGold)"
              custom={4}
              initial="hidden"
              animate={activeVariants}
              variants={fadeElement}
            />
            {/* Swirl left background ornament */}
            <motion.path
              d="M 152 230 C 130 210, 140 180, 160 190 C 170 195, 172 205, 160 210"
              stroke="url(#scentGold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              custom={4.2}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />
            {/* Swirl right background ornament */}
            <motion.path
              d="M 348 230 C 370 210, 360 180, 340 190 C 330 195, 328 205, 340 210"
              stroke="url(#scentGold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              custom={4.4}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />
            
            {/* Center golden S-S accent curve */}
            <motion.path
              d="M 215 260 Q 235 240 250 260 T 285 260"
              stroke="url(#scentGold)"
              strokeWidth="3.5"
              strokeLinecap="round"
              custom={3}
              initial="hidden"
              animate={activeVariants}
              variants={animated ? drawPath : undefined}
              fill="none"
            />
          </g>
        </svg>
      </div>

      {/* 2. Brand Text block */}
      {showText && (
        <div className="mt-8 space-y-3 select-none">
          {/* SCENT & SOUL */}
          <motion.h2
            custom={5}
            initial="hidden"
            animate={activeVariants}
            variants={fadeElement}
            className={`font-serif text-3xl md:text-4xl tracking-[0.1em] font-medium leading-none ${
              lightMode ? 'text-gray-900' : 'text-white'
            }`}
            style={{ fontFamily: "'Playfair Display', 'Didot', 'Georgia', serif" }}
          >
            SCENT <span className="text-[#C5A059] italic font-normal">&</span> SOUL
          </motion.h2>

          {/* Tagline */}
          <motion.p
            custom={6}
            initial="hidden"
            animate={activeVariants}
            variants={fadeElement}
            onAnimationComplete={onAnimationComplete}
            className="text-[10px] md:text-11px font-sans tracking-[0.45em] uppercase font-semibold text-[#C5A059]"
          >
            FRAGRANCE OF THE SOUL
          </motion.p>
        </div>
      )}
    </div>
  );
};
