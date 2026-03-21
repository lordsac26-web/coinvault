import { Link } from 'react-router-dom';
import { Circle } from 'lucide-react';

export default function AlbumSlot({ year, coin, mintMark }) {
  const label = mintMark && mintMark !== 'None' ? `${year}-${mintMark}` : year;

  if (!coin) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl aspect-square p-1 transition-all"
        style={{
          background: 'var(--cv-bg)',
          border: '2px dashed var(--cv-border)',
          opacity: 0.45,
        }}
      >
        <Circle className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: 'var(--cv-text-faint)' }} />
        <span className="text-[9px] sm:text-[10px] font-medium mt-1 leading-none" style={{ color: 'var(--cv-text-faint)' }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <Link
      to={`/coins/${coin.id}`}
      className="flex flex-col items-center justify-center rounded-xl aspect-square p-1 transition-all hover:scale-105 active:scale-95 group relative"
      style={{
        background: 'var(--cv-bg-card)',
        border: '2px solid var(--cv-accent)',
        boxShadow: '0 0 8px var(--cv-accent-border)',
      }}
    >
      {coin.obverse_image ? (
        <img
          src={coin.obverse_thumb || coin.obverse_image}
          alt=""
          className="w-full h-full object-contain rounded-lg p-0.5"
          loading="lazy"
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--cv-accent-bg)' }}
        >
          <Circle className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
        </div>
      )}
      <span
        className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] sm:text-[9px] font-bold leading-none"
        style={{ color: 'var(--cv-accent)' }}
      >
        {label}
      </span>
      {coin.user_grade && (
        <span
          className="absolute top-0.5 right-0.5 text-[7px] font-bold px-1 rounded"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
        >
          {coin.user_grade.split(' ')[0]}
        </span>
      )}
    </Link>
  );
}