import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Coins, FolderOpen, TrendingUp, Clock, Edit2, Folder } from 'lucide-react';
import { getCollections, getCoinsByCollection, getPortfolioStats } from '../lib/storage';
import CreateCollectionModal from '../components/CreateCollectionModal';

const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-2xl border border-[#c9a84c]/20 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-w-0 overflow-hidden"
    style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(8px)' }}>
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#e8c97a]" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-xs text-[#f5f0e8]/40 uppercase tracking-wider truncate">{label}</p>
      <p className="text-base sm:text-xl font-bold text-[#f5f0e8] mt-0.5 truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
      {sub && <p className="text-[10px] sm:text-xs text-[#f5f0e8]/30 mt-0.5 truncate">{sub}</p>}
    </div>
  </div>
);

const CollectionCard = ({ collection, coinCount, estimatedValue, onEdit, onDelete }) => {
  const navigate = useNavigate();
  return (
    <div className="group rounded-2xl border border-[#c9a84c]/20 overflow-hidden transition-all hover:border-[#c9a84c]/40 hover:shadow-[0_8px_32px_rgba(201,168,76,0.1)] cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.03)' }}
      onClick={() => navigate(`/collections/${collection.id}`)}>
      
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-[#c9a84c]/10 to-[#0a0e1a] flex items-center justify-center relative overflow-hidden">
        {collection.coverImage ? (
          <img src={collection.coverImage} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <Coins className="w-12 h-12 text-[#c9a84c]/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/80 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className="text-xs text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/30 px-2 py-0.5 rounded-full">{collection.type}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-[#f5f0e8] text-sm mb-1 group-hover:text-[#e8c97a] transition-colors" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-xs text-[#f5f0e8]/40 mb-3 line-clamp-2">{collection.description}</p>
        )}
        
        <div className="flex items-center justify-between text-xs text-[#f5f0e8]/50 mb-3">
          <span>{coinCount} coins</span>
          {estimatedValue > 0 && <span className="text-[#c9a84c]">${estimatedValue.toLocaleString()}</span>}
          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
        </div>

        {collection.targetGoal && (
          <p className="text-xs text-[#f5f0e8]/30 italic mb-3 truncate">Goal: {collection.targetGoal}</p>
        )}

        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Link to={`/collections/${collection.id}`}
            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-[#c9a84c]/15 text-[#e8c97a] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/25 transition-colors">
            Open
          </Link>
          <button onClick={() => onEdit(collection)}
            className="p-1.5 rounded-lg bg-white/5 text-[#f5f0e8]/40 hover:text-[#f5f0e8] hover:bg-white/10 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState({ totalCoins: 0, totalCollections: 0, estimatedValue: 0, newestCoin: null });
  const [showCreate, setShowCreate] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = () => {
    const cols = getCollections();
    setCollections(cols);
    setStats(getPortfolioStats());
  };

  useEffect(() => {
    load();
    setInitialized(true);
  }, []);

  const handleCreated = (col) => {
    setShowCreate(false);
    load();
  };

  const collectionData = collections.map(col => {
    const coins = getCoinsByCollection(col.id);
    const val = coins.reduce((s, c) => {
      const v = parseFloat(c.marketValue?.this_coin_estimated_value?.replace(/[^0-9.]/g, '') || c.marketValue?.thisCoinsEstimatedValue?.replace(/[^0-9.]/g, '') || c.purchasePrice || 0);
      return s + (isNaN(v) ? 0 : v);
    }, 0);
    return { collection: col, coinCount: coins.length, estimatedValue: val };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero vignette */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 60%)'
      }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f5f0e8] mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Your Vault
          </h1>
          <p className="text-[#f5f0e8]/40 text-sm">Welcome back to CoinVault</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Coins} label="Total Coins" value={stats.totalCoins} />
          <StatCard icon={Folder} label="Collections" value={stats.totalCollections} />
          <StatCard icon={TrendingUp} label="Est. Portfolio" value={`$${stats.estimatedValue.toLocaleString()}`} />
          <StatCard icon={Clock} label="Newest Addition"
            value={stats.newestCoin ? `${stats.newestCoin.year || '?'} ${stats.newestCoin.denomination || 'Coin'}` : '—'}
            sub={stats.newestCoin ? stats.newestCoin.country : 'No coins yet'} />
        </div>

        {/* Collections */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            My Collections
          </h2>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-[#c9a84c]/15 text-[#e8c97a] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/25 transition-colors">
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {collections.length === 0 ? (
          <div className="rounded-2xl border border-[#c9a84c]/20 p-16 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#c9a84c]/30 flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-[#c9a84c]/30" />
            </div>
            <h3 className="text-lg font-semibold text-[#f5f0e8]/50 mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Your collection awaits
            </h3>
            <p className="text-sm text-[#f5f0e8]/30 mb-5">Add your first coin to begin your numismatic journey</p>
            <button onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] font-semibold text-sm hover:opacity-90 transition-opacity">
              Create First Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collectionData.map(({ collection, coinCount, estimatedValue }) => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                coinCount={coinCount}
                estimatedValue={estimatedValue}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c97a] text-[#0a0e1a] shadow-lg hover:shadow-[#c9a84c]/40 hover:scale-105 transition-all flex items-center justify-center z-40"
        style={{ boxShadow: '0 4px 20px rgba(201,168,76,0.4)' }}>
        <Plus className="w-6 h-6" />
      </button>

      {showCreate && <CreateCollectionModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
}