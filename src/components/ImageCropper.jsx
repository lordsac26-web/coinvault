import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Circle, Square, RotateCcw, RotateCw, Check, X, Crosshair } from 'lucide-react';

const BILL_ASPECT = 2.35; // width / height ratio for banknotes

export default function ImageCropper({ file, onCropped, onCancel, initialShape = 'circle' }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [shape, setShape] = useState(initialShape);
  // crop: { x, y, w, h } in image-space coordinates
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [rotation, setRotation] = useState(0); // degrees: 0, 90, 180, 270
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef(null);
  const lastPinchDist = useRef(null);

  // Get effective image dimensions after rotation
  const getRotatedDims = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { rw: 0, rh: 0 };
    const isRotated = rotation === 90 || rotation === 270;
    return { rw: isRotated ? img.height : img.width, rh: isRotated ? img.width : img.height };
  }, [rotation]);

  // Compute initial crop for current shape/rotation
  const computeInitialCrop = useCallback(() => {
    const { rw, rh } = getRotatedDims();
    if (!rw || !rh) return { x: 0, y: 0, w: 0, h: 0 };
    if (shape === 'rectangle') {
      // Bill: fit widest rectangle with BILL_ASPECT ratio
      let w = rw * 0.9;
      let h = w / BILL_ASPECT;
      if (h > rh * 0.9) { h = rh * 0.9; w = h * BILL_ASPECT; }
      return { x: (rw - w) / 2, y: (rh - h) / 2, w, h };
    }
    // Circle / square: use smaller dimension
    const size = Math.min(rw, rh) * 0.9;
    return { x: (rw - size) / 2, y: (rh - size) / 2, w: size, h: size };
  }, [shape, getRotatedDims]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = URL.createObjectURL(file);
    return () => URL.revokeObjectURL(img.src);
  }, [file]);

  // Reset crop when shape or rotation changes
  useEffect(() => {
    if (imgLoaded) setCrop(computeInitialCrop());
  }, [imgLoaded, shape, rotation, computeInitialCrop]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;

    const { rw, rh } = getRotatedDims();
    const container = containerRef.current;
    const maxW = container?.clientWidth || 400;
    const maxH = 400;
    const scale = Math.min(maxW / rw, maxH / rh, 1);
    canvas.width = rw * scale;
    canvas.height = rh * scale;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw rotated image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
    ctx.restore();

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area
    const sx = crop.x * scale;
    const sy = crop.y * scale;
    const sw = crop.w * scale;
    const sh = crop.h * scale;

    ctx.save();
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(sx + sw / 2, sy + sh / 2, sw / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(sx, sy, sw, sh);
    }
    ctx.clip();
    // Redraw image in clipped area
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width * scale / 2, -img.height * scale / 2, img.width * scale, img.height * scale);
    ctx.restore();

    // Border
    ctx.strokeStyle = '#e8c97a';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(sx + sw / 2, sy + sh / 2, sw / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(sx, sy, sw, sh);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }, [crop, shape, rotation, imgLoaded, getRotatedDims]);

  useEffect(() => { draw(); }, [draw]);

  // Resize helper
  const resizeCrop = useCallback((delta) => {
    const { rw, rh } = getRotatedDims();
    if (!rw) return;
    setCrop(prev => {
      const aspect = prev.w / prev.h;
      const newW = Math.max(50, Math.min(rw, prev.w + delta));
      const newH = newW / aspect;
      if (newH > rh) return prev;
      const cx = prev.x + prev.w / 2;
      const cy = prev.y + prev.h / 2;
      return {
        w: newW, h: newH,
        x: Math.max(0, Math.min(cx - newW / 2, rw - newW)),
        y: Math.max(0, Math.min(cy - newH / 2, rh - newH)),
      };
    });
  }, [getRotatedDims]);

  const snapToEdge = useCallback(() => {
    const { rw, rh } = getRotatedDims();
    if (!rw) return;
    if (shape === 'rectangle') {
      let w = rw;
      let h = w / BILL_ASPECT;
      if (h > rh) { h = rh; w = h * BILL_ASPECT; }
      setCrop({ w, h, x: (rw - w) / 2, y: (rh - h) / 2 });
    } else {
      const size = Math.min(rw, rh);
      setCrop({ w: size, h: size, x: (rw - size) / 2, y: (rh - size) / 2 });
    }
  }, [shape, getRotatedDims]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { rw, rh } = getRotatedDims();
    const scale = Math.min(rect.width / rw, rect.height / rh, 1);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  };

  const handleDown = (e) => {
    if (e.touches && e.touches.length > 1) return;
    e.preventDefault();
    const pos = getPos(e);
    setDragging(true);
    setDragStart({ x: pos.x - crop.x, y: pos.y - crop.y });
  };

  const handleMove = (e) => {
    if (!imgRef.current) return;
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchDist.current !== null) resizeCrop((dist - lastPinchDist.current) * 0.8);
      lastPinchDist.current = dist;
      return;
    }
    if (!dragging) return;
    e.preventDefault();
    const pos = getPos(e);
    const { rw, rh } = getRotatedDims();
    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(pos.x - dragStart.x, rw - prev.w)),
      y: Math.max(0, Math.min(pos.y - dragStart.y, rh - prev.h)),
    }));
  };

  const handleUp = () => { setDragging(false); lastPinchDist.current = null; };

  const handleWheel = (e) => {
    e.preventDefault();
    resizeCrop(e.deltaY > 0 ? -20 : 20);
  };

  const handleRotate = (dir) => {
    setRotation(prev => (prev + dir + 360) % 360);
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    // Draw rotated source into a temp canvas, then extract crop region
    const { rw, rh } = getRotatedDims();
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = rw;
    rotCanvas.height = rh;
    const rctx = rotCanvas.getContext('2d');
    rctx.translate(rw / 2, rh / 2);
    rctx.rotate((rotation * Math.PI) / 180);
    rctx.drawImage(img, -img.width / 2, -img.height / 2);

    const outCanvas = document.createElement('canvas');
    const maxOut = 1200;
    const outScale = Math.min(maxOut / crop.w, maxOut / crop.h, 1);
    outCanvas.width = Math.round(crop.w * outScale);
    outCanvas.height = Math.round(crop.h * outScale);
    const ctx = outCanvas.getContext('2d');

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(outCanvas.width / 2, outCanvas.height / 2, outCanvas.width / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(rotCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, outCanvas.width, outCanvas.height);

    outCanvas.toBlob((blob) => {
      onCropped(new File([blob], file.name || 'cropped.png', { type: 'image/png' }));
    }, 'image/png', 0.92);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => setShape('circle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${shape === 'circle' ? 'bg-[var(--cv-accent)]/15 text-[var(--cv-accent)]' : 'text-[var(--cv-text)]/40 hover:text-[var(--cv-text)]/60'}`}>
            <Circle className="w-3.5 h-3.5" /> Coin
          </button>
          <button onClick={() => setShape('rectangle')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${shape === 'rectangle' ? 'bg-[var(--cv-accent)]/15 text-[var(--cv-accent)]' : 'text-[var(--cv-text)]/40 hover:text-[var(--cv-text)]/60'}`}>
            <Square className="w-3.5 h-3.5" /> Bill
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={() => handleRotate(-90)} title="Rotate left"
            className="p-1.5 text-[var(--cv-text)]/40 hover:text-[var(--cv-accent)] transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleRotate(90)} title="Rotate right"
            className="p-1.5 text-[var(--cv-text)]/40 hover:text-[var(--cv-accent)] transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={snapToEdge} title="Snap to edges"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-[var(--cv-text)]/40 hover:text-[var(--cv-accent)] transition-colors">
            <Crosshair className="w-3.5 h-3.5" /> Snap
          </button>
        </div>
      </div>

      <p className="text-[10px] text-[var(--cv-text)]/30">Drag to position · Scroll or pinch to resize · Rotate with arrows</p>

      <div ref={containerRef} className="flex justify-center rounded-xl overflow-hidden bg-black/20">
        <canvas ref={canvasRef}
          onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
          onTouchStart={handleDown} onTouchMove={handleMove} onTouchEnd={handleUp}
          onWheel={handleWheel} className="max-w-full cursor-move" style={{ touchAction: 'none' }} />
      </div>

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 h-10 rounded-xl gap-1.5 border-[var(--cv-border)] text-[var(--cv-text)]">
          <X className="w-3.5 h-3.5" /> Cancel
        </Button>
        <Button onClick={handleCrop} className="flex-1 h-10 rounded-xl gap-1.5 bg-[var(--cv-accent)] hover:opacity-90 text-[var(--cv-accent-text)]">
          <Check className="w-3.5 h-3.5" /> Apply Crop
        </Button>
      </div>
    </div>
  );
}