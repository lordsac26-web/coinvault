import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoins, getCollections } from '../lib/storage';
import { Search, Loader2 } from 'lucide-react';

export default function Catalog() {
  const [coins, setCoins] = useState([]);
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [c, col] = await Promise.all([getCoins(), getCollections()]);
      setCoins(c);
      setCollections(col);
      setLoading(false);
    })();
  }, []);

  const filtered = coins.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || [c.denomination, c.year, c.country, c.mint_mark, c.user_grade, c.coin_series].some(v => v?.toLowerCase().includes(q));
    const matchCountry = !filterCountry || c.country?.includes(filterCountry);
    const matchGrade = !filterGrade || c.user_grade?.startsWith(filterGrade);
    return matchSearch && matchCountry && matchGrade;
  });

  const getCollectionName = (colId) => collections.find(c => c.id === colId)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Catalog</h1>
        <p className="text-sm text-[#f5f0e8]/40 mt-1">All coins across all collections</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f5f0e8]/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all coins..."
            className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg pl-9 pr-3 py-2 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/50" />
        </div>
        <input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="Filter by country..."
          className="bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/50 w-40" />
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
          className="bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2 text-sm text-[#f5f0e8] focus:outline-none">
          <option value="">All Grades</option>
          <option value="MS">Mint State (MS)</option>
          <option value="PF">Proof (PF)</option>
          <option value="AU">About Unc (AU)</option>
          <option value="EF">Extremely Fine (EF)</option>
          <option value="VF">Very Fine (VF)</option>
          <option value="F-">Fine &amp; below</option>
        </select>
      </div>

      <p className="text-xs text-[#f5f0e8]/30 mb-4">{filtered.length} coin{filtered.length !== 1 ? 's' : ''}</p>

      {coins.length === 0 ? (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-[#f5f0e8]/40 text-sm">No coins in your catalog yet. Add coins to your collections to see them here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-[#f5f0e8]/40 text-sm">No coins match your search.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#c9a84c]/15 bg-white/[0.02]">
                  {['', 'Year', 'Denomination', 'Country', 'Mint', 'Grade', 'Paid', 'Collection'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-[#f5f0e8]/40 font-medium uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(coin => (
                  <tr key={coin.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/coins/${coin.id}`)}>
                    <td className="px-4 py-3">
                      {coin.obverse_image ? (
                        <img src={coin.obverse_image} alt="" className="w-8 h-8 rounded-full object-cover border border-[#c9a84c]/30" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border border-[#c9a84c]/20 bg-white/5 flex items-center justify-center">
                          <span className="text-[9px] text-[#c9a84c]/50">{coin.year?.slice(-2)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#f5f0e8]">{coin.year || '?'}</td>
                    <td className="px-4 py-3 text-[#f5f0e8]/70">{coin.denomination}</td>
                    <td className="px-4 py-3 text-[#f5f0e8]/50">{coin.country}</td>
                    <td className="px-4 py-3 text-[#f5f0e8]/50">{coin.mint_mark !== 'None' ? coin.mint_mark : '\u2014'}</td>
                    <td className="px-4 py-3">
                      {coin.user_grade && (
                        <span className="text-xs bg-[#c9a84c]/15 text-[#e8c97a] px-2 py-0.5 rounded font-medium">{coin.user_grade}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#f5f0e8]/50">{coin.purchase_price ? `$${coin.purchase_price}` : '\u2014'}</td>
                    <td className="px-4 py-3 text-[#f5f0e8]/40 text-xs">{getCollectionName(coin.collection_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}