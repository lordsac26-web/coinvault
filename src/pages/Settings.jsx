import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, exportToCSV } from '../lib/storage';
import { Settings as SettingsIcon, Download, Upload, Key, Camera, Mail, Check, Loader2 } from 'lucide-react';

const inputCls = "w-full bg-white/5 border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] placeholder-[#f5f0e8]/30 focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";
const selectCls = "w-full bg-[#111827] border border-[#c9a84c]/20 rounded-lg px-3 py-2.5 text-[#f5f0e8] focus:outline-none focus:border-[#c9a84c]/60 transition-colors text-sm";

const Section = ({ title, children }) => (
  <div className="rounded-2xl border border-[#c9a84c]/20 p-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
    <h3 className="text-base font-semibold text-[#e8c97a] mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{title}</h3>
    {children}
  </div>
);

export default function Settings() {
  const [settings, setSettingsState] = useState(null);
  const [apiKey, setApiKeyState] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [scanEmail, setScanEmail] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettingsState(s);
      setApiKeyState(s.github_api_key || '');
      setApiKeySaved(!!s.github_api_key);
      setLoading(false);
    })();
  }, []);

  const update = async (key, val) => {
    const next = { ...settings, [key]: val };
    setSettingsState(next);
    await saveSettings(settings.id, { [key]: val });
  };

  const saveKey = async () => {
    await saveSettings(settings.id, { github_api_key: apiKey });
    setApiKeySaved(true);
    showToast('API key saved');
  };

  const handleExportJSON = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `coinvault-backup-${Date.now()}.json`; a.click();
    showToast('Backup downloaded');
  };

  const handleExportCSV = async () => {
    const csv = await exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `coinvault-export-${Date.now()}.csv`; a.click();
    showToast('CSV exported');
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f0e8]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Settings</h1>
        <p className="text-sm text-[#f5f0e8]/40 mt-1">Manage your CoinVault preferences</p>
      </div>

      <div className="space-y-5">
        <Section title="AI Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#f5f0e8]/50 uppercase tracking-wider mb-1.5">GitHub Models API Key</label>
              <div className="flex gap-2">
                <input type="password" value={apiKey} onChange={e => setApiKeyState(e.target.value)}
                  placeholder="github_pat_..." className={inputCls} />
                <button onClick={saveKey} className="px-4 py-2.5 rounded-lg bg-[#c9a84c]/20 text-[#e8c97a] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/30 transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-1.5">
                  {apiKeySaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Key className="w-3.5 h-3.5" /> Save Key</>}
                </button>
              </div>
              <p className="text-xs text-[#f5f0e8]/30 mt-1">Required for AI grading, enrichment, and market value features. Get your PAT at <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-[#c9a84c]/60 hover:text-[#c9a84c] underline">github.com/settings/tokens</a></p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[#c9a84c]/10">
              <div>
                <p className="text-sm text-[#f5f0e8]/80">Auto-Enrich New Coins</p>
                <p className="text-xs text-[#f5f0e8]/30">Automatically fetch coin history when added</p>
              </div>
              <button onClick={() => update('ai_auto_enrich', !settings.ai_auto_enrich)}
                className={`w-10 h-6 rounded-full transition-all relative ${settings.ai_auto_enrich ? 'bg-[#c9a84c]' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.ai_auto_enrich ? 'left-5' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[#c9a84c]/10">
              <div>
                <p className="text-sm text-[#f5f0e8]/80">Auto-Refresh Prices</p>
                <p className="text-xs text-[#f5f0e8]/30">Automatically update market values</p>
              </div>
              <button onClick={() => update('price_auto_refresh', !settings.price_auto_refresh)}
                className={`w-10 h-6 rounded-full transition-all relative ${settings.price_auto_refresh ? 'bg-[#c9a84c]' : 'bg-white/10'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.price_auto_refresh ? 'left-5' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </Section>

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
              <input value={settings.default_country || ''} onChange={e => update('default_country', e.target.value)}
                placeholder="e.g. United States" className={inputCls} />
            </div>
          </div>
        </Section>

        <Section title="Data Management">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportJSON}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#c9a84c]/30 text-[#e8c97a] bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" /> Export JSON
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#c9a84c]/30 text-[#e8c97a] bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </Section>

        <Section title="Coin Scanner \u2014 Coming Soon">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#c9a84c]/5 border border-[#c9a84c]/15">
            <Camera className="w-8 h-8 text-[#c9a84c]/50 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#f5f0e8]/70 mb-3">Point your camera at any coin and AI will auto-identify it.</p>
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-xl border border-[#c9a84c]/40 text-sm text-[#e8c97a] font-medium z-50"
          style={{ background: 'rgba(13,18,32,0.95)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  );
}