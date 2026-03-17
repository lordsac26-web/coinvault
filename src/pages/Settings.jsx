import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, importAllData, exportToCSV } from '../lib/storage';
import { setApiKey, hasApiKey } from '../lib/anthropic';
import { Settings as SettingsIcon, Download, Upload, Trash2, Key, Camera, Mail, Check } from 'lucide-react';

const inputCls = "w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";
const selectCls = "w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
    <h3 className="text-base font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h3>
    {children}
  </div>
);

export default function Settings() {
  const [settings, setSettingsState] = useState(getSettings());
  // eslint-disable-next-line no-unused-vars
  // Pre-populate GitHub key if not yet saved
  useEffect(() => {
    if (!localStorage.getItem('coinvault_github_key')) {
      const defaultKey = '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';
      localStorage.setItem('coinvault_github_key', defaultKey);
      setApiKeyState(defaultKey);
      setApiKeySaved(true);
    }
  }, []);
  const [apiKey, setApiKeyState] = useState(localStorage.getItem('coinvault_github_key') || '');
  const [apiKeySaved, setApiKeySaved] = useState(hasApiKey());
  const [scanEmail, setScanEmail] = useState('');
  const [toast, setToast] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const update = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettingsState(next);
    saveSettings(next);
  };

  const saveKey = () => {
    setApiKey(apiKey);
    setApiKeySaved(true);
    showToast('API key saved');
  };

  const handleExportJSON = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `coinvault-backup-${Date.now()}.json`; a.click();
    showToast('Backup downloaded');
  };

  const handleExportCSV = () => {
    const csv = exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `coinvault-export-${Date.now()}.csv`; a.click();
    showToast('CSV exported');
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        importAllData(data);
        showToast('Data imported successfully');
      } catch { showToast('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    localStorage.removeItem('coinvault_collections');
    localStorage.removeItem('coinvault_coins');
    setShowClearConfirm(false);
    showToast('All data cleared');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Settings</h1>
        <p className="text-sm text-[#f5f0e8]/40 mt-1">Manage your CoinVault preferences</p>
      </div>

      <div className="space-y-5">
        {/* AI Configuration */}
        <Section title="AI Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">GitHub Models API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKeyState(e.target.value)}
                  placeholder="github_pat_..."
                  className={inputCls}
                />
                <button onClick={saveKey} className="px-4 py-2.5 rounded-lg bg-[#c9a84c]/20 text-[#e8c97a] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/30 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-1.5">
                  {apiKeySaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Key className="w-3.5 h-3.5" /> Save Key</>}
                </button>
              </div>
              <p className="text-xs text-[#f5f0e8]/30 mt-1">Required for AI grading, enrichment, and market value features. Get your PAT at github.com/settings/tokens</p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[#c9a84c]/10">
              <div>
                <p className="text-sm text-[#f5f0e8]/80">Auto-Enrich New Coins</p>
                <p className="text-xs text-[#f5f0e8]/30">Automatically fetch coin history when added</p>
              </div>
              <button onClick={() => update('aiAutoEnrich', !settings.aiAutoEnrich)}
                className={`w-10 h-6 rounded-full transition-all relative ${settings.aiAutoEnrich ? 'bg-[#c9a84c]' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.aiAutoEnrich ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[#c9a84c]/10">
              <div>
                <p className="text-sm text-[#f5f0e8]/80">Auto-Refresh Prices</p>
                <p className="text-xs text-[#f5f0e8]/30">Automatically update market values</p>
              </div>
              <button onClick={() => update('priceAutoRefresh', !settings.priceAutoRefresh)}
                className={`w-10 h-6 rounded-full transition-all relative ${settings.priceAutoRefresh ? 'bg-[#c9a84c]' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.priceAutoRefresh ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Default Currency</label>
              <select value={settings.currency} onChange={e => update('currency', e.target.value)} className={selectCls}>
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">Default Country Filter</label>
              <input value={settings.defaultCountry} onChange={e => update('defaultCountry', e.target.value)}
                placeholder="e.g. United States" className={inputCls} />
            </div>
          </div>
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#c9a84c]/30 text-[#e8c97a] bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" /> Export JSON Backup
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#c9a84c]/30 text-[#e8c97a] bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#f5f0e8]/20 text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:border-[#f5f0e8]/40 transition-colors text-sm font-medium cursor-pointer w-full">
              <Upload className="w-4 h-4" /> Import JSON Backup
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
            <button onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-colors text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Clear All Data
            </button>
          </div>
        </Section>

        {/* Coming Soon: Coin Scanner */}
        <Section title="Coin Scanner — Coming Soon">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/15">
            <Camera className="w-8 h-8 text-[#c9a84c]/50 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#f5f0e8]/70 mb-3">Point your camera at any coin and AI will auto-identify it and fill in all the details — denomination, year, mint, and grade — automatically.</p>
              <div className="flex gap-2">
                <input value={scanEmail} onChange={e => setScanEmail(e.target.value)}
                  placeholder="your@email.com" className={`${inputCls} flex-1`} />
                <button onClick={() => { if (scanEmail) { showToast("You're on the list!"); setScanEmail(''); } }}
                  className="px-3 py-2 rounded-lg bg-[#c9a84c]/20 text-[#e8c97a] border border-[#c9a84c]/30 text-xs font-medium whitespace-nowrap flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Notify Me
                </button>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="w-full max-w-sm rounded-2xl border border-red-500/30 p-6 text-center" style={{ background: '#0d1220' }}>
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#f5f0e8] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Clear All Data?</h3>
            <p className="text-sm text-[#f5f0e8]/50 mb-5">This will permanently delete all collections and coins. Export a backup first.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 px-4 py-2 rounded-lg border border-white/20 text-[#f5f0e8]/60 text-sm">Cancel</button>
              <button onClick={handleClearAll} className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-sm font-medium">Clear All</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl border border-[#c9a84c]/40 text-sm text-[#e8c97a] font-medium z-50"
          style={{ background: 'rgba(13,18,32,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}