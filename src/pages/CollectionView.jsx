import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoinsByCollection, createCoin, deleteCoin } from '@/components/storage';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowLeft, Coins, FileDown, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function CollectionView() {
  const { id: collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newCoin, setNewCoin] = useState({
    country: '', denomination: '', year: '', mint_mark: 'None',
    composition: '', user_grade: '', purchase_price: '',
  });
  const [obverseFile, setObverseFile] = useState(null);
  const [reverseFile, setReverseFile] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportWithImages, setExportWithImages] = useState(true);

  const load = async () => {
    setLoading(true);
    const collections = await base44.entities.Collection.filter({ id: collectionId });
    setCollection(collections[0] || null);
    const coinList = await getCoinsByCollection(collectionId);
    setCoins(coinList);
    setLoading(false);
  };

  useEffect(() => { if (collectionId) load(); }, [collectionId]);

  const uploadFile = async (file) => {
    if (!file) return null;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleAddCoin = async () => {
    setUploading(true);
    const [obverseUrl, reverseUrl] = await Promise.all([
      uploadFile(obverseFile),
      uploadFile(reverseFile),
    ]);
    await createCoin({
      collection_id: collectionId,
      ...newCoin,
      obverse_image: obverseUrl,
      reverse_image: reverseUrl,
    });
    setNewCoin({ country: '', denomination: '', year: '', mint_mark: 'None', composition: '', user_grade: '', purchase_price: '' });
    setObverseFile(null);
    setReverseFile(null);
    setShowAdd(false);
    setUploading(false);
    load();
  };

  const handleDeleteCoin = async (id) => {
    await deleteCoin(id);
    load();
  };

  const handleExportPdf = async () => {
    setExporting(true);
    const response = await base44.functions.invoke('exportCollectionPdf', {
      collectionId,
      includeThumbnails: exportWithImages,
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection?.name || 'collection'}_report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setShowExport(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p className="text-[#f5f0e8]/50">Collection not found.</p>
        <Link to="/dashboard" className="text-[#e8c97a] underline mt-4 inline-block">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Link to="/dashboard" className="p-2 -ml-2 text-[#f5f0e8]/40 hover:text-[#e8c97a] active:text-[#e8c97a] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{collection.name}</h1>
          <p className="text-xs sm:text-sm text-[#f5f0e8]/35">{coins.length} coin{coins.length !== 1 ? 's' : ''} · {collection.type}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={showExport} onOpenChange={setShowExport}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:text-[#e8c97a] hover:bg-[#c9a84c]/10 gap-1.5 h-9 px-3 rounded-xl" disabled={coins.length === 0}>
                <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] mx-4 sm:mx-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Export PDF Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm text-[#f5f0e8]/50">Generate a PDF report of <strong className="text-[#f5f0e8]/80">{collection?.name}</strong> with {coins.length} coin{coins.length !== 1 ? 's' : ''}.</p>
                <button
                  onClick={() => setExportWithImages(!exportWithImages)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${exportWithImages ? 'border-[#c9a84c]/40 bg-[#c9a84c]/8' : 'border-[#c9a84c]/10 bg-white/[0.02]'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${exportWithImages ? 'bg-[#c9a84c]/20' : 'bg-white/5'}`}>
                    <ImageIcon className={`w-4 h-4 ${exportWithImages ? 'text-[#e8c97a]' : 'text-[#f5f0e8]/25'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-[#f5f0e8]">Include coin thumbnails</p>
                    <p className="text-xs text-[#f5f0e8]/35">Adds obverse images next to each coin row</p>
                  </div>
                  <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${exportWithImages ? 'bg-[#c9a84c]' : 'bg-white/10'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${exportWithImages ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
                {exportWithImages && (
                  <p className="text-[11px] text-[#f5f0e8]/25">Note: Including images may take longer to generate and produce a larger file.</p>
                )}
                <Button onClick={handleExportPdf} disabled={exporting} className="w-full bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] h-11 rounded-xl font-semibold gap-2">
                  {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><FileDown className="w-4 h-4" /> Download PDF</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Coin</span><span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#e8c97a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Add Coin</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Country" value={newCoin.country} onChange={e => setNewCoin({ ...newCoin, country: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
                <Select value={newCoin.denomination} onValueChange={v => setNewCoin({ ...newCoin, denomination: v })}>
                  <SelectTrigger className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl">
                    <SelectValue placeholder="Denomination" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1525] border-[#c9a84c]/20 max-h-60">
                    {[
                      '1 Cent (Penny)', '5 Cents (Nickel)', '10 Cents (Dime)', '25 Cents (Quarter)',
                      '50 Cents (Half Dollar)', '1 Dollar', '1 Dollar (Silver)', '1 Dollar (Gold)',
                      '$2.50 (Quarter Eagle)', '$5 (Half Eagle)', '$10 (Eagle)', '$20 (Double Eagle)',
                      '1 Penny', '2 Pence', '5 Pence', '10 Pence', '20 Pence', '50 Pence', '1 Pound', '2 Pounds',
                      '1 Euro Cent', '2 Euro Cent', '5 Euro Cent', '10 Euro Cent', '20 Euro Cent', '50 Euro Cent', '1 Euro', '2 Euro',
                      '1 Yen', '5 Yen', '10 Yen', '50 Yen', '100 Yen', '500 Yen',
                      '1 Franc', '2 Franc', '5 Franc',
                      '1 Mark', '2 Mark', '5 Mark',
                      '1 Real', '5 Centavos', '10 Centavos', '25 Centavos', '50 Centavos',
                      '1 Rupee', '2 Rupees', '5 Rupees', '10 Rupees',
                      '1 Yuan', '5 Jiao',
                      '1 Peso', '5 Pesos', '10 Pesos',
                    ].map(d => (
                      <SelectItem key={d} value={d} className="text-[#f5f0e8]">{d}</SelectItem>
                    ))}
                    <SelectItem value="__custom" className="text-[#e8c97a]">Custom...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newCoin.denomination === '__custom' && (
                <Input placeholder="Enter custom denomination" value="" onChange={e => setNewCoin({ ...newCoin, denomination: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" autoFocus />
              )}
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Year" value={newCoin.year} onChange={e => setNewCoin({ ...newCoin, year: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
                <Input placeholder="Mint Mark" value={newCoin.mint_mark} onChange={e => setNewCoin({ ...newCoin, mint_mark: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
              </div>
              <Input placeholder="Composition" value={newCoin.composition} onChange={e => setNewCoin({ ...newCoin, composition: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Grade" value={newCoin.user_grade} onChange={e => setNewCoin({ ...newCoin, user_grade: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
                <Input placeholder="Purchase Price" value={newCoin.purchase_price} onChange={e => setNewCoin({ ...newCoin, purchase_price: e.target.value })} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#f5f0e8]/40 mb-1.5 block font-medium">Obverse</label>
                  <Input type="file" accept="image/*" onChange={e => setObverseFile(e.target.files[0])} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs text-[#f5f0e8]/40 mb-1.5 block font-medium">Reverse</label>
                  <Input type="file" accept="image/*" onChange={e => setReverseFile(e.target.files[0])} className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8] h-11 rounded-xl text-xs" />
                </div>
              </div>
              <Button onClick={handleAddCoin} disabled={uploading} className="w-full bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] h-11 rounded-xl font-semibold mt-1">
                {uploading ? 'Uploading...' : 'Add Coin'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full bg-[#c9a84c]/5 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-7 h-7 text-[#c9a84c]/20" />
          </div>
          <p className="text-[#f5f0e8]/35 text-sm">No coins yet</p>
          <p className="text-[#f5f0e8]/20 text-xs mt-1">Tap "Add" to add your first coin</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {coins.map(coin => (
            <div key={coin.id} className="group rounded-2xl border border-[#c9a84c]/10 overflow-hidden hover:border-[#c9a84c]/30 transition-all active:scale-[0.98]" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Link to={`/coins/${coin.id}`}>
                <div className="aspect-square bg-gradient-to-br from-[#c9a84c]/5 to-[#0a0e1a] flex items-center justify-center overflow-hidden">
                  {coin.obverse_image ? (
                    <img src={coin.obverse_image} alt="" className="w-full h-full object-contain p-3" loading="lazy" />
                  ) : (
                    <Coins className="w-8 h-8 text-[#c9a84c]/15" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-[#f5f0e8] truncate">{coin.year} {coin.denomination}</h3>
                  <p className="text-xs text-[#f5f0e8]/35 truncate">{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
                </div>
              </Link>
              <div className="px-3 pb-2.5 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 -m-1.5 text-[#f5f0e8]/15 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0f1525] border-[#c9a84c]/20 text-[#f5f0e8] mx-4">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this coin?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#f5f0e8]/50">This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white/5 border-[#c9a84c]/20 text-[#f5f0e8]">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCoin(coin.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}