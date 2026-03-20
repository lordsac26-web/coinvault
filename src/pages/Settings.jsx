import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, exportToCSV } from '@/components/storage';
import { hasApiKey } from '@/components/coinAI';
import { Key, Download, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setSettings(s);
      setApiKey(s.github_api_key || '');
      const keyOk = await hasApiKey();
      setHasKey(keyOk);
      setLoading(false);
    };
    load();
  }, []);

  const save = async (updates) => {
    if (!settings) return;
    setSaving(true);
    await saveSettings(settings.id, updates);
    setSettings({ ...settings, ...updates });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveApiKey = () => {
    save({ github_api_key: apiKey });
    setHasKey(!!apiKey);
  };

  const handleExportJSON = async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'coinvault-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csv = await exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'coinvault-coins.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-[#c9a84c]/30 border-t-[#e8c97a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-[#e8c97a] mb-5 sm:mb-8" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Settings</h1>

      <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 mb-4 sm:mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Key className="w-4 h-4 text-[#e8c97a]" />
          <h3 className="font-semibold text-[#f5f0e8] text-sm sm:text-base">AI API Key</h3>
          {hasKey && <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md font-medium">Active</span>}
        </div>
        <p className="text-xs text-[#f5f0e8]/35 mb-3 leading-relaxed">Enter your GitHub Models API key for AI grading, enrichment, and market values.</p>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="ghp_..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="bg-white/5 border-[#c9a84c]/15 text-[#f5f0e8] flex-1 h-11 rounded-xl"
          />
          <Button onClick={handleSaveApiKey} disabled={saving} className="bg-[#c9a84c] hover:bg-[#e8c97a] text-[#0a0e1a] h-11 px-5 rounded-xl font-semibold shrink-0">
            {saved ? <Check className="w-4 h-4" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5 mb-4 sm:mb-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="font-semibold text-[#f5f0e8] text-sm sm:text-base mb-4">Preferences</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-[#f5f0e8]">Auto-enrich new coins</p>
              <p className="text-xs text-[#f5f0e8]/35 mt-0.5">Automatically fetch historical data</p>
            </div>
            <Switch checked={settings?.ai_auto_enrich || false} onCheckedChange={v => save({ ai_auto_enrich: v })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-[#f5f0e8]">Currency</p>
              <p className="text-xs text-[#f5f0e8]/35 mt-0.5">Display currency for values</p>
            </div>
            <Input value={settings?.currency || 'USD'} onChange={e => save({ currency: e.target.value })}
              className="w-20 bg-white/5 border-[#c9a84c]/15 text-[#f5f0e8] text-center h-10 rounded-xl shrink-0" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#c9a84c]/10 p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="font-semibold text-[#f5f0e8] text-sm sm:text-base mb-4">Export Data</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={handleExportJSON} variant="outline" className="border-[#c9a84c]/15 text-[#f5f0e8] hover:bg-[#c9a84c]/10 gap-2 h-11 rounded-xl justify-center">
            <Download className="w-4 h-4" /> JSON Backup
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="border-[#c9a84c]/15 text-[#f5f0e8] hover:bg-[#c9a84c]/10 gap-2 h-11 rounded-xl justify-center">
            <Download className="w-4 h-4" /> CSV Export
          </Button>
        </div>
      </div>
    </div>
  );
}