import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AlbumPage from './AlbumPage';

// Book-flip animation variants
const pageVariants = {
  enterFromRight: {
    rotateY: 90,
    opacity: 0,
    transformOrigin: 'left center',
  },
  enterFromLeft: {
    rotateY: -90,
    opacity: 0,
    transformOrigin: 'right center',
  },
  center: {
    rotateY: 0,
    opacity: 1,
    transformOrigin: 'center center',
  },
  exitToLeft: {
    rotateY: -90,
    opacity: 0,
    transformOrigin: 'right center',
  },
  exitToRight: {
    rotateY: 90,
    opacity: 0,
    transformOrigin: 'left center',
  },
};

const pageTransition = {
  type: 'tween',
  duration: 0.5,
  ease: [0.4, 0.0, 0.2, 1],
};

export default function AlbumBook({ pages, seriesName }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(1); // 1=forward, -1=backward

  const totalPages = pages.length;
  if (totalPages === 0) return null;

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Book container with perspective */}
      <div className="w-full" style={{ perspective: '1200px' }}>
        {/* Binder rings / spine decoration */}
        <div
          className="w-full rounded-xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #2d1f0e 0%, #3a2815 50%, #2d1f0e 100%)',
            border: '2px solid #4a3520',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.05)',
            padding: '8px',
          }}
        >
          {/* Binder rings along left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-4 flex flex-col items-center justify-around py-6 z-10"
            style={{ background: 'linear-gradient(180deg, #3a2815, #2a1a0a, #3a2815)' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-4 sm:w-2.5 sm:h-5 rounded-full"
                style={{
                  background: 'linear-gradient(180deg, #c0c0c0, #909090)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }} />
            ))}
          </div>

          {/* Page area */}
          <div className="ml-3 sm:ml-4 relative" style={{ minHeight: '420px' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                variants={pageVariants}
                initial={direction > 0 ? 'enterFromRight' : 'enterFromLeft'}
                animate="center"
                exit={direction > 0 ? 'exitToLeft' : 'exitToRight'}
                transition={pageTransition}
                className="w-full h-full"
                style={{ minHeight: '420px' }}
              >
                <AlbumPage
                  slots={pages[currentPage]}
                  seriesName={seriesName}
                  pageNumber={currentPage + 1}
                  totalPages={totalPages}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      {totalPages > 1 && (
        <div className="flex items-center gap-4">
          <button
            onClick={goPrev}
            disabled={currentPage === 0}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{
              background: 'var(--cv-bg-elevated)',
              border: '1px solid var(--cv-accent-border)',
              color: 'var(--cv-accent)',
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentPage ? 1 : -1);
                  setCurrentPage(i);
                }}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === currentPage ? 'var(--cv-accent)' : 'var(--cv-border)',
                  transform: i === currentPage ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={currentPage === totalPages - 1}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-20"
            style={{
              background: 'var(--cv-bg-elevated)',
              border: '1px solid var(--cv-accent-border)',
              color: 'var(--cv-accent)',
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}