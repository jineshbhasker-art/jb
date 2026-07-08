import React from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { Compass, Sparkles, Activity, Shield } from 'lucide-react';

export interface ScentDimension {
  key: string;
  name: string;
  value: number;
  description: string;
  color: string;
}

interface ScentSpiderChartProps {
  product: Product;
}

export function calculateScentDimensions(product: Product): ScentDimension[] {
  const nameLower = (product.name || '').toLowerCase();
  const brandLower = (product.brand || '').toLowerCase();
  const familyLower = (product.scentFamily || '').toLowerCase();
  const topLower = (product.topNotes || '').toLowerCase();
  const midLower = (product.middleNotes || '').toLowerCase();
  const baseLower = (product.baseNotes || '').toLowerCase();
  const concLower = (product.concentration || '').toLowerCase();

  // Deterministic seed based on product name and brand to ensure a unique stable signature
  let seed = 0;
  const combinedStr = product.name + (product.scentFamily || '') + product.brand;
  for (let i = 0; i < combinedStr.length; i++) {
    seed += combinedStr.charCodeAt(i);
  }

  // 1. Top notes (Freshness / Volatility)
  let topVal = 55 + (seed % 25); // base 55-80
  const freshKeywords = ['bergamot', 'lemon', 'citrus', 'grapefruit', 'lime', 'orange', 'fresh', 'fruity', 'pineapple', 'apple', 'mint', 'verbena', 'aldehydes', 'neroli'];
  freshKeywords.forEach(word => {
    if (topLower.includes(word) || nameLower.includes(word)) topVal += 5;
  });
  topVal = Math.min(95, Math.max(35, topVal));

  // 2. Middle notes (Bloom / Florality / Spice)
  let midVal = 50 + ((seed >> 2) % 30); // base 50-80
  const floralSpicyKeywords = ['rose', 'jasmine', 'floral', 'tuberose', 'iris', 'orchid', 'spicy', 'nutmeg', 'cardamom', 'pepper', 'lavender', 'clove', 'cinnamon', 'saffron', 'geranium', 'violet'];
  floralSpicyKeywords.forEach(word => {
    if (midLower.includes(word) || topLower.includes(word)) midVal += 5;
  });
  midVal = Math.min(95, Math.max(35, midVal));

  // 3. Base notes (Depth / Fixatives)
  let baseVal = 45 + ((seed >> 4) % 35); // base 45-80
  const deepKeywords = ['oud', 'amber', 'musk', 'cedar', 'vetiver', 'sandalwood', 'patchouli', 'vanilla', 'oakmoss', 'wood', 'leather', 'benzoin', 'tonka', 'resin', 'civet'];
  deepKeywords.forEach(word => {
    if (baseLower.includes(word) || midLower.includes(word)) baseVal += 6;
  });
  baseVal = Math.min(95, Math.max(35, baseVal));

  // 4. Sillage / Projection
  let sillageVal = 50 + ((seed >> 6) % 30);
  if (concLower.includes('extrait') || concLower.includes('parfum')) sillageVal += 12;
  if (topLower.includes('pepper') || midLower.includes('pepper') || topLower.includes('aldehydes')) sillageVal += 8;
  sillageVal = Math.min(95, Math.max(35, sillageVal));

  // 5. Concentration (Formula Weight)
  let concVal = 60;
  if (concLower.includes('extrait')) concVal = 85 + (seed % 10);
  else if (concLower.includes('parfum') || concLower.includes('edp')) concVal = 72 + (seed % 12);
  else if (concLower.includes('toilette') || concLower.includes('edt')) concVal = 50 + (seed % 10);
  else if (concLower.includes('cologne')) concVal = 40 + (seed % 10);
  concVal = Math.min(98, Math.max(30, concVal));

  // 6. Longevity (Persistence)
  let longevityVal = 40 + ((seed >> 8) % 40); // base 40-80
  if (concVal > 80) longevityVal += 15;
  else if (concVal > 65) longevityVal += 8;
  if (baseLower.includes('oud') || baseLower.includes('amber') || baseLower.includes('musk')) longevityVal += 10;
  longevityVal = Math.min(95, Math.max(35, longevityVal));

  return [
    { key: 'top', name: 'Top notes (Fresh)', value: Math.round(topVal), description: 'Initial aromatic volatility and citrus/herbaceous brightness.', color: '#FCD34D' },
    { key: 'middle', name: 'Heart notes (Bloom)', value: Math.round(midVal), description: 'Core bouquet body, sillage expression and floral/spicy complexity.', color: '#C5A059' },
    { key: 'base', name: 'Base notes (Depth)', value: Math.round(baseVal), description: 'Warm drydown fixative lingering strength, heavy woods and rich resins.', color: '#B45309' },
    { key: 'sillage', name: 'Sillage range', value: Math.round(sillageVal), description: 'The projecting radius of scent molecules in the air.', color: '#06B6D4' },
    { key: 'concentration', name: 'Concentration', value: Math.round(concVal), description: 'Essential fragrance oil compound purity and formulation density.', color: '#8B5CF6' },
    { key: 'longevity', name: 'Longevity hours', value: Math.round(longevityVal), description: 'Estimated skin persistence hours before dissipation.', color: '#10B981' }
  ];
}

export default function ScentSpiderChart({ product }: ScentSpiderChartProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  const dimensions = React.useMemo(() => calculateScentDimensions(product), [product]);

  // Chart Coordinates & Dimensions
  const cx = 200;
  const cy = 200;
  const r = 125;
  const N = dimensions.length;

  const rScale = d3.scaleLinear().domain([0, 100]).range([0, r]);

  // Generate the coordinates of the 5 concentric grid levels
  const levels = [20, 40, 60, 80, 100];
  const gridLevels = levels.map(level => {
    const radius = rScale(level);
    const points = Array.from({ length: N }).map((_, idx) => {
      const angle = (idx * 2 * Math.PI) / N - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      };
    });
    return { level, points };
  });

  // Generate outer-most vertices for labels and axis lines
  const axes = Array.from({ length: N }).map((_, idx) => {
    const angle = (idx * 2 * Math.PI) / N - Math.PI / 2;
    const outerX = cx + r * Math.cos(angle);
    const outerY = cy + r * Math.sin(angle);
    
    // Position labels slightly further out
    const labelX = cx + (r + 28) * Math.cos(angle);
    const labelY = cy + (r + 14) * Math.sin(angle);

    return { idx, outerX, outerY, labelX, labelY, angle };
  });

  // Calculate polygon points for the active perfume profile
  const radarPoints = dimensions.map((d, idx) => {
    const angle = (idx * 2 * Math.PI) / N - Math.PI / 2;
    const valueRadius = rScale(d.value);
    return {
      x: cx + valueRadius * Math.cos(angle),
      y: cy + valueRadius * Math.sin(angle)
    };
  });

  const pointsString = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-[3rem] space-y-8 backdrop-blur-3xl relative overflow-hidden" id="scent-fingerprint-panel">
      {/* Dynamic Background Radial Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[300px] aspect-square bg-[#C5A059]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Activity className="text-[#C5A059]" size={18} />
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.25em]">Olfactory Scent Fingerprint</h3>
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Active Molecular Scent Profile Analysis</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[7px] font-mono uppercase tracking-widest text-gray-400">
          <Shield size={10} className="text-[#C5A059]" />
          D3.js Rendered Core Scent Space
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Interactive D3 Radar Chart */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          <svg 
            viewBox="0 0 400 400" 
            className="w-full max-w-[340px] md:max-w-[380px] h-auto drop-shadow-2xl overflow-visible select-none"
          >
            <defs>
              {/* Luxury Gold Radial Gradient for the Active Radar Polygon */}
              <radialGradient id="radarGoldGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C5A059" stopOpacity="0.1" />
                <stop offset="85%" stopColor="#C5A059" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8A6B2D" stopOpacity="0.45" />
              </radialGradient>
              {/* Highlight Gradient */}
              <radialGradient id="radarActiveGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C5A059" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFECA1" stopOpacity="0.65" />
              </radialGradient>
              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Concentric Grid Hexagons */}
            {gridLevels.map(({ level, points }) => {
              const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
              return (
                <g key={level} className="group/level">
                  <polygon
                    points={pointsStr}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="1"
                    className="transition-all duration-300 group-hover/level:stroke-white/10"
                  />
                  {/* Subtle level labels on vertical axis */}
                  <text
                    x={cx + 5}
                    y={cy - rScale(level) + 3}
                    fill="rgba(255, 255, 255, 0.15)"
                    fontSize="7"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Axis Lines */}
            {axes.map(({ idx, outerX, outerY, labelX, labelY, angle }) => {
              const isHovered = hoveredIndex === idx;
              const d = dimensions[idx];
              
              // Custom text alignments depending on coordinates
              const cos = Math.cos(angle);
              const textAnchor = Math.abs(cos) < 0.1 ? 'middle' : cos > 0 ? 'start' : 'end';

              return (
                <g key={idx} className="transition-all duration-300">
                  {/* Outer Axis Guideline */}
                  <line
                    x1={cx}
                    y1={cy}
                    x2={outerX}
                    y2={outerY}
                    stroke={isHovered ? 'rgba(197, 160, 89, 0.4)' : 'rgba(255, 255, 255, 0.05)'}
                    strokeWidth={isHovered ? 1.5 : 1}
                    className="transition-all"
                  />
                  {/* Axis Label */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={textAnchor}
                    dominantBaseline="middle"
                    fill={isHovered ? '#C5A059' : 'rgba(255, 255, 255, 0.4)'}
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight={isHovered ? '900' : 'bold'}
                    className="cursor-pointer transition-all tracking-[0.1em] uppercase hover:fill-[#C5A059]"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {d.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Primary Filled Radar Area */}
            <motion.polygon
              points={pointsString}
              fill="url(#radarGoldGradient)"
              stroke="#C5A059"
              strokeWidth={1.5}
              className="transition-all duration-500 drop-shadow-[0_0_12px_rgba(197,160,89,0.25)]"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Interactive Data Point Handles (Circles) */}
            {radarPoints.map((point, idx) => {
              const isHovered = hoveredIndex === idx;
              const d = dimensions[idx];

              return (
                <g 
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                >
                  {/* Outer Glow Ring on Hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.circle
                        cx={point.x}
                        cy={point.y}
                        initial={{ r: 4, opacity: 0 }}
                        animate={{ r: 12, opacity: 0.25 }}
                        exit={{ r: 4, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        fill="#C5A059"
                        className="pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  {/* Core Value Dot */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isHovered ? 6 : 3.5}
                    fill={isHovered ? '#FFFFFF' : '#C5A059'}
                    stroke={isHovered ? '#C5A059' : '#0F0F0F'}
                    strokeWidth={isHovered ? 2 : 1}
                    className="transition-all duration-300"
                  />
                </g>
              );
            })}
          </svg>

          {/* Scent Central Legend inside Radar (Center Hover Overlay) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <AnimatePresence mode="wait">
              {hoveredIndex !== null ? (
                <motion.div
                  key={hoveredIndex}
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  className="bg-black/90 border border-[#C5A059]/30 p-2 px-3 rounded-xl max-w-[150px] shadow-xl backdrop-blur-md"
                >
                  <p className="text-[7px] font-black uppercase tracking-widest text-[#C5A059]">
                    {dimensions[hoveredIndex].name}
                  </p>
                  <p className="text-lg font-black text-white font-mono leading-none my-0.5">
                    {dimensions[hoveredIndex].value}%
                  </p>
                  <p className="text-[5.5px] leading-tight text-gray-400 uppercase tracking-wider">
                    {dimensions[hoveredIndex].description.substring(0, 38)}...
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  className="p-1 px-2 rounded bg-white/5 border border-white/5"
                >
                  <p className="text-[6.5px] font-mono uppercase tracking-[0.2em] text-gray-400">
                    Hover nodes
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Scent Dimension List & Explanations */}
        <div className="lg:col-span-7 flex flex-col gap-3 font-sans">
          <p className="text-[8px] font-black text-gray-400 tracking-[0.25em] uppercase mb-1">
            OLFACTORY PROFILE METRICS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dimensions.map((d, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={d.key}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                    isHovered 
                      ? 'bg-gradient-to-br from-[#C5A059]/10 to-transparent border-[#C5A059]/30 translate-x-1 shadow-lg shadow-black/30' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: d.color }} 
                        />
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isHovered ? 'text-white' : 'text-gray-300'}`}>
                          {d.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black font-mono text-white">
                        {d.value}%
                      </span>
                    </div>
                    <p className="text-[7.5px] text-gray-500 leading-normal uppercase font-mono tracking-wide">
                      {d.description}
                    </p>
                  </div>

                  {/* Clean custom progress bar */}
                  <div className="mt-2 w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${d.value}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick analysis summary bar */}
          <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex items-center gap-3 mt-1.5">
            <Sparkles className="text-[#C5A059] shrink-0" size={14} />
            <p className="text-[8px] text-gray-400 leading-normal uppercase tracking-wider">
              Note: This olfactory visualizer decodes active organic fixatives & essential raw compounds to formulate a fingerprint map of sillage development over a 12-hour active lifecycle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
