/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  Sliders, 
  Film, 
  Music, 
  Tv, 
  Sparkles,
  Info,
  Layers,
  Camera,
  Share2
} from 'lucide-react';
import { ScentAndSoulLogo } from './ScentAndSoulLogo';
import { cn } from '../lib/utils';

interface LaunchVideoSimulatorProps {
  onClose?: () => void;
  standalone?: boolean;
}

export function LaunchVideoSimulator({ onClose, standalone = false }: LaunchVideoSimulatorProps) {
  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0); // in seconds (max 6s)
  const [aspectRatio, setAspectRatio] = useState<'16-9' | '9-16' | '1-1'>('16-9');
  const [theme, setTheme] = useState<'amber-gold' | 'royal-emerald' | 'mystic-black'>('amber-gold');
  const [audioTheme, setAudioTheme] = useState<'sandalwood' | 'ozone' | 'piano'>('sandalwood');
  const [isMuted, setIsMuted] = useState(false);
  const [cameraZoom, setCameraZoom] = useState<'slow-zoom' | 'pan-down' | 'static'>('slow-zoom');
  const [showOverlays, setShowOverlays] = useState(true);
  const [customTitle, setCustomTitle] = useState('THE REVEAL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Audio Context Ref for luxury synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particle simulation loop
  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      size: number;
      color: string;
      life: number;
    }> = [];

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palettes
    const palette = {
      'amber-gold': ['#F5D996', '#C5A059', '#E66C23', '#F3F4F6'],
      'royal-emerald': ['#ACC2A3', '#7E9675', '#C5A059', '#E1DCD3'],
      'mystic-black': ['#C5A059', '#333333', '#888888', '#ffffff']
    }[theme];

    const spawnParticle = (centerX?: number, centerY?: number) => {
      const px = centerX !== undefined ? centerX : Math.random() * width;
      const py = centerY !== undefined ? centerY : height + 10;
      const col = palette[Math.floor(Math.random() * palette.length)];
      particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 1.5,
        vy: centerX !== undefined ? (Math.random() - 0.5) * 4 : -Math.random() * 1.5 - 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        size: Math.random() * 3 + 1,
        color: col,
        life: Math.random() * 120 + 80
      });
    };

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Create subtle dark overlay inside video canvas
      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, width, height);

      // Spawn ambient particles constantly if playing
      if (isPlaying && Math.random() < 0.25) {
        spawnParticle();
      }

      // Climax splash at 3.0s (50% progress)
      if (isPlaying && Math.abs(currentTime - 3.0) < 0.05 && Math.random() < 0.4) {
        for (let i = 0; i < 4; i++) {
          spawnParticle(width / 2, height / 2);
        }
      }

      // Draw and update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (p.life / 200);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.fill();

        if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0) {
          particles.splice(i, 1);
        }
      }
      ctx.shadowBlur = 0; // reset
      ctx.globalAlpha = 1.0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, theme, currentTime]);

  // Luxury synthesizer sound triggers
  const playSynthesizedSound = (timestamp: number) => {
    if (isMuted) return;

    try {
      // Initialize Audio Context lazily
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. Initial Cinematic Ambient Drone / Pad (Triggered once at beginning t=0)
      if (timestamp === 0) {
        // Sandalwood & Oud Sound preset: warm low-pass filtered saw wave with detuned unison
        if (audioTheme === 'sandalwood') {
          const droneOsc1 = ctx.createOscillator();
          const droneOsc2 = ctx.createOscillator();
          const lowpass = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          droneOsc1.type = 'sawtooth';
          droneOsc2.type = 'sawtooth';
          droneOsc1.frequency.setValueAtTime(55, now); // A1 note
          droneOsc2.frequency.setValueAtTime(55.4, now); // slightly detuned
          
          lowpass.type = 'lowpass';
          lowpass.frequency.setValueAtTime(250, now);
          lowpass.frequency.exponentialRampToValueAtTime(600, now + 3);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.2, now + 1.5);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

          droneOsc1.connect(lowpass);
          droneOsc2.connect(lowpass);
          lowpass.connect(gain);
          gain.connect(ctx.destination);

          droneOsc1.start(now);
          droneOsc2.start(now);
          droneOsc1.stop(now + 6);
          droneOsc2.stop(now + 6);
        } else if (audioTheme === 'ozone') {
          // Ozone breeze: white noise & high pass filtered sweep
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(110, now); // A2
          osc.frequency.exponentialRampToValueAtTime(220, now + 3);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 2);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 6);
        } else {
          // Piano Chord: low rich octave drone
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc1.frequency.setValueAtTime(110, now); // A2
          osc2.frequency.setValueAtTime(165, now); // E3 fifth

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.25, now + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 5.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 6);
          osc2.stop(now + 6);
        }
      }

      // 2. Climax Scent Burst chime (Triggered exactly at t=3.0s as letters reveal)
      if (Math.abs(timestamp - 3.0) < 0.1) {
        if (audioTheme === 'sandalwood' || audioTheme === 'piano') {
          // Luxury chime: cascading clean sine waves at golden ratios
          const frequencies = [440, 554, 659, 880, 1109]; // A major luxury chord
          frequencies.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const delay = idx * 0.08;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.12, now + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.0);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 2.5);
          });
        } else {
          // Ozone synth swoop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.exponentialRampToValueAtTime(1760, now + 0.8);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 2);
        }
      }
    } catch (err) {
      console.warn("Web Audio Synthesis failed or was blocked by browser policies: ", err);
    }
  };

  // Video time tracker
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - (currentTime * 1000);
      playbackIntervalRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= 6.0) {
          // Reset/Loop
          setCurrentTime(6.0);
          setProgress(100);
          setIsPlaying(false);
          if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
        } else {
          setCurrentTime(elapsed);
          setProgress((elapsed / 6.0) * 100);
          
          // Trigger audio triggers
          if (Math.abs(elapsed - 3.0) < 0.05) {
            playSynthesizedSound(3.0);
          }
        }
      }, 50);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Handle Play toggle
  const handlePlayToggle = () => {
    if (currentTime >= 6.0) {
      // Replay from start
      setCurrentTime(0);
      setProgress(0);
      setIsPlaying(true);
      playSynthesizedSound(0);
    } else {
      const nextPlay = !isPlaying;
      setIsPlaying(nextPlay);
      if (nextPlay) {
        playSynthesizedSound(currentTime);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  };

  // Share / download simulation
  const handleExportVideo = () => {
    alert("🚀 EXPORT SUCCESSFUL: Scent & Soul Launch Video compilation completed.\nFormat: High-Definition H.264 (MP4)\nPreset: " + aspectRatio + " (" + audioTheme + " mix)\nSaved to local storage. Ready for social media distribution.");
  };

  return (
    <div className={cn(
      "bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col xl:flex-row gap-8 p-8 animate-fadeIn",
      standalone ? "w-full max-w-7xl mx-auto" : ""
    )} id="video-sim-workspace">
      
      {/* Visualizer Block (Screen) */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        {/* Screen Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={cn(
                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                isPlaying ? "bg-red-400" : "bg-amber-400"
              )}></span>
              <span className={cn(
                "relative inline-flex rounded-full h-2.5 w-2.5",
                isPlaying ? "bg-red-500" : "bg-amber-500"
              )}></span>
            </span>
            <span className="text-[9px] font-black tracking-widest text-gray-400 uppercase font-mono">
              {isPlaying ? 'RENDER STATUS: PLAYING CINEMATIC' : 'RENDER STATUS: IDEAL'}
            </span>
          </div>

          <div className="flex bg-zinc-900/80 p-1 rounded-xl gap-2 border border-white/5">
            <button
              onClick={() => setAspectRatio('16-9')}
              className={cn(
                "px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all",
                aspectRatio === '16-9' ? "bg-amber-500 text-black" : "text-gray-400"
              )}
            >
              16:9 WEB
            </button>
            <button
              onClick={() => setAspectRatio('9-16')}
              className={cn(
                "px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all",
                aspectRatio === '9-16' ? "bg-amber-500 text-black" : "text-gray-400"
              )}
            >
              9:16 MOBILE
            </button>
            <button
              onClick={() => setAspectRatio('1-1')}
              className={cn(
                "px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg transition-all",
                aspectRatio === '1-1' ? "bg-amber-500 text-black" : "text-gray-400"
              )}
            >
              1:1 POST
            </button>
          </div>
        </div>

        {/* Cinematic Stage Area */}
        <div className="relative aspect-video w-full bg-[#0F0F0F] rounded-[2rem] border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
          
          {/* Aspect Ratio Box Filter Mask */}
          <div className={cn(
            "relative transition-all duration-500 ease-out flex items-center justify-center overflow-hidden bg-black shadow-2xl",
            aspectRatio === '16-9' ? 'w-full h-full' :
            aspectRatio === '9-16' ? 'h-full aspect-[9/16]' : 'h-full aspect-square'
          )}>
            
            {/* Theme Background */}
            <div className={cn(
              "absolute inset-0 transition-colors duration-1000",
              theme === 'amber-gold' ? 'bg-radial-at-c from-zinc-900 via-neutral-950 to-black' :
              theme === 'royal-emerald' ? 'bg-radial-at-c from-emerald-950/40 via-neutral-950 to-black' :
              'bg-black'
            )} />

            {/* Simulated camera movement viewport wrapper */}
            <div className={cn(
              "w-full h-full flex flex-col items-center justify-center p-8 relative transition-all duration-1000 ease-out",
              isPlaying && cameraZoom === 'slow-zoom' ? 'scale-105 rotate-1 translate-y-[-5px]' :
              isPlaying && cameraZoom === 'pan-down' ? 'translate-y-[10px] scale-102' :
              'scale-100 rotate-0 translate-y-0'
            )}>
              {/* Particle Canvas Layer */}
              <canvas 
                ref={particleCanvasRef} 
                className="absolute inset-0 pointer-events-none z-10" 
              />

              {/* Atmospheric lighting flares */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 z-10" />

              {/* Luxury Gold Shimmer flares */}
              {isPlaying && currentTime >= 3.0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,89,0.15)_0%,_transparent_60%)] pointer-events-none z-10" 
                />
              )}

              {/* Draw animated logo */}
              <ScentAndSoulLogo
                size="screen"
                showText={currentTime >= 3.0} // Text appears at 3s climax
                animated={isPlaying}
                className="z-20 scale-90 sm:scale-100 transition-all duration-700"
              />

              {/* Top and Bottom Cinematic crop lines if 16-9 */}
              {aspectRatio === '16-9' && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-4 bg-black/80 z-30 border-b border-white/5" />
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/80 z-30 border-t border-white/5" />
                </>
              )}

              {/* Watermark/Timeline overlays */}
              {showOverlays && (
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-30 pointer-events-none text-white/40 font-mono text-[7px] tracking-widest uppercase">
                  <div className="space-y-1">
                    <p>S&S PERFUMERY CORP</p>
                    <p>RE Reveal • v2.0</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p>PROJECT CODENAME: {customTitle}</p>
                    <p>TIMECODE: 00:0{Math.floor(currentTime)}:{Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}</p>
                  </div>
                </div>
              )}

              {/* Start Overlay Button if not playing & progress is 0 */}
              {!isPlaying && currentTime === 0 && (
                <button
                  onClick={handlePlayToggle}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:bg-[#C5A059] hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.5)] group"
                >
                  <Play size={24} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform" />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Video Player Timeline Controls */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Play Button */}
            <button
              onClick={handlePlayToggle}
              className="p-3 bg-white hover:bg-[#C5A059] text-black rounded-xl active:scale-95 transition-all cursor-pointer shadow"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>

            {/* Reset / Loop */}
            <button
              onClick={handleReset}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-gray-300 rounded-xl active:scale-95 transition-all cursor-pointer"
              title="Reset Video"
            >
              <RotateCcw size={14} />
            </button>

            {/* Progress Slider (Locked in simulator, acts as visual) */}
            <div className="flex-1 relative h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-amber-500 rounded-full transition-all duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Time Indicator */}
            <span className="text-[10px] font-mono font-black text-gray-400">
              {currentTime.toFixed(1)}s / 6.0s
            </span>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 text-gray-300 rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Side Controller Panel */}
      <div className="w-full xl:w-96 shrink-0 flex flex-col justify-between space-y-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <Film className="text-[#C5A059]" size={20} />
            <div>
              <h3 className="text-white text-sm font-black uppercase tracking-wider font-display">LAUNCH VIDEO STUDIO</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Generate and adapt branding video clips</p>
            </div>
          </div>

          {/* Config: Sound Presets */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Music size={12} className="text-[#C5A059]" /> Sound Design Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sandalwood', name: 'Oud & Gold' },
                { id: 'ozone', name: 'Pure Mist' },
                { id: 'piano', name: 'Grand Solo' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setAudioTheme(s.id as any)}
                  className={cn(
                    "px-3 py-2 text-[9px] font-black uppercase tracking-tight rounded-xl border transition-all cursor-pointer",
                    audioTheme === s.id 
                      ? "bg-[#C5A059] text-black border-[#C5A059]" 
                      : "bg-zinc-900/50 text-gray-400 border-white/5 hover:border-white/10"
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Config: Visual Themes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Layers size={12} className="text-[#C5A059]" /> Lighting & Atmosphere
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'amber-gold', name: 'Amber Gold' },
                { id: 'royal-emerald', name: 'Sage Teal' },
                { id: 'mystic-black', name: 'Obsidian' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={cn(
                    "px-3 py-2 text-[9px] font-black uppercase tracking-tight rounded-xl border transition-all cursor-pointer",
                    theme === t.id 
                      ? "bg-white text-black border-white" 
                      : "bg-zinc-900/50 text-gray-400 border-white/5 hover:border-white/10"
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Config: Camera Movement */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Camera size={12} className="text-[#C5A059]" /> Panning Vector
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'slow-zoom', name: 'Slow Zoom' },
                { id: 'pan-down', name: 'Tilt Down' },
                { id: 'static', name: 'Tripod' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCameraZoom(c.id as any)}
                  className={cn(
                    "px-3 py-2 text-[9px] font-black uppercase tracking-tight rounded-xl border transition-all cursor-pointer",
                    cameraZoom === c.id 
                      ? "bg-zinc-800 text-white border-zinc-700" 
                      : "bg-zinc-900/50 text-gray-400 border-white/5 hover:border-white/10"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Simulated Text Watermark
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value.toUpperCase())}
              placeholder="ENTER FILM TITLE..."
              className="w-full px-4 py-3 bg-zinc-900/50 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-wider text-white focus:outline-none focus:border-amber-500 placeholder:text-zinc-700"
            />
          </div>

          {/* Show Watermarks Toggle */}
          <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl border border-white/5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Show Timecodes Overlay</span>
            <input
              type="checkbox"
              checked={showOverlays}
              onChange={e => setShowOverlays(e.target.checked)}
              className="accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <button
            onClick={handleExportVideo}
            className="w-full py-4 bg-[#C5A059] hover:bg-[#D7B46E] text-black font-black text-[10px] tracking-widest uppercase rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Download size={14} />
            COMPILE & EXPORT VIDEO CLIP
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white font-black text-[10px] tracking-widest uppercase rounded-2xl active:scale-95 transition-all cursor-pointer"
            >
              CLOSE PREVIEW STUDIO
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
