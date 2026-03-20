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
    const load = async () => {
      const [c, cols] = await Promise.all([getCoins(), getCollections()]);
      setCoins(c);
      setCollections(cols);
      setLoading(false);
    };
    load();
  }, []);

  const countries = [...new Set(coins.map(c => c.country).filter(Boolean))].sort();

  let filtered = coins.filter(c => {
    const text = `${c.country} ${c.denomination} ${c.year} ${c.coin_series} ${c.composition}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchCountry = filterCountry === 'all' || c.country === filterCountry;
    return matchSearch && matchCountry;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === 'oldest') return new Date(a.created_date) - new Date(b.created_date);
    if (sortBy === 'year') return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
    if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] mb-4 sm:mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Catalog</h1>

      {/* Search + Filters */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f5f0e8]/25" />
          <Input placeholder="Search coins..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-[#c9a84c]/15 text-[#f5f0e8] h-10 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="flex-1 sm:w-36 bg-white/5 border-[#c9a84c]/15 text-[#f5f0e8] h-10 rounded-xl text-sm">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1525] border-[#c9a84c]/20">
              <SelectItem value="all" className="text-[#f5f0e8]">All Countries</SelectItem>
              {countries.map(c => <SelectItem key={c} value={c} className="text-[#f5f0e8]">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 sm:w-36 bg-white/5 border-[#c9a84c]/15 text-[#f5f0e8] h-10 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1525] border-[#c9a84c]/20">
              <SelectItem value="newest" className="text-[#f5f0e8]">Newest</SelectItem>
              <SelectItem value="oldest" className="text-[#f5f0e8]">Oldest</SelectItem>
              <SelectItem value="year" className="text-[#f5f0e8]">By Year</SelectItem>
              <SelectItem value="country" className="text-[#f5f0e8]">By Country</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-[11px] text-[#f5f0e8]/30 mb-4 font-medium">{filtered.length} coin{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-[#c9a84c]/20" />
          </div>
          <p className="text-[#f5f0e8]/35 text-sm">{coins.length === 0 ? 'No coins in your vault yet' : 'No coins match your filters'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map(coin => {
            const col = collections.find(c => c.id === coin.collection_id);
            return (
              <Link key={coin.id} to={`/coins/${coin.id}`}
                className="group rounded-2xl border border-[#c9a84c]/10 overflow-hidden hover:border-[#c9a84c]/30 transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="aspect-square bg-gradient-to-br from-[#c9a84c]/5 to-[#0a0e1a] flex items-center justify-center overflow-hidden">
                  {coin.obverse_image ? (
                    <img src={coin.obverse_image} alt="" className="w-full h-full object-contain p-3" loading="lazy" />
                  ) : (
                    <Coins className="w-8 h-8 text-[#c9a84c]/15" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</h3>
                  <p className="text-xs text-[#f5f0e8]/35 truncate">{coin.country}</p>
                  {col && <p className="text-[11px] text-[#c9a84c]/40 truncate mt-0.5">{col.name}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}