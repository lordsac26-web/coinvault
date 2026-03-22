import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Plus, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AlbumSlot({ year, coin, mintMark, collectionId }) {
  const [showReverse, setShowReverse] = useState(false);

  const label = mintMark && mintMark !== 'None' ? `${year}-${mintMark}` : String(year);
  const grade = coin?.user_grade || coin?.ai_grade?.suggested_grade || '';
  const shortGrade = grade ? grade.split(' ')[0] : '';
  const denomination = coin?.denomination || '';
  const hasReverse = coin?.reverse_image || coin?.reverse_thumb;
  const currentImage = showReverse
    ? (coin?.reverse_thumb || coin?.reverse_image)
    : (coin?.obverse_thumb || coin?.obverse_image);

  // Empty slot — white cardboard "add more" insert, links to collection page
  if (!coin) {
    const addLink = collectionId ? `/collections/${collectionId}` : '/dashboard';
    return (
      <Link to={addLink} className="flex flex-col items-center" style={{ perspective: '600px' }}>
        <div
          className="w-full aspect-[3/4] rounded-sm flex flex-col items-center justify-center gap-1.5 relative transition-all hover:border-amber-400 hover:shadow-md cursor-pointer"
          style={{
            background: '#f5f0e8',
            border: '2px solid #e0d8c8',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {/* Simulated cutout circle */}
          <div
            className="w-[60%] aspect-square rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.03)',
              border: '1.5px dashed #ccc5b5',
            }}
          >
            <Plus className="w-4 h-4" style={{ color: '#b0a890' }} />
          </div>
          <span className="text-[8px] sm:text-[9px] font-semibold" style={{ color: '#b0a890' }}>
            ADD
          </span>
          {/* Label strip at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 py-0.5 px-1 text-center"
            style={{
              background: '#ece6d8',
              borderTop: '1px solid #e0d8c8',
            }}
          >
            <span className="text-[7px] sm:text-[8px] font-bold tracking-wide" style={{ color: '#8a8068' }}>
              {label}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Filled slot — white cardboard holder with coin image and flip button
  return (
    <div className="flex flex-col items-center" style={{ perspective: '600px' }}>
      <div
        className="w-full aspect-[3/4] rounded-sm relative overflow-hidden group"
        style={{
          background: '#f5f0e8',
          border: '2px solid #d4cdb8',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {/* Coin image area — circular window */}
        <Link to={`/coins/${coin.id}`} className="block px-1.5 pt-1.5">
          <div
            className="w-full aspect-square rounded-full overflow-hidden mx-auto flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #e8e0d0, #d8d0c0)',
              border: '1.5px solid #ccc5b5',
              maxWidth: '90%',
            }}
          >
            <motion.div
              key={showReverse ? 'rev' : 'obv'}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex items-center justify-center"
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={showReverse ? 'Reverse' : 'Obverse'}
                  className="w-full h-full object-contain rounded-full"
                  loading="lazy"
                />
              ) : (
                <Coins className="w-5 h-5" style={{ color: '#b0a890' }} />
              )}
            </motion.div>
          </div>
        </Link>

        {/* Obv/Rev flip button — top right corner */}
        {hasReverse && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowReverse(prev => !prev);
            }}
            className="absolute top-1 right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-all opacity-60 hover:opacity-100 z-10"
            style={{
              background: showReverse ? '#c9a84c' : '#d4cdb8',
              color: showReverse ? '#fff' : '#7a7060',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
            title={showReverse ? 'Show Obverse' : 'Show Reverse'}
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </button>
        )}

        {/* Info strip at bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 py-0.5 px-1"
          style={{
            background: '#ece6d8',
            borderTop: '1px solid #e0d8c8',
          }}
        >
          <div className="flex items-center justify-between gap-0.5">
            <span className="text-[6px] sm:text-[7px] font-bold truncate" style={{ color: '#6a6050' }}>
              {label}
            </span>
            {shortGrade && (
              <span className="text-[6px] sm:text-[7px] font-bold shrink-0 px-0.5 rounded"
                style={{ background: '#d4cdb8', color: '#5a5040' }}>
                {shortGrade}
              </span>
            )}
          </div>
          {denomination && (
            <p className="text-[5px] sm:text-[6px] truncate leading-tight" style={{ color: '#8a7e68' }}>
              {denomination}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}