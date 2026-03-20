import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoins, getCollections } from '@/components/storage';
import { Search, Coins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Catalog() {
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const load = async () => { const [c, cols] = await Promise.all([getCoins(), getCollections()]); setCoins(c); setCollections(cols); setLoading(false); };
    load();
  }, []);

  const countries = [...new Set(coins.map(c => c.country).filter(Boolean))].sort();
  let filtered = coins.filter(c => {
    const text = `${c.country} ${c.denomination} ${c.year} ${c.coin_series} ${c.composition}`.toLowerCase();
    return (!search || text.includes(search.toLowerCase())) && (filterCountry === 'all' || c.country === filterCountry);
  });
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === 'year') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
    if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
    return 0;
  });

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Catalog</h1>
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--cv-text-faint)' }} />
          <Input placeholder="Search coins..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
        </div>
        <div className="flex gap-2">
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="flex-1 sm:w-36 h-10 rounded-xl text-sm" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
              <SelectItem value="all" style={{ color: 'var(--cv-text)' }}>All Countries</SelectItem>
              {countries.map(c => <SelectItem key={c} value={c} style={{ color: 'var(--cv-text)' }}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 sm:w-36 h-10 rounded-xl text-sm" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
              {[['newest','Newest'],['oldest','Oldest'],['year','By Year'],['country','By Country']].map(([v,l]) => <SelectItem key={v} value={v} style={{ color: 'var(--cv-text)' }}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-[11px] mb-4 font-medium" style={{ color: 'var(--cv-text-muted)' }}>{filtered.length} coin{filtered.length !== 1 ? 's' : ''}</p>
      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}><Coins className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} /></div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>{coins.length === 0 ? 'No coins in your vault yet' : 'No coins match your filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map(coin => {
            const col = collections.find(c => c.id === coin.collection_id);
            return (
              <Link key={coin.id} to={`/coins/${coin.id}`} className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
                <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, var(--cv-gradient-from), var(--cv-gradient-to))` }}>
                  {coin.obverse_image ? <img src={coin.obverse_image} alt="" className="w-full h-full object-contain p-3" loading="lazy" /> : <Coins className="w-8 h-8" style={{ color: 'var(--cv-text-faint)' }} />}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" style={{ color: 'var(--cv-text)' }}>{coin.year} {coin.denomination}</h3>
                  <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>{coin.country}</p>
                  {col && <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--cv-text-faint)' }}>{col.name}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}