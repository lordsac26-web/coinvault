import { useState } from 'react';
import { Camera, Lightbulb, X, ChevronDown, ChevronUp, Smartphone, Sun, Ruler, AlertTriangle, CheckCircle2 } from 'lucide-react';

const tips = [
  {
    icon: Sun,
    title: 'Lighting',
    key: 'lighting',
    dos: [
      'Use diffused, natural daylight (overcast sky is ideal)',
      'Place coin near a window with indirect light',
      'Use a desk lamp at 45° angle with a white sheet of paper to soften it',
    ],
    donts: [
      'Direct overhead flash — causes hot spots and washes out details',
      'Mixed lighting sources (fluorescent + daylight)',
      'Shadows falling across the coin surface',
    ],
  },
  {
    icon: Smartphone,
    title: 'Camera Setup',
    key: 'camera',
    dos: [
      'Hold phone 4–6 inches (10–15 cm) directly above the coin',
      'Tap the coin on screen to lock focus before shooting',
      'Enable HDR mode if your phone supports it',
      'Use the rear camera — it's much sharper than the selfie camera',
    ],
    donts: [
      'Digital zoom — it reduces quality. Move closer instead',
      'Shooting at an angle — keep the camera perfectly parallel',
      'Shaky hands — rest elbows on the table or use a phone stand',
    ],
  },
  {
    icon: Ruler,
    title: 'Background & Positioning',
    key: 'background',
    dos: [
      'Place coin on a plain, dark, non-reflective surface (black velvet or dark cloth)',
      'Center the coin in the frame with a small margin around it',
      'Shoot obverse (heads) first, then flip carefully for reverse',
    ],
    donts: [
      'Patterned or shiny backgrounds that compete with the coin',
      'Touching the coin face with fingers — use cotton gloves or hold by edges',
      'Cropping too tight — leave room around the coin',
    ],
  },
];

export default function CoinPhotoGuide({ onClose }) {
  const [expandedTip, setExpandedTip] = useState('lighting');

  const toggle = (key) => setExpandedTip(k => k === key ? null : key);

  return (
    <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(201,168,76,0.03)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a84c]/15">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#e8c97a]" />
          <h4 className="text-sm font-semibold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Coin Photography Tips
          </h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#f5f0e8]/30 hover:text-[#f5f0e8]/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick summary */}
      <div className="px-4 py-3 border-b border-[#c9a84c]/10">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-[#f5f0e8]/60 leading-relaxed">
            Better photos = better AI grading results. Diffused light, steady hands, and a dark background make the biggest difference.
          </p>
        </div>
      </div>

      {/* Expandable tips */}
      <div className="divide-y divide-[#c9a84c]/10">
        {tips.map(({ icon: Icon, title, key, dos, donts }) => {
          const isOpen = expandedTip === key;
          return (
            <div key={key}>
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[#c9a84c]" />
                  <span className="text-sm font-medium text-[#f5f0e8]/80">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#f5f0e8]/30" /> : <ChevronDown className="w-4 h-4 text-[#f5f0e8]/30" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-green-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Do
                    </p>
                    <ul className="space-y-1.5">
                      {dos.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#f5f0e8]/60">
                          <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Don't
                    </p>
                    <ul className="space-y-1.5">
                      {donts.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#f5f0e8]/60">
                          <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pro tips footer */}
      <div className="px-4 py-3 border-t border-[#c9a84c]/10 bg-white/[0.01]">
        <p className="text-[10px] text-[#f5f0e8]/30 leading-relaxed">
          <strong className="text-[#c9a84c]/60">Pro tip:</strong> For valuable coins, consider a copy stand or smartphone macro lens attachment (~$15) for consistently sharp, professional results.
        </p>
      </div>
    </div>
  );
}