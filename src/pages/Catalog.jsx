import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCoins, getCollections } from '@/components/storage';
import { Coins } from 'lucide-react';
import { PageLoader } from './Dashboard';
import CoinFilterBar from '@/components/CoinFilterBar';

export default function Catalog() {
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ search: '', activeFilterCount: 0 });

  useEffect(() => {
    const load = async () => {
      const [c, cols] = await Promise.all([getCoins(), getCollections()]);
      setCoins(c);
      setCollections(cols);
      setLoading(false);
    };
    load();
  }, []);

  const handleFiltered = useCallback((result, meta) => {
    setFiltered(result);
    setFilterMeta(meta);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1
        className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
        style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Catalog
      </h1>

      <CoinFilterBar coins={coins} collections={collections} onFiltered={handleFiltered} />

      <p className="text-[11px] mb-4 font-medium" style={{ color: 'var(--cv-text-muted)' }}>
        {filtered.length} coin{filtered.length !== 1 ? 's' : ''}
        {(filterMeta.search || filterMeta.activeFilterCount > 0) && <span> · filtered</span>}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--cv-accent-bg)' }}
          >
            <Coins className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            {coins.length === 0 ? 'No coins in your vault yet' : 'No coins match your filters'}
          </p>
          {/* FIX: Clear filters button when filtered results are empty */}
          {coins.length > 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--cv-text-faint)' }}>
            Try adjusting your filters
          </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map(coin => {
            const col = collections.find(c => c.id === coin.collection_id);
            return (
              <Link
                key={coin.id}
                to={`/coins/${coin.id}`}
                className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
                style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
              >
                <div
                  className="aspect-square flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, var(--cv-gradient-from), var(--cv-gradient-to))`,
                  }}
                >
                  {coin.obverse_image ? (
                    <img
                      src={coin.obverse_thumb || coin.obverse_image}
                      alt={`${coin.year} ${coin.denomination}`}
                      className="w-full h-full object-contain p-3"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <Coins className="w-8 h-8" style={{ color: 'var(--cv-text-faint)' }} />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" style={{ color: 'var(--cv-text)' }}>
                    {coin.year} {coin.denomination}
                  </h3>
                  <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>
                    {coin.country}
                  </p>
                  {col && (
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--cv-text-faint)' }}>
                      {col.name}
                    </p>
                  )}
                  {/* FIX: Show grade badge on catalog card if available */}
                  {(coin.user_grade || coin.ai_grade) && (
                    <span
                      className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1"
                      style={{
                        background: 'var(--cv-accent-bg)',
                        color: 'var(--cv-accent)',
                        border: '1px solid var(--cv-accent-border)',
                      }}
                    >
                      {coin.user_grade || coin.ai_grade}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}