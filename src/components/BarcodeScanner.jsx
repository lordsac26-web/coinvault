import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Loader2, ScanLine, Flashlight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scannerRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {}
  }, [torchOn]);

  useEffect(() => {
    let cancelled = false;

    const startScanning = async () => {
      // Check for BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setError('Your browser does not support barcode scanning. Please use Chrome or Safari on your mobile device.');
        setStarting(false);
        return;
      }

      try {
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix', 'pdf417'],
        });
        scannerRef.current = detector;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        if (caps?.torch) setTorchSupported(true);

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStarting(false);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const scan = async () => {
          if (cancelled || !video || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          try {
            const barcodes = await detector.detect(canvas);
            if (barcodes.length > 0 && !cancelled) {
              const code = barcodes[0];
              stopCamera();
              onDetected({ rawValue: code.rawValue, format: code.format });
              return;
            }
          } catch {}

          rafRef.current = requestAnimationFrame(scan);
        };

        rafRef.current = requestAnimationFrame(scan);
      } catch (err) {
        if (!cancelled) {
          console.error('Camera access failed:', err);
          setError('Could not access your camera. Please allow camera permissions and try again.');
          setStarting(false);
        }
      }
    };

    startScanning();
    return () => { cancelled = true; stopCamera(); };
  }, [onDetected, stopCamera]);

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 relative z-10" style={{ background: 'rgba(0,0,0,0.6)' }}>
        <h2 className="text-sm font-semibold text-white">Scan Barcode / QR Code</h2>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button onClick={toggleTorch}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: torchOn ? 'var(--cv-accent)' : 'rgba(255,255,255,0.15)' }}>
              <Flashlight className="w-4 h-4 text-white" />
            </button>
          )}
          <button onClick={() => { stopCamera(); onClose(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video feed */}
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning overlay */}
        {!error && !starting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 sm:w-72 sm:h-72 relative">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: 'var(--cv-accent, #e8c97a)' }} />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: 'var(--cv-accent, #e8c97a)' }} />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: 'var(--cv-accent, #e8c97a)' }} />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: 'var(--cv-accent, #e8c97a)' }} />
              {/* Animated scan line */}
              <div className="absolute left-2 right-2 h-0.5 animate-pulse" style={{
                background: 'var(--cv-accent, #e8c97a)',
                top: '50%',
                boxShadow: '0 0 12px var(--cv-accent, #e8c97a)',
              }} />
            </div>
          </div>
        )}

        {/* Starting state */}
        {starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <p className="text-sm text-white/70">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8" style={{ background: 'rgba(0,0,0,0.85)' }}>
            <Camera className="w-12 h-12 text-white/30" />
            <p className="text-sm text-center text-white/70">{error}</p>
            <Button onClick={() => { stopCamera(); onClose(); }}
              className="rounded-xl" style={{ background: 'var(--cv-accent-dim, #c9a84c)', color: '#000' }}>
              Go Back
            </Button>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {!error && !starting && (
        <div className="px-4 py-4 text-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <p className="text-xs text-white/60">
            Point your camera at a PCGS, NGC, or ANACS barcode or QR code
          </p>
        </div>
      )}
    </div>
  );
}