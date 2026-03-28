import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Tag, Search, MessageSquare, Trash2, Eye, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SendMessageDialog from '@/components/SendMessageDialog';

const inputStyle = { background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' };

function ListingCard({ listing, currentUser, onDelete, onContact }) {
  const isOwn = listing.created_by === currentUser?.email;
  const isSell = listing.listing_type === 'sell';

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
      {listing.image_url ? (
        <div className="aspect-[4/3] overflow-hidden" style={{ background: 'var(--cv-input-bg)' }}>
          <img src={listing.image_url} alt={listing.coin_name} className="w-full h-full object-contain p-2" />
        </div>
      ) : (
        <div className="aspect-[4/3] flex items-center justify-center"
          style={{ background: 'var(--cv-accent-bg)' }}>
          <ShoppingBag className="w-10 h-10" style={{ color: 'var(--cv-accent)' }} />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isSell ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {isSell ? 'For Sale' : 'Wanted'}
          </span>
          {listing.asking_price && (
            <span className="text-sm font-bold" style={{ color: 'var(--cv-accent)' }}>
              {listing.asking_price}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--cv-text)' }}>
          {listing.coin_name}
        </h3>

        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: 'var(--cv-text-muted)' }}>
          {listing.year && <span>{listing.year}</span>}
          {listing.country && <span>{listing.country}</span>}
          {listing.grade && <span>{listing.grade}</span>}
        </div>

        {listing.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--cv-text-secondary)' }}>
            {listing.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t" style={{ borderColor: 'var(--cv-border)' }}>
          <span className="text-[11px]" style={{ color: 'var(--cv-text-faint)' }}>
            {listing.seller_name || 'CoinVault User'}
          </span>
          <div className="flex gap-1.5">
            {isOwn ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1.5 rounded-lg transition-colors opacity-50 hover:opacity-100"
                    style={{ color: 'var(--cv-text-faint)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove listing?</AlertDialogTitle>
                    <AlertDialogDescription style={{ color: 'var(--cv-text-secondary)' }}>This listing will be permanently removed.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(listing.id)} className="bg-red-600 hover:bg-red-700 text-white">Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button size="sm" onClick={() => onContact(listing)}
                className="h-7 px-2.5 text-xs rounded-lg gap-1"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                <MessageSquare className="w-3 h-3" />
                Contact
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contactListing, setContactListing] = useState(null);
  const [form, setForm] = useState({
    listing_type: 'sell', coin_name: '', year: '', country: '',
    denomination: '', grade: '', composition: '', description: '', asking_price: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [user, all] = await Promise.all([
      base44.auth.me(),
      base44.entities.MarketListing.filter({ is_active: true }, '-created_date', 100),
    ]);
    setCurrentUser(user);
    setListings(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = listings.filter(l => {
    const matchTab = tab === 'all' || (tab === 'sell' && l.listing_type === 'sell') || (tab === 'want' && l.listing_type === 'want') || (tab === 'mine' && l.created_by === currentUser?.email);
    const q = search.toLowerCase();
    const matchSearch = !q || [l.coin_name, l.country, l.year, l.denomination, l.grade, l.description].some(v => v?.toLowerCase().includes(q));
    return matchTab && matchSearch;
  });

  const handleCreate = async () => {
    if (!form.coin_name.trim()) return;
    setSaving(true);
    await base44.entities.MarketListing.create({
      ...form,
      seller_name: currentUser?.full_name || currentUser?.email,
      seller_email: currentUser?.email,
      is_active: true,
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ listing_type: 'sell', coin_name: '', year: '', country: '', denomination: '', grade: '', composition: '', description: '', asking_price: '' });
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.MarketListing.delete(id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
            Coin Exchange
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>
            Buy, sell, and trade with other collectors
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post Listing</span>
              <span className="sm:hidden">Post</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl"
            style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                Post a Listing
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setForm({ ...form, listing_type: 'sell' })}
                  className="p-3 rounded-xl text-sm font-semibold transition-all"
                  style={form.listing_type === 'sell' ? { background: '#16a34a22', border: '2px solid #16a34a', color: '#4ade80' } : { border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)', color: 'var(--cv-text-secondary)' }}>
                  For Sale
                </button>
                <button onClick={() => setForm({ ...form, listing_type: 'want' })}
                  className="p-3 rounded-xl text-sm font-semibold transition-all"
                  style={form.listing_type === 'want' ? { background: '#3b82f622', border: '2px solid #3b82f6', color: '#60a5fa' } : { border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)', color: 'var(--cv-text-secondary)' }}>
                  Wanted
                </button>
              </div>
              <Input placeholder="Coin name *" value={form.coin_name} onChange={e => setForm({ ...form, coin_name: e.target.value })} className="h-11 rounded-xl" style={inputStyle} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="h-10 rounded-xl" style={inputStyle} />
                <Input placeholder="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className="h-10 rounded-xl" style={inputStyle} />
                <Input placeholder="Denomination" value={form.denomination} onChange={e => setForm({ ...form, denomination: e.target.value })} className="h-10 rounded-xl" style={inputStyle} />
                <Input placeholder="Grade" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="h-10 rounded-xl" style={inputStyle} />
              </div>
              <Input placeholder="Asking price (or 'Make Offer')" value={form.asking_price} onChange={e => setForm({ ...form, asking_price: e.target.value })} className="h-11 rounded-xl" style={inputStyle} />
              <Textarea placeholder="Description (condition, provenance, etc.)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl min-h-[80px]" style={inputStyle} />
              <Button onClick={handleCreate} disabled={saving || !form.coin_name.trim()} className="w-full h-11 rounded-xl font-semibold"
                style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                {saving ? 'Posting...' : 'Post Listing'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--cv-text-faint)' }} />
          <Input placeholder="Search listings..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl" style={inputStyle} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-10 rounded-xl p-1" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)' }}>
            <TabsTrigger value="all" className="rounded-lg text-xs px-3 data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">All</TabsTrigger>
            <TabsTrigger value="sell" className="rounded-lg text-xs px-3 data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">For Sale</TabsTrigger>
            <TabsTrigger value="want" className="rounded-lg text-xs px-3 data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">Wanted</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-lg text-xs px-3 data-[state=active]:bg-[var(--cv-accent-bg)] data-[state=active]:text-[var(--cv-accent)]">Mine</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--cv-text-faint)' }} />
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No listings found</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Be the first to post a listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(l => (
            <ListingCard key={l.id} listing={l} currentUser={currentUser} onDelete={handleDelete} onContact={setContactListing} />
          ))}
        </div>
      )}

      {contactListing && (
        <SendMessageDialog
          listing={contactListing}
          currentUser={currentUser}
          onClose={() => setContactListing(null)}
        />
      )}
    </div>
  );
}