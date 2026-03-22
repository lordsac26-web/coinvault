import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Coins } from 'lucide-react';
import { getCoins, getCollections } from '@/components/storage';

export default function GlobalSearch({ compact = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Load data on first open
  useEffect(() => {
    if (open && !loaded) {
      Promise.all([getCoins(), getCollections()]).then(([c, cols]) => {
        setCoins(c);
        setCollections(cols);
        setLoaded(true);
      });
    }
  }, [open, loaded]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();

    const matchedCollections = collections.filter(c =>
      [c.name, c.description, c.type, ...(c.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(q)
    ).map(c => ({ type: 'collection', id: c.id, label: c.name, sub: c.type, image: c.cover_image }));

    const matchedCoins = coins.filter(c => {
      const col = collections.find(col => col.id === c.collection_id);
      return [c.country, c.denomination, c.year, c.coin_series, c.composition, c.mint_mark, c.personal_notes, c.set_name, col?.name]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    }).map(c => ({
      type: 'coin', id: c.id,
      label: c.set_name || `${c.year || ''} ${c.denomination || ''}`.trim() || 'Coin',
      sub: [c.country, c.coin_series].filter(Boolean).join(' · '),
      image: c.obverse_image,
    }));

    setResults([...matchedCollections.slice(0, 3), ...matchedCoins.slice(0, 8)]);
  }, [query, coins, collections]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);

  const handleSelect = useCallback((item) => {
    setOpen(false);
    setQuery('');
    if (item.type === 'collection') navigate(`/collections/${item.id}`);
    else navigate(`/coins/${item.id}`);
  }, [navigate]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg transition-all"
        style={compact
          ? { padding: '6px', color: 'var(--cv-text-muted)' }
          : { padding: '5px 12px', background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text-muted)' }
        }
      >
        <Search className="w-4 h-4" />
        {!compact && (
          <>
            <span className="text-xs">Search...</span>
            <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded ml-2"
              style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)', color: 'var(--cv-text-faint)' }}>
              ⌘K
            </kbd>
          </>
        )}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={() => setOpen(false)} />

      {/* Search panel */}
      <div ref={containerRef} className="fixed top-0 left-0 right-0 z-[61] flex justify-center pt-[10vh] px-4">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
          <div className="flex items-center gap-3 px-4 h-12" style={{ borderBottom: '1px solid var(--cv-border)' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--cv-text-faint)' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search coins, collections, series..."
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: 'var(--cv-text)' }}
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1" style={{ color: 'var(--cv-text-faint)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)', color: 'var(--cv-text-faint)' }}>
              ESC
            </kbd>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No results for "{query}"</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="py-2">
                {results.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:brightness-110"
                    style={{ background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cv-accent-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                      style={{ background: 'var(--cv-bg-card)', border: '1px solid var(--cv-border)' }}>
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Coins className="w-4 h-4" style={{ color: 'var(--cv-text-faint)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--cv-text)' }}>{item.label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>
                        {item.type === 'collection' ? '📁 Collection' : '🪙 Coin'}{item.sub ? ` · ${item.sub}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query.trim() && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>
                  Search by name, year, country, series, denomination, or notes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}