import AlbumSlot from './AlbumSlot';

const COLS = 4;
const ROWS = 5;
export const SLOTS_PER_PAGE = COLS * ROWS;

export default function AlbumPage({ slots, seriesName, pageNumber, totalPages, collectionId }) {
  // Pad to exactly 20 slots
  const padded = [...slots];
  while (padded.length < SLOTS_PER_PAGE) {
    padded.push({ year: '—', mintMark: null, coin: null, isEmpty: true });
  }

  return (
    <div
      className="w-full h-full rounded-sm overflow-hidden flex flex-col select-none"
      style={{
        background: 'linear-gradient(180deg, #4a7c4a 0%, #3d6b3d 100%)',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)',
        padding: '10px',
      }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h3 className="text-[10px] sm:text-xs font-bold tracking-wide truncate"
          style={{ color: '#d4e8c4', fontFamily: "'Playfair Display', Georgia, serif" }}>
          {seriesName}
        </h3>
        <span className="text-[8px] sm:text-[9px] font-medium shrink-0"
          style={{ color: 'rgba(212,232,196,0.6)' }}>
          {pageNumber}/{totalPages}
        </span>
      </div>

      {/* Clear plastic binder page simulation */}
      <div
        className="flex-1 rounded-sm p-1.5 sm:p-2"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(1px)',
        }}
      >
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 h-full"
          style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
          {padded.map((slot, i) => (
            <AlbumSlot
              key={`${slot.year}-${slot.mintMark || ''}-${i}`}
              year={slot.year}
              mintMark={slot.mintMark}
              coin={slot.coin}
              collectionId={collectionId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}