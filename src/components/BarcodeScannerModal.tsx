/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, ScanBarcode, AlertCircle, RotateCw, Keyboard, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
}

const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (err) {
    console.warn("Audio Context beep suppressed:", err);
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = "SCAN PRODUCT BARCODE"
}) => {
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Check camera permissions if supported
  useEffect(() => {
    if (!isOpen) return;
    
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as any })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, [isOpen]);

  // Main scanner setup effect
  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode: Html5Qrcode | null = null;
    const scannerId = "barcode-scanner-viewport";

    const initAndStart = async () => {
      try {
        // Instantiate the scanner inside the container
        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        // Fetch available camera hardware
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label })));
          
          // Select default back-camera/environment facing camera
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
          );
          
          const defaultCamId = selectedCameraId || (backCam ? backCam.id : devices[0].id);
          if (!selectedCameraId) {
            setSelectedCameraId(defaultCamId);
          }

          await html5QrCode.start(
            defaultCamId,
            {
              fps: 15,
              qrbox: (width, height) => {
                // Highlight scan area as a box (70% width, 40% height for typical horizontal barcodes)
                const boxWidth = Math.min(width, 350);
                const boxHeight = Math.min(height, 180);
                return { width: boxWidth, height: boxHeight };
              },
              aspectRatio: 1.333333 // Standard aspect ratio for camera feeds
            },
            (decodedText) => {
              playBeep();
              onScanSuccess(decodedText);
              onClose();
            },
            () => {
              // Silent verbose scanning errors
            }
          );
          setIsScanning(true);
          setScanError(null);
        } else {
          // Attempt standard environment fallback
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (width, height) => {
                const boxWidth = Math.min(width, 320);
                const boxHeight = Math.min(height, 160);
                return { width: boxWidth, height: boxHeight };
              }
            },
            (decodedText) => {
              playBeep();
              onScanSuccess(decodedText);
              onClose();
            },
            () => {}
          );
          setIsScanning(true);
          setScanError(null);
        }
      } catch (err: any) {
        console.error("Camera barcode initialization failed:", err);
        setScanError(err.message || "Failed to start camera. Verify camera permissions and secure context (HTTPS/localhost).");
        setIsScanning(false);
      }
    };

    // Short timeout to let modal animate open and the DOM node render completely
    const timer = setTimeout(() => {
      initAndStart();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop()
            .then(() => {
              html5QrCode?.clear();
            })
            .catch(stopErr => {
              console.warn("Clean stop omitted on unmount:", stopErr);
            });
        }
      }
    };
  }, [isOpen, selectedCameraId, onScanSuccess, onClose]);

  const handleCameraChange = async (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    setScanError(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playBeep();
      onScanSuccess(manualCode.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#C5A059]/10 text-[#C5A059] rounded-xl">
              <ScanBarcode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-gray-900">{title}</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Scents & Souls Scanner Module</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-3 text-gray-400 hover:text-black hover:bg-gray-50 rounded-2xl transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scanner view or camera error */}
        <div className="flex-1 relative bg-black flex flex-col justify-center min-h-[280px] md:min-h-[340px]">
          {/* Main camera target div */}
          <div id="barcode-scanner-viewport" className="w-full h-full min-h-[280px] md:min-h-[340px] [&_video]:object-cover overflow-hidden" />

          {/* Laser animation and aiming brackets */}
          {isScanning && !scanError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Outer aiming box */}
              <div className="w-[80%] max-w-[350px] h-[180px] border-2 border-white/30 rounded-2xl relative flex items-center justify-center">
                {/* 4 corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#C5A059] rounded-tl-lg -mt-[2px] -ml-[2px]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#C5A059] rounded-tr-lg -mt-[2px] -mr-[2px]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#C5A059] rounded-bl-lg -mb-[2px] -ml-[2px]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#C5A059] rounded-br-lg -mb-[2px] -mr-[2px]" />
                
                {/* Laser animation line */}
                <motion.div 
                  animate={{ y: [-70, 70] }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 2, ease: "easeInOut" }}
                  className="absolute w-[92%] h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444]"
                />
              </div>

              <div className="mt-4 px-4 py-1.5 bg-black/60 rounded-full text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ALIGN BARCODE WITHIN THE FRAME
              </div>
            </div>
          )}

          {/* Fallback & Camera Permission Error States */}
          {scanError && (
            <div className="absolute inset-0 bg-gray-950 p-8 flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle size={36} className="text-[#C5A059] animate-bounce" />
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase text-white tracking-widest">CAMERA FEED ERROR</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                  {permissionState === 'denied' 
                    ? "Camera permission denied. Please allow camera access in your browser settings to scan barcodes directly." 
                    : "No camera detected or permission was dismissed. Please use manual code entry below."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="px-5 py-2.5 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Keyboard size={12} /> Use Manual Input
              </button>
            </div>
          )}
        </div>

        {/* Bottom controls / manual input section */}
        <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Camera Switcher */}
            {cameras.length > 1 && !scanError && (
              <div className="flex items-center gap-2">
                <Camera size={14} className="text-gray-400" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Camera Source:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-gray-200/60 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none text-gray-700"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label.replace(/\(.*\)/g, '') || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Toggle manual keying */}
            {!showManualInput && (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Keyboard size={12} /> Key in barcode manually
              </button>
            )}
          </div>

          {/* Form for manual code entry (fallback) */}
          <AnimatePresence>
            {showManualInput && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleManualSubmit}
                className="pt-4 border-t border-gray-100 flex gap-3 overflow-hidden"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="ENTER BARCODE MANUALLY (E.G. 6295556667771)"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-1 focus:ring-black placeholder:text-gray-300"
                    autoFocus
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-black hover:bg-[#C5A059] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Lookup</span>
                  <ArrowRight size={12} />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
