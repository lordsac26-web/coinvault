import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import AlbumSlot from './AlbumSlot';

// Build a slot map: for each year in range, check if we have a coin
function buildSlots(coins, yearStart, yearEnd, mintMarks) {
  const slots = [];
  for (let y = yearStart; y <= yearEnd; y++) {
    const yearStr = String(y);
    if (mintMarks && mintMarks.length > 0) {
      for (const mm of mintMarks) {
        const match = coins.find(c => c.year === yearStr && normMint(c.mint_mark) === mm);
        slots.push({ year: yearStr, mintMark: mm, coin: match || null });
      }
    } else {
      const match = coins.find(c => c.year === yearStr);
      slots.push({ year: yearStr, mintMark: null, coin: match || null });
    }
  }
  return slots;
}

function normMint(m) {
  if (!m || m === 'None' || m.toLowerCase().includes('none') || m.toLowerCase().includes('philadelphia')) return 'P';
  // Extract just the letter(s) from strings like "D (Denver)" or "S"
  const letter = m.match(/^([A-Z])/)?.[1];
  return letter || m;
}

export default function AlbumSeriesRow({ seriesName, coins, yearRange, mintMarks }) {
  const [expanded, setExpanded] = useState(true);

  const slots = useMemo(
    () => buildSlots(coins, yearRange[0], yearRange[1], mintMarks),
    [coins, yearRange, mintMarks]
  );

  const filled = slots.filter(s => s.coin).length;
  const total = slots.length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return (
    <div
      className="rounded-2xl overflow-hidden mb-4"
      style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:opacity-80"
        style={{ background: 'var(--cv-bg-elevated)' }}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--cv-accent)' }} />
        ) : (
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--cv-accent)' }} />
        )}
        <div className="flex-1 min-w-0 text-left">
          <h3
            className="text-sm sm:text-base font-bold truncate"
            style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {seriesName}
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>
            {yearRange[0]}–{yearRange[1]} · {filled}/{total} collected
          </p>
        </div>
        {/* Progress ring */}
        <div className="shrink-0 flex items-center gap-2">
          {pct === 100 && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                style={{ stroke: 'var(--cv-border)' }} />
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                strokeDasharray={`${pct * 0.975} 100`}
                strokeLinecap="round"
                style={{ stroke: pct === 100 ? '#4ade80' : 'var(--cv-accent)' }} />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
              style={{ color: 'var(--cv-text-secondary)' }}
            >
              {pct}%
            </span>
          </div>
        </div>
      </button>

      {/* Slot grid */}
      {expanded && (
        <div className="p-3 sm:p-4">
          <div className="grid gap-2" style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
          }}>
            {slots.map((slot, i) => (
              <AlbumSlot
                key={`${slot.year}-${slot.mintMark || ''}-${i}`}
                year={slot.year}
                mintMark={slot.mintMark}
                coin={slot.coin}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}