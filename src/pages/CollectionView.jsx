import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCoinsByCollection, createCoin, deleteCoin } from '@/components/storage';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowLeft, Coins, FileDown, Loader2, ImageIcon, Crop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ImageCropper from '@/components/ImageCropper';
import CollectionTags from '@/components/CollectionTags';

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
  const [croppingField, setCroppingField] = useState(null); // 'obverse' | 'reverse'
  const [cropFile, setCropFile] = useState(null);
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

  const handleFileSelect = (field, file) => {
    if (!file) return;
    setCropFile(file);
    setCroppingField(field);
  };

  const handleCropped = (croppedFile) => {
    if (croppingField === 'obverse') setObverseFile(croppedFile);
    else setReverseFile(croppedFile);
    setCroppingField(null);
    setCropFile(null);
  };

  const handleCancelCrop = () => {
    setCroppingField(null);
    setCropFile(null);
  };

  const handleAddCoin = async () => {
    setUploading(true);
    const [obverseUrl, reverseUrl] = await Promise.all([uploadFile(obverseFile), uploadFile(reverseFile)]);
    await createCoin({ collection_id: collectionId, ...newCoin, obverse_image: obverseUrl, reverse_image: reverseUrl });
    setNewCoin({ country: '', denomination: '', year: '', mint_mark: 'None', composition: '', user_grade: '', purchase_price: '' });
    setObverseFile(null);
    setReverseFile(null);
    setShowAdd(false);
    setUploading(false);
    load();
  };

  const handleDeleteCoin = async (id) => { await deleteCoin(id); load(); };

  const handleExportPdf = async () => {
    setExporting(true);
    const response = await base44.functions.invoke('exportCollectionPdf', { collectionId, includeThumbnails: exportWithImages });
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
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <p style={{ color: 'var(--cv-text-secondary)' }}>Collection not found.</p>
        <Link to="/dashboard" className="underline mt-4 inline-block" style={{ color: 'var(--cv-accent)' }}>Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Link to="/dashboard" className="p-2 -ml-2 transition-colors" style={{ color: 'var(--cv-text-muted)' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>{collection.name}</h1>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--cv-text-muted)' }}>{coins.length} coin{coins.length !== 1 ? 's' : ''} · {collection.type}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* PDF Export */}
          <Dialog open={showExport} onOpenChange={setShowExport}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 h-9 px-3 rounded-xl" style={{ border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text-secondary)' }} disabled={coins.length === 0}>
                <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-auto rounded-2xl" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Export PDF Report</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <p className="text-sm" style={{ color: 'var(--cv-text-secondary)' }}>Generate a PDF report of <strong style={{ color: 'var(--cv-text)' }}>{collection?.name}</strong> with {coins.length} coin{coins.length !== 1 ? 's' : ''}.</p>
                <button onClick={() => setExportWithImages(!exportWithImages)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ border: `1px solid ${exportWithImages ? 'var(--cv-accent-border)' : 'var(--cv-border)'}`, background: exportWithImages ? 'var(--cv-accent-bg)' : 'var(--cv-bg-card)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: exportWithImages ? 'var(--cv-accent-bg)' : 'var(--cv-input-bg)' }}>
                    <ImageIcon className="w-4 h-4" style={{ color: exportWithImages ? 'var(--cv-accent)' : 'var(--cv-text-faint)' }} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--cv-text)' }}>Include coin thumbnails</p>
                    <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>Adds obverse images next to each coin row</p>
                  </div>
                  <div className="w-10 h-6 rounded-full p-0.5 transition-colors" style={{ background: exportWithImages ? 'var(--cv-accent-dim)' : 'var(--cv-input-bg)' }}>
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${exportWithImages ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </button>
                <Button onClick={handleExportPdf} disabled={exporting} className="w-full h-11 rounded-xl font-semibold gap-2" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                  {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><FileDown className="w-4 h-4" /> Download PDF</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {/* Add Coin */}
          <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) { setCroppingField(null); setCropFile(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-9 px-3 sm:px-4 rounded-xl font-semibold" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Coin</span><span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto rounded-2xl" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Add Coin</DialogTitle>
              </DialogHeader>

              {croppingField && cropFile ? (
                <ImageCropper file={cropFile} onCropped={handleCropped} onCancel={handleCancelCrop} initialShape="circle" />
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Country" value={newCoin.country} onChange={e => setNewCoin({ ...newCoin, country: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                    <Select value={newCoin.denomination} onValueChange={v => setNewCoin({ ...newCoin, denomination: v })}>
                      <SelectTrigger className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                        <SelectValue placeholder="Denomination" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)' }}>
                        {['1 Cent (Penny)','5 Cents (Nickel)','10 Cents (Dime)','25 Cents (Quarter)','50 Cents (Half Dollar)','1 Dollar','1 Dollar (Silver)','1 Dollar (Gold)','$2.50 (Quarter Eagle)','$5 (Half Eagle)','$10 (Eagle)','$20 (Double Eagle)','1 Penny','2 Pence','5 Pence','10 Pence','20 Pence','50 Pence','1 Pound','2 Pounds','1 Euro Cent','2 Euro Cent','5 Euro Cent','10 Euro Cent','20 Euro Cent','50 Euro Cent','1 Euro','2 Euro','1 Yen','5 Yen','10 Yen','50 Yen','100 Yen','500 Yen','1 Franc','2 Franc','5 Franc','1 Mark','2 Mark','5 Mark','1 Real','5 Centavos','10 Centavos','25 Centavos','50 Centavos','1 Rupee','2 Rupees','5 Rupees','10 Rupees','1 Yuan','5 Jiao','1 Peso','5 Pesos','10 Pesos'].map(d => (
                          <SelectItem key={d} value={d} style={{ color: 'var(--cv-text)' }}>{d}</SelectItem>
                        ))}
                        <SelectItem value="__custom" style={{ color: 'var(--cv-accent)' }}>Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newCoin.denomination === '__custom' && (
                    <Input placeholder="Enter custom denomination" onChange={e => setNewCoin({ ...newCoin, denomination: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} autoFocus />
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Year" value={newCoin.year} onChange={e => setNewCoin({ ...newCoin, year: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                    <Input placeholder="Mint Mark" value={newCoin.mint_mark} onChange={e => setNewCoin({ ...newCoin, mint_mark: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                  </div>
                  <Input placeholder="Composition" value={newCoin.composition} onChange={e => setNewCoin({ ...newCoin, composition: e.target.value })}
                    className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Grade" value={newCoin.user_grade} onChange={e => setNewCoin({ ...newCoin, user_grade: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                    <Input placeholder="Purchase Price" value={newCoin.purchase_price} onChange={e => setNewCoin({ ...newCoin, purchase_price: e.target.value })}
                      className="h-11 rounded-xl" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--cv-text-muted)' }}>
                        Obverse {obverseFile && <span style={{ color: 'var(--cv-accent)' }}>✓ cropped</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <Input type="file" accept="image/*" onChange={e => handleFileSelect('obverse', e.target.files[0])}
                          className="h-11 rounded-xl text-xs flex-1" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--cv-text-muted)' }}>
                        Reverse {reverseFile && <span style={{ color: 'var(--cv-accent)' }}>✓ cropped</span>}
                      </label>
                      <div className="flex gap-1.5">
                        <Input type="file" accept="image/*" onChange={e => handleFileSelect('reverse', e.target.files[0])}
                          className="h-11 rounded-xl text-xs flex-1" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddCoin} disabled={uploading} className="w-full h-11 rounded-xl font-semibold mt-1" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)' }}>
                    {uploading ? 'Uploading...' : 'Add Coin'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CollectionTags collection={collection} onUpdate={setCollection} coinCount={coins.length} />

      {coins.length === 0 ? (
        <div className="text-center py-16 sm:py-24">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--cv-accent-bg)' }}>
            <Coins className="w-7 h-7" style={{ color: 'var(--cv-text-faint)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--cv-text-muted)' }}>No coins yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--cv-text-faint)' }}>Tap "Add" to add your first coin</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {coins.map(coin => (
            <div key={coin.id} className="group rounded-2xl overflow-hidden transition-all active:scale-[0.98]" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
              <Link to={`/coins/${coin.id}`}>
                <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: `linear-gradient(135deg, var(--cv-gradient-from), var(--cv-gradient-to))` }}>
                  {coin.obverse_image ? (
                    <img src={coin.obverse_image} alt="" className="w-full h-full object-contain p-3" loading="lazy" />
                  ) : (
                    <Coins className="w-8 h-8" style={{ color: 'var(--cv-text-faint)' }} />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate" style={{ color: 'var(--cv-text)' }}>{coin.year} {coin.denomination}</h3>
                  <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>{coin.country}{coin.user_grade ? ` · ${coin.user_grade}` : ''}</p>
                </div>
              </Link>
              <div className="px-3 pb-2.5 flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="p-1.5 -m-1.5 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all" style={{ color: 'var(--cv-text-faint)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4" style={{ background: 'var(--cv-bg-elevated)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this coin?</AlertDialogTitle>
                      <AlertDialogDescription style={{ color: 'var(--cv-text-secondary)' }}>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-border)', color: 'var(--cv-text)' }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCoin(coin.id)} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
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