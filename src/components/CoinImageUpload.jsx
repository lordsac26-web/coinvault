import { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

export default function CoinImageUpload({ label, value, onChange }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e) => processFile(e.target.files[0]);

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-widest">{label}</p>

      <div
        className={`relative w-48 h-48 rounded-full cursor-pointer transition-all ${dragging ? 'scale-105' : ''}`}
        style={{
          border: `2px dashed ${value ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.35)'}`,
          boxShadow: value ? '0 0 0 4px rgba(201,168,76,0.12), 0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.3)',
          background: value ? 'transparent' : 'rgba(201,168,76,0.04)',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current.click()}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover rounded-full" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Coin silhouette */}
            <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c]/30 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-[#c9a84c]/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#c9a84c]/20" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-4 h-4 text-[#c9a84c]/60" />
              <span className="text-[10px] text-[#f5f0e8]/40 text-center px-4">Drop or tap to upload</span>
            </div>
          </div>
        )}

        {/* Camera icon overlay on hover */}
        {value && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-[#e8c97a]" />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*;capture=camera"
        className="hidden"
        onChange={handleChange}
      />

      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(null); }}
          className="text-xs text-[#f5f0e8]/30 hover:text-red-400 transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}