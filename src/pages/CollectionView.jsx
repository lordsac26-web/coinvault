import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Grid3X3, List, BookOpen, Search } from 'lucide-react';
import { getCollections, getCoinsByCollection, deleteCoin } from '../lib/storage';
import AddCoinWizard from '../components/AddCoinWizard';

const GradeBadge = ({ grade }) => {
  if (!grade) return null;
  const isMS = grade.startsWith('MS');
  const isPF = grade.startsWith('PF');
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isMS || isPF ? 'bg-[#c9a84c]/20 text-[#e8c97a]' : 'bg-white/10 text-[#f5f0e8]/60'}`}>
      {grade}
    </span>
  );
};

const CoinCircle = ({ coin, onClick }) => (
  <div
    className="group relative cursor-pointer"
    onClick={onClick}
    style={{ transition: 'transform 0.2s' }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div className="w-full aspect-square rounded-full overflow-hidden relative"
      style={{
        border: '2px solid rgba(201,168,76,0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.1)',
        background: 'rgba(255,255,255,0.03)',
      }}>
      {coin.obverseImage ? (
        <img src={coin.obverseImage} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs font-bold text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {coin.year || '?'}
            </p>
            <p className="text-[9px] text-[#f5f0e8]/40 mt-0.5 px-1 truncate">{coin.denomination?.slice(0, 10)}</p>
          </div>
        </div>
      )}
      {/* Grade badge overlay */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <GradeBadge grade={coin.userGrade} />
      </div>
    </div>
    <p className="text-center text-[10px] text-[#f5f0e8]/40 mt-1.5 truncate">{coin.year} {coin.mintMark !== 'None' ? coin.mintMark : ''}</p>
  </div>
);

export default function CollectionView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [coins, setCoins] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [showAddCoin, setShowAddCoin] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const load = () => {
    const cols = getCollections();
    const col = cols.find(c => c.id === id);
    setCollection(col || null);
    setCoins(getCoinsByCollection(id));
  };

  useEffect(() => { load(); }, [id]);

  if (!collection) return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-center">
      <p className="text-[#f5f0e8]/40">Collection not found.</p>
      <Link to="/collections" className="text-[#e8c97a] text-sm mt-2 inline-block hover:underline">← Back to Collections</Link>
    </div>
  );

  const filtered = coins
    .filter(c => !search || [c.denomination, c.year, c.country, c.mintMark, c.userGrade].some(v => v?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      if (sortBy === 'year') return parseInt(a.year) - parseInt(b.year);
      if (sortBy === 'grade') return (b.userGrade || '').localeCompare(a.userGrade || '');
      if (sortBy === 'value') return (parseFloat(b.purchasePrice) || 0) - (parseFloat(a.purchasePrice) || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalValue = coins.reduce((s, c) => s + (parseFloat(c.purchasePrice) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {collection.name}
            </h1>
            {collection.description && <p className="text-sm text-[#f5f0e8]/40 mt-1">{collection.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-xs text-[#f5f0e8]/40">
              <span>{coins.length} coins</span>
              {totalValue > 0 && <span className="text-[#c9a84c]">${totalValue.toLocaleString()} paid</span>}
              <span>{collection.type}</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddCoin(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity shrink-0">
            <Plus className="w-4 h-4" /> Add Coin
          </button>
        </div>

        {/* Goal progress */}
        {collection.targetGoal && (
          <div className="mt-3 p-3 rounded-xl border border-[#c9a84c]/20 bg-[#c9a84c]/5">
            <p className="text-xs text-[#c9a84c] mb-1.5">Goal: {collection.targetGoal}</p>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] rounded-full" style={{ width: `${Math.min((coins.length / 50) * 100, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#f5f0e8]/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search coins..."
            className="w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg pl-9 pr-3 py-2 text-sm text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/50" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2 text-sm text-[#f5f0e8] focus:outline-none">
          <option value="date">Sort: Newest</option>
          <option value="year">Sort: Year</option>
          <option value="grade">Sort: Grade</option>
          <option value="value">Sort: Value</option>
        </select>
        <div className="flex rounded-lg border border-[#c9a84c]/20 overflow-hidden">
          {[['grid', Grid3X3], ['list', List], ['binder', BookOpen]].map(([mode, Icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`p-2 transition-colors ${viewMode === mode ? 'bg-[#c9a84c]/20 text-[#e8c97a]' : 'bg-white/5 text-[#f5f0e8]/40 hover:text-[#f5f0e8]/70'}`}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {coins.length === 0 && (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-20 h-20 mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#c9a84c]/30" />
            <div className="absolute inset-3 rounded-full border border-[#c9a84c]/20" />
          </div>
          <h3 className="text-lg font-semibold text-[#f5f0e8]/50 mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Your collection awaits — add your first coin
          </h3>
          <p className="text-sm text-[#f5f0e8]/30 mb-5">Add photos to unlock AI grading</p>
          <button onClick={() => setShowAddCoin(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90">
            + Add First Coin
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filtered.map(coin => (
            <CoinCircle key={coin.id} coin={coin} onClick={() => navigate(`/coins/${coin.id}`)} />
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="rounded-2xl border border-[#c9a84c]/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#c9a84c]/15 bg-white/[0.02]">
                {['Year', 'Mint', 'Denomination', 'Grade', 'Paid', 'Date Added', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-[#f5f0e8]/40 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(coin => (
                <tr key={coin.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/coins/${coin.id}`)}>
                  <td className="px-4 py-3 text-[#f5f0e8]">{coin.year || '?'}</td>
                  <td className="px-4 py-3 text-[#f5f0e8]/60">{coin.mintMark !== 'None' ? coin.mintMark : '—'}</td>
                  <td className="px-4 py-3 text-[#f5f0e8]/70">{coin.denomination}</td>
                  <td className="px-4 py-3"><GradeBadge grade={coin.userGrade} /></td>
                  <td className="px-4 py-3 text-[#f5f0e8]/60">{coin.purchasePrice ? `$${coin.purchasePrice}` : '—'}</td>
                  <td className="px-4 py-3 text-[#f5f0e8]/40">{new Date(coin.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-[#c9a84c]/60 hover:text-[#c9a84c]">View →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* BINDER VIEW */}
      {viewMode === 'binder' && (
        <div className="rounded-2xl border border-[#c9a84c]/20 p-8" style={{ background: 'rgba(10,15,30,0.8)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-[#c9a84c] to-[#e8c97a] rounded-full" />
            <h3 className="text-base font-semibold text-[#f5f0e8]/60" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {collection.name} — Binder View
            </h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {filtered.map(coin => (
              <div key={coin.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(`/coins/${coin.id}`)}>
                <div className="w-full aspect-square rounded-full overflow-hidden transition-all hover:scale-105"
                  style={{ border: '2px solid rgba(201,168,76,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', background: 'rgba(255,255,255,0.03)' }}>
                  {coin.obverseImage
                    ? <img src={coin.obverseImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xs text-[#e8c97a] font-bold">{coin.year?.slice(-2)}</div>
                  }
                </div>
                <span className="text-[9px] text-[#f5f0e8]/40">{coin.year}</span>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 8 - (filtered.length % 8 || 8)) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-full aspect-square rounded-full flex items-center justify-center"
                style={{ border: '1px dashed rgba(201,168,76,0.2)', background: 'rgba(255,255,255,0.01)' }}>
                <div className="w-3 h-3 rounded-full border border-[#c9a84c]/20" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowAddCoin(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] shadow-lg hover:scale-105 transition-all flex items-center justify-center z-40"
        style={{ boxShadow: '0 4px 20px rgba(201,168,76,0.4)' }}>
        <Plus className="w-6 h-6" />
      </button>

      {showAddCoin && (
        <AddCoinWizard
          collectionId={id}
          onClose={() => setShowAddCoin(false)}
          onAdded={(coin) => { setShowAddCoin(false); load(); }}
        />
      )}
    </div>
  );
}