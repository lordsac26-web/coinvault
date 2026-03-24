import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCollections, getCoins, createCollection, deleteCollection } from '@/components/storage';
import { Plus, Trash2, FolderOpen, Coins, DollarSign, Star, Tag, X, Pencil, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditCollectionName from '@/components/EditCollectionName';

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-10 h-10 rounded-full border-4 animate-spin"
        style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }}
      />
    </div>
  );
}

// Colored left-accent stat card
function StatCard({ label, value, icon: Icon, delta, deltaUp, accentColor, iconBg, iconColor }) {
  return (
    <div
      className="relative rounded-2xl p-4 sm:p-5 overflow-hidden"
      style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl"
        style={{ background: accentColor }}
      />
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
      </div>
      <p
        className="text-2xl sm:text-3xl font-bold tracking-tight"
        style={{ color: 'var(--cv-text)', fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {value}
      </p>
      <p className="text-xs font-medium mt-1" style={{ color: 'var(--cv-text-muted)' }}>
        {label}
      </p>
      {delta && (
        <p
          className="text-[11px] mt-2 font-medium"
          style={{ color: deltaUp ? '#3B6D11' : 'var(--cv-text-faint)' }}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

// Activity feed item
function ActivityItem({ color, text, time }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
      style={{ background: 'var(--cv-input-bg)' }}
    >
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <p className="text-sm flex-1" style={{ color: 'var(--cv-text)' }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
      <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--cv-text-faint)' }}>{time}</span>
    </div>
  );
}

// Bar chart row
function BarRow({ label, count, max, color }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs w-[90px] truncate flex-shrink-0" style={{ color: 'var(--cv-text-secondary)' }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--cv-border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] w-6 text-right flex-shrink-0" style={{ color: 'var(--cv-text-faint)' }}>
        {count}
      </span>
    </div>
  );
}

// Grade badge row
const GRADE_COLORS = {
  'MS-65': { bg: '#EEEDFE', color: '#3C3489' },
  'MS-63': { bg: '#E6F1FB', color: '#0C447C' },
  'AU-58': { bg: '#EAF3DE', color: '#27500A' },
  'EF-40': { bg: '#FAEEDA', color: '#633806' },
  'VF-20': { bg: '#F1EFE8', color: '#444441' },
};

function GradeRow({ grade, count, avgValue }) {
  const style = GRADE_COLORS[grade] || { bg: 'var(--cv-accent-bg)', color: 'var(--cv-accent)' };
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: style.bg, color: style.color }}
      >
        {grade}
      </span>
      <span className="text-xs" style={{ color: 'var(--cv-text-secondary)' }}>
        {count} coin{count !== 1 ? 's' : ''}
        {avgValue > 0 && ` · avg $${Math.round(avgValue).toLocaleString()}`}
      </span>
    </div>
  );
}

// Collection card — redesigned with gradient thumbs
const THUMB_GRADIENTS = [
  ['#FAEEDA', '#FAC775'],
  ['#E6F1FB', '#B5D4F4'],
  ['#EAF3DE', '#C0DD97'],
  ['#EEEDFE', '#CECBF6'],
  ['#E1F5EE', '#9FE1CB'],
  ['#FBEAF0', '#F4C0D1'],
];
const THUMB_STROKES = ['#BA7517', '#185FA5', '#3B6D11', '#534AB7', '#0F6E56', '#993556'];

function CollectionCard({ col, coinCount, onDelete, onUpdated, index }) {
  const gradFrom = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length][0];
  const gradTo   = THUMB_GRADIENTS[index % THUMB_GRADIENTS.length][1];
  const stroke   = THUMB_STROKES[index % THUMB_STROKES.length];

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
      style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
    >
      <Link to={`/collections/${col.id}`} className="block">
        <div
          className="h-24 sm:h-32 flex items-center justify-center overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
        >
          {col.cover_image ? (
            <img src={col.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12 opacity-60">
              <circle cx="24" cy="24" r="18" stroke={stroke} strokeWidth="1.5" />
              <circle cx="24" cy="24" r="9"  stroke={stroke} strokeWidth="1.5" />
              <circle cx="24" cy="24" r="2"  fill={stroke} />
            </svg>
          )}
        </div>
        <div className="p-3.5 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base truncate" style={{ color: 'var(--cv-text)' }}>
            {col.name}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>
            {coinCount} coin{coinCount !== 1 ? 's' : ''} · {col.type}
          </p>
          {col.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {col.tags.slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    background: 'var(--cv-accent-bg)',
                    color: 'var(--cv-accent)',
                    border: '1px solid var(--cv-accent-border)',
                  }}
                >
                  {tag}
                </span>
              ))}
              {col.tags.length > 3 && (
                <span className="text-[10px] py-0.5" style={{ color: 'var(--cv-text-faint)' }}>
                  +{col.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
      <div className="px-3.5 pb-3 flex justify-end gap-2">
        <EditCollectionName collection={col} onUpdated={onUpdated} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="p-1.5 -m-1.5 hover:text-red-400 transition-colors opacity-40 hover:opacity-100"
              style={{ color: 'var(--cv-text-faint)' }}
              aria-label={`Delete ${col.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="mx-4"
            style={{
              background: 'var(--cv-bg-elevated)',
              border: '1px solid var(--cv-accent-border)',
              color: 'var(--cv-text)',
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{col.name}"?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: 'var(--cv-text-secondary)' }}>
                This will delete the collection and all {coinCount} coins in it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(col.id)} className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Parse value string like "$22", "$15-$25", "~$1,200", "$1.2k" → number
function parseValue(str) {
  if (!str) return 0;
  const s = String(str).trim();
  const rangeMatch = s.match(/\$?\s*([\d,.]+)\s*[-–to]+\s*\$?\s*([\d,.]+)/i);
  if (rangeMatch) {
    const low  = parseFloat(rangeMatch[1].replace(/,/g, ''));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ''));
    if (!isNaN(low) && !isNaN(high)) return (low + high) / 2;
  }
  const kMatch = s.match(/([\d,.]+)\s*k/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(/,/g, ''));
    return isNaN(val) ? 0 : val * 1000;
  }
  const cleaned = s.replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

// Derive a short "time ago" string from an ISO date string
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [coins, setCoins]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [newCol, setNewCol]           = useState({ name: '', description: '', type: 'Custom' });
  const [activeTag, setActiveTag]     = useState(null);
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 12;

  const load = async () => {
    setLoading(true);
    const [cols, allCoins] = await Promise.all([getCollections(), getCoins()]);
    setCollections(cols);
    setCoins(allCoins);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalValue = useMemo(() =>
    coins.reduce((sum, c) => {
      const raw = c.market_value?.this_coin_estimated_value || c.purchase_price || '';
      return sum + parseValue(raw);
    }, 0),
  [coins]);

  const gradedCount = useMemo(
    () => coins.filter(c => c.user_grade || c.ai_grade).length,
    [coins]
  );

  // Country breakdown for bar chart
  const countryBreakdown = useMemo(() => {
    const map = {};
    coins.forEach(c => {
      const k = c.country || 'Unknown';
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [coins]);

  // Grade breakdown
  const gradeBreakdown = useMemo(() => {
    const map = {};
    const valMap = {};
    coins.forEach(c => {
      const g = c.user_grade || c.ai_grade;
      if (!g) return;
      map[g] = (map[g] || 0) + 1;
      const v = parseValue(c.market_value?.this_coin_estimated_value || c.purchase_price || '');
      if (v > 0) valMap[g] = (valMap[g] || []).concat(v);
    });
    return Object.entries(map)
      .map(([grade, count]) => ({
        grade,
        count,
        avgValue: valMap[grade]?.length
          ? valMap[grade].reduce((a, b) => a + b, 0) / valMap[grade].length
          : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [coins]);

  // Recent activity — last 3 coins added/updated
  const recentActivity = useMemo(() => {
    const ACTIVITY_COLORS = ['#3B6D11', '#534AB7', '#BA7517', '#185FA5', '#0F6E56'];
    return [...coins]
      .filter(c => c.created_date || c.updated_date)
      .sort((a, b) =>
        new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
      )
      .slice(0, 3)
      .map((c, i) => ({
        color: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length],
        text: `<strong>${c.year || ''} ${c.denomination || 'Coin'}</strong> added${c.collection_id ? '' : ''}`,
        time: timeAgo(c.updated_date || c.created_date),
      }));
  }, [coins]);

  // Tags
  const allTags = useMemo(
    () => [...new Set(collections.flatMap(c => c.tags || []))].sort(),
    [collections]
  );

  const filteredCollections = activeTag
    ? collections.filter(c => (c.tags || []).includes(activeTag))
    : collections;

  const totalPages = Math.ceil(filteredCollections.length / PAGE_SIZE);
  const pagedCollections = filteredCollections.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Mutations ────────────────────────────────────────────────────────────

  // Reset to page 1 when tag filter changes
  const handleTagChange = (tag) => {
    setActiveTag(activeTag === tag ? null : tag);
    setPage(1);
  };

  const handleCreate = async () => {
    if (!newCol.name.trim()) return;
    try {
      await createCollection(newCol);
      setNewCol({ name: '', description: '', type: 'Custom' });
      setShowCreate(false);
      load();
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete collection:', err);
      load();
    }
  };

  if (loading) return <PageLoader />;

  const maxCountry = countryBreakdown[0]?.count || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Collections"
          value={collections.length}
          icon={FolderOpen}
          delta={collections.length > 0 ? `${collections.length} total` : 'No collections yet'}
          deltaUp={collections.length > 0}
          accentColor="#185FA5"
          iconBg="#E6F1FB"
          iconColor="#185FA5"
        />
        <StatCard
          label="Total coins"
          value={coins.length}
          icon={Coins}
          delta={coins.length > 0 ? `Across ${collections.length} collection${collections.length !== 1 ? 's' : ''}` : 'Add your first coin'}
          deltaUp={coins.length > 0}
          accentColor="#BA7517"
          iconBg="#FAEEDA"
          iconColor="#BA7517"
        />
        <StatCard
          label="Est. value"
          value={`$${Math.round(totalValue).toLocaleString()}`}
          icon={DollarSign}
          delta={totalValue > 0 ? 'Based on market data' : 'No valuations yet'}
          deltaUp={totalValue > 0}
          accentColor="#3B6D11"
          iconBg="#EAF3DE"
          iconColor="#3B6D11"
        />
        <StatCard
          label="Graded"
          value={gradedCount}
          icon={Star}
          delta={coins.length > 0 ? `${Math.round((gradedCount / coins.length) * 100)}% of collection` : 'No grades yet'}
          deltaUp={gradedCount > 0}
          accentColor="#534AB7"
          iconBg="#EEEDFE"
          iconColor="#534AB7"
        />
      </div>

      {/* ── Collections header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg sm:text-xl font-bold"
          style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          My Collections
        </h2>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="gap-1.5 h-9 px-3 sm:px-4 text-sm font-semibold rounded-xl"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Collection</span>
              <span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent
            className="mx-4 sm:mx-auto rounded-2xl"
            style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                New Collection
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input
                placeholder="Collection name"
                value={newCol.name}
                onChange={e => setNewCol({ ...newCol, name: e.target.value })}
                className="h-11 rounded-xl"
                style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
              />
              <Textarea
                placeholder="Description (optional)"
                value={newCol.description}
                onChange={e => setNewCol({ ...newCol, description: e.target.value })}
                className="rounded-xl min-h-[80px]"
                style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}
              />
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--cv-text-muted)' }}>
                  Collection type
                </label>
                <Select value={newCol.type} onValueChange={v => setNewCol({ ...newCol, type: v })}>
                  <SelectTrigger className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
                    {['By Country','By Type','By Era','By Series','By Metal','Proof Sets','Mint Sets','Bullion','Rolls','Commemoratives','Paper Currency','Custom'].map(t => (
                      <SelectItem key={t} value={t} style={{ color: 'var(--cv-text)' }}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!newCol.name.trim()}
                className="w-full h-11 rounded-xl font-semibold"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Tag filters ─────────────────────────────────────────────────── */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <div className="flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--cv-text-muted)' }}>Filter:</span>
          </div>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
              style={activeTag === tag
                ? { background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: '1px solid var(--cv-accent)' }
                : { background: 'var(--cv-bg-card)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }
              }
            >
              {tag}
              {activeTag === tag && <X className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}

      {/* ── Collections grid ────────────────────────────────────────────── */}
      {filteredCollections.length === 0 && collections.length > 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>
            No collections match "{activeTag}"
          </p>
          <button onClick={() => setActiveTag(null)} className="text-xs mt-2 underline" style={{ color: 'var(--cv-accent)' }}>
            Clear filter
          </button>
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}>
            <FolderOpen className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No collections yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Tap "New" to create your first collection</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
          {pagedCollections.map((col, i) => (
            <CollectionCard
              key={col.id}
              col={col}
              coinCount={coins.filter(c => c.collection_id === col.id).length}
              onDelete={handleDelete}
              onUpdated={load}
              index={(page - 1) * PAGE_SIZE + i}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
              style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)', color: 'var(--cv-text)' }}
            >
              ← Prev
            </button>
            <span className="text-xs px-2" style={{ color: 'var(--cv-text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
              style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)', color: 'var(--cv-text)' }}
            >
              Next →
            </button>
          </div>
        )}
        </>

      {/* ── Bottom panels (activity + breakdowns) ───────────────────────── */}
      {coins.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent activity */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-text-muted)' }}>
                Recent Activity
              </h3>
            </div>
            {recentActivity.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentActivity.map((a, i) => (
                  <ActivityItem key={i} color={a.color} text={a.text} time={a.time} />
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>No recent activity</p>
            )}
          </div>

          {/* By country */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-text-muted)' }}>
                By Country
              </h3>
            </div>
            {countryBreakdown.length > 0 ? (
              countryBreakdown.map(({ name, count }) => (
                <BarRow key={name} label={name} count={count} max={maxCountry} color="#185FA5" />
              ))
            ) : (
              <p className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>No country data yet</p>
            )}
          </div>

          {/* Top grades */}
          <div
            className="rounded-2xl p-4 sm:p-5"
            style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5" style={{ color: 'var(--cv-text-muted)' }} />
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--cv-text-muted)' }}>
                Top Grades
              </h3>
            </div>
            {gradeBreakdown.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--cv-border)' }}>
                {gradeBreakdown.map(({ grade, count, avgValue }) => (
                  <GradeRow key={grade} grade={grade} count={count} avgValue={avgValue} />
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--cv-text-faint)' }}>No graded coins yet</p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}