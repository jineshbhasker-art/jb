import React from 'react';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw 
} from 'lucide-react';
import { Product } from '../types';

// Pre-allocated bubble pool (Object Pooling)
// To prevent garbage collection spikes during high-framerate rendering,
// we pre-allocate a static pool of bubble configurations instead of generating
// new objects dynamically on every render or state update.
interface BubbleAsset {
  id: number;
  left: string;
  bottom: string;
  size: string;
  delay: string;
  duration: string;
  opacity: number;
}

const BUBBLE_POOL: BubbleAsset[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${15 + (i * 7.3) % 70}%`,
  bottom: `${5 + (i * 11) % 40}px`,
  size: `${2 + (i * i) % 4}px`,
  delay: `${(i * 0.4).toFixed(1)}s`,
  duration: `${3 + (i * 0.8).toFixed(1)}s`,
  opacity: 0.3 + (i % 4) * 0.1,
}));

// Static Brand-to-Gradient Cache (Cache/Dictionary Pool)
// Reusing computed theme profiles to prevent DOM recalcs when switching products
const BRAND_GRADIENTS: Record<string, string> = {
  'Amouage': 'from-amber-600/80 to-amber-900/90',
  'Creed': 'from-cyan-500/80 to-blue-900/90',
  'Maison Francis Kurkdjian': 'from-rose-500/80 to-purple-900/90',
  'Lattafa': 'from-orange-500/80 to-yellow-900/90',
  'Rasasi': 'from-teal-500/80 to-emerald-900/90',
  'Scents & Souls': 'from-amber-500/90 via-[#C5A059]/80 to-yellow-950/90',
  'Swiss Arabian': 'from-yellow-600/80 to-amber-950/90',
};

const DEFAULT_GRADIENT = 'from-amber-500/90 via-[#C5A059]/80 to-yellow-950/90';

interface PerfumeViewer3DProps {
  configuringProduct: Product;
  selectedMl: number;
  selectedConcentration: string;
  customEngraving: string;
  LUXURY_FALLBACKS: Record<string, {
    scentFamily: string;
    concentration: string;
    topNotes: string;
    middleNotes: string;
    baseNotes: string;
    color: string;
  }>;
  ML_OPTIONS: Array<{
    size: number;
    label: string;
    multiplier: number;
    height: number;
    desc: string;
  }>;
}

export default function PerfumeViewer3D({
  configuringProduct,
  selectedMl,
  selectedConcentration,
  customEngraving,
  LUXURY_FALLBACKS,
  ML_OPTIONS
}: PerfumeViewer3DProps) {
  // Isolate state changes of rotation & zoom to prevent full-parent re-renders
  const [rotation, setRotation] = React.useState({ x: -10, y: 15 });
  const [zoom, setZoom] = React.useState(1.0);
  const [autoSpin, setAutoSpin] = React.useState(true);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const rotationStartRef = React.useRef({ x: -10, y: 15 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setAutoSpin(false);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotationStartRef.current = { ...rotation };
  };

  const handleMouseMove3D = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const sensitivity = 0.6;
    setRotation({
      x: Math.max(-45, Math.min(45, rotationStartRef.current.x - deltaY * sensitivity)),
      y: (rotationStartRef.current.y + deltaX * sensitivity) % 360
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setAutoSpin(false);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      rotationStartRef.current = { ...rotation };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStartRef.current.x;
    const deltaY = e.touches[0].clientY - dragStartRef.current.y;
    const sensitivity = 0.6;
    setRotation({
      x: Math.max(-45, Math.min(45, rotationStartRef.current.x - deltaY * sensitivity)),
      y: (rotationStartRef.current.y + deltaX * sensitivity) % 360
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Auto-spin animation loop when active and not dragging
  React.useEffect(() => {
    if (!autoSpin || isDragging || !configuringProduct) return;
    let animationFrameId: number;
    const tick = () => {
      setRotation(prev => ({
        ...prev,
        y: (prev.y + 0.35) % 360
      }));
      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [autoSpin, isDragging, configuringProduct]);

  // Retrieve brand gradient profile from the memory cache
  const colorClass = BRAND_GRADIENTS[configuringProduct.brand] || 
                     LUXURY_FALLBACKS[configuringProduct.brand]?.color || 
                     DEFAULT_GRADIENT;

  const currentMlOption = ML_OPTIONS.find(o => o.size === selectedMl) || { height: 80 };

  return (
    <div className="lg:col-span-5 flex flex-col items-center justify-between bg-gray-50/50 p-6 rounded-[2.5rem] border border-gray-100 min-h-[460px] relative overflow-hidden group">
      <div className="absolute top-6 left-6 text-[8px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${autoSpin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        {autoSpin ? 'ACTIVE 3D AUTO-SPIN' : '3D MANUAL INTERACTION'}
      </div>

      <div className="absolute top-6 right-6 text-[8px] font-mono font-bold text-gray-400 bg-white/60 px-2 py-0.5 rounded border border-gray-100 uppercase tracking-widest">
        X: {Math.round(rotation.x)}° | Y: {Math.round(rotation.y)}°
      </div>

      {/* 3D Drag & Spin Container */}
      <div 
        className="relative w-full flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none py-10 mt-6"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove3D}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          perspective: '1000px',
        }}
      >
        <div 
          className="relative flex flex-col items-center transition-transform duration-100 ease-out"
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${1.05 * zoom})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Cap / Crown */}
          <div className="w-14 h-12 bg-gradient-to-r from-[#A58039] via-[#E5C079] to-[#856019] rounded-lg shadow-lg relative z-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-repeat-x opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:4px_100%]" />
            <div className="absolute -top-1.5 w-10 h-1.5 bg-gradient-to-r from-[#856019] to-[#E5C079] rounded-full" />
          </div>
          
          {/* Metallic Spray collar */}
          <div className="w-8 h-4 bg-gradient-to-r from-gray-300 via-white to-gray-400 relative z-10 shadow-inner" />

          {/* Heavy Glass Body */}
          <div className="w-48 h-64 bg-white/20 backdrop-blur-md rounded-[2.5rem] border-2 border-white/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] relative overflow-hidden flex items-end p-1.5">
            {/* Outer reflection shine lines */}
            <div className="absolute top-0 left-4 w-4 h-full bg-gradient-to-r from-white/35 to-transparent skew-x-12 z-20 pointer-events-none" />
            <div className="absolute top-0 right-10 w-2 h-full bg-gradient-to-r from-white/20 to-transparent skew-x-12 z-20 pointer-events-none" />
            
            {/* Inner heavy glass bevel shadow */}
            <div className="absolute inset-1.5 rounded-[2.2rem] border border-black/5 shadow-inner pointer-events-none z-20" />

            {/* Dynamic Liquid Wave with exact height based on ML selection */}
            <div 
              className={`w-full rounded-[1.8rem] relative overflow-hidden transition-all duration-[800ms] ease-spring bg-gradient-to-t ${colorClass}`}
              style={{
                height: `${currentMlOption.height}%`,
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-radial-gradient from-white/30 to-transparent mix-blend-overlay" />
              
              {/* Wave Overlay SVG inside */}
              <div className="absolute -top-3 left-0 w-[200%] h-6 fill-current opacity-35 text-white/40 animate-wave-slow pointer-events-none">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 L1000,120 L0,120 Z" />
                </svg>
              </div>
              <div className="absolute -top-2 left-[-50%] w-[200%] h-6 fill-current opacity-25 text-white/30 animate-wave-fast pointer-events-none">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,50 C150,20 350,80 500,50 C650,20 850,80 1000,50 L1000,120 L0,120 Z" />
                </svg>
              </div>

              {/* Recycled floating bubbles from Object Pool */}
              {BUBBLE_POOL.map((bubble) => (
                <div 
                  key={bubble.id}
                  className="absolute rounded-full bg-white animate-bubble-1"
                  style={{
                    left: bubble.left,
                    bottom: bubble.bottom,
                    width: bubble.size,
                    height: bubble.size,
                    animationDelay: bubble.delay,
                    animationDuration: bubble.duration,
                    opacity: bubble.opacity,
                  }}
                />
              ))}
            </div>

            {/* Luxury Metallic Plaque Label in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30">
              <div className="w-36 py-4 px-3 bg-gradient-to-br from-[#F5D589]/95 via-[#C5A059]/95 to-[#957029]/95 border border-[#F5D589]/40 rounded-xl shadow-2xl flex flex-col items-center text-center backdrop-blur-sm">
                <div className="text-[6px] text-yellow-950 font-black tracking-[0.3em] uppercase leading-none mb-1">SCENTS & SOULS</div>
                <div className="text-[9px] text-black font-black uppercase tracking-tight leading-tight mb-1 font-sans truncate max-w-[120px]">
                  {configuringProduct.name.replace(/\s*(EDP|EDT|Extrait|Eau\s+de\s+Parfum|100ml|70ml|50ml|75ml)/gi, '')}
                </div>
                <div className="w-10 h-[1px] bg-yellow-950/20 my-1" />
                <div className="text-[5.5px] text-yellow-900 font-bold uppercase tracking-[0.15em] leading-none mb-1">
                  {selectedConcentration.split('(')[0]}
                </div>
                <div className="text-[6px] text-yellow-950 font-black tracking-widest">{selectedMl}ML</div>
                
                {customEngraving.trim() && (
                  <div className="mt-1.5 text-[7px] text-black font-cursive italic tracking-normal border-t border-yellow-950/10 pt-1 w-full truncate font-medium">
                    "{customEngraving.trim()}"
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Action & Interactive Controller Overlay Dashboard */}
      <div className="w-full space-y-4 pt-4 border-t border-gray-100/80">
        {/* Dynamic Zoom Slider Panel */}
        <div className="flex items-center justify-between gap-3 bg-white/80 p-2.5 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            type="button"
            onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="range" 
              min="0.6" 
              max="2.0" 
              step="0.05" 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-black h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[8px] font-mono font-black text-gray-700 min-w-[32px] text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setZoom(prev => Math.min(2.0, prev + 0.1))}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-black transition-all"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {/* Camera Control Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAutoSpin(!autoSpin)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
              autoSpin 
                ? 'bg-black text-white border-transparent shadow-lg' 
                : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
            }`}
          >
            <RefreshCw size={10} className={autoSpin ? 'animate-spin' : ''} />
            {autoSpin ? 'STOP AUTO-SPIN' : 'START AUTO-SPIN'}
          </button>

          <button
            type="button"
            onClick={() => {
              setRotation({ x: -10, y: 15 });
              setZoom(1.0);
              setAutoSpin(true);
            }}
            className="px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border bg-white text-gray-600 border-gray-100 hover:bg-gray-50 flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={10} />
            RESET CAMERA
          </button>
        </div>

        <div className="text-[8px] text-gray-400 font-bold uppercase text-center flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 bg-[#C5A059] rounded-full" />
          Drag / Swipe directly on flacon to rotate • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
