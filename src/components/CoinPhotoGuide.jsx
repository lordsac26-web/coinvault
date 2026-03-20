import { useState } from 'react';
import { Camera, Lightbulb, X, ChevronDown, ChevronUp, Smartphone, Sun, Ruler, AlertTriangle, CheckCircle2 } from 'lucide-react';

const tips = [
  { icon: Sun, title: 'Lighting', key: 'lighting', dos: ['Use diffused, natural daylight (overcast sky is ideal)', 'Place coin near a window with indirect light', 'Use a desk lamp at 45° angle with a white sheet of paper to soften it'], donts: ['Direct overhead flash — causes hot spots and washes out details', 'Mixed lighting sources (fluorescent + daylight)', 'Shadows falling across the coin surface'] },
  { icon: Smartphone, title: 'Camera Setup', key: 'camera', dos: ['Hold phone 4–6 inches (10–15 cm) directly above the coin', 'Tap the coin on screen to lock focus before shooting', 'Enable HDR mode if your phone supports it', 'Use the rear camera — much sharper than the selfie camera'], donts: ['Digital zoom — it reduces quality. Move closer instead', 'Shooting at an angle — keep the camera perfectly parallel', 'Shaky hands — rest elbows on the table or use a phone stand'] },
  { icon: Ruler, title: 'Background & Positioning', key: 'background', dos: ['Place coin on a plain, dark, non-reflective surface (black velvet or dark cloth)', 'Center the coin in the frame with a small margin around it', 'Shoot obverse (heads) first, then flip carefully for reverse'], donts: ['Patterned or shiny backgrounds that compete with the coin', 'Touching the coin face with fingers — use cotton gloves or hold by edges', 'Cropping too tight — leave room around the coin'] },
];

export default function CoinPhotoGuide({ onClose }) {
  const [expandedTip, setExpandedTip] = useState('lighting');
  const toggle = (key) => setExpandedTip(k => k === key ? null : key);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--cv-accent-border)', background: 'var(--cv-accent-bg)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cv-accent-border)' }}>
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
          <h4 className="text-sm font-semibold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Coin Photography Tips</h4>
        </div>
        {onClose && <button onClick={onClose} className="transition-colors" style={{ color: 'var(--cv-text-muted)' }}><X className="w-4 h-4" /></button>}
      </div>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--cv-border)' }}>
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-secondary)' }}>Better photos = better AI grading results. Diffused light, steady hands, and a dark background make the biggest difference.</p>
        </div>
      </div>
      <div>
        {tips.map(({ icon: Icon, title, key, dos, donts }) => {
          const isOpen = expandedTip === key;
          return (
            <div key={key} style={{ borderBottom: '1px solid var(--cv-border)' }}>
              <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" style={{ color: 'var(--cv-accent-dim)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>{title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--cv-text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--cv-text-muted)' }} />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-green-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Do</p>
                    <ul className="space-y-1.5">{dos.map((tip, i) => <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--cv-text-secondary)' }}><span className="text-green-400 mt-0.5 shrink-0">✓</span>{tip}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-1.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Don&apos;t</p>
                    <ul className="space-y-1.5">{donts.map((tip, i) => <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--cv-text-secondary)' }}><span className="text-red-400 mt-0.5 shrink-0">✗</span>{tip}</li>)}</ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--cv-text-muted)' }}>
          <strong style={{ color: 'var(--cv-accent-dim)' }}>Pro tip:</strong> For valuable coins, consider a copy stand or smartphone macro lens attachment (~$15) for consistently sharp results.
        </p>
      </div>
    </div>
  );
}