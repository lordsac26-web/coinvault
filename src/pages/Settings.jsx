import { useState, useEffect } from 'react';
import { getSettings, saveSettings, exportAllData, exportToCSV } from '@/components/storage';
import { Download, Sparkles, Palette, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { themeKey, setTheme, themes } = useTheme();
  const { user, isAuthenticated, logout, navigateToLogin } = useAuth();

  useEffect(() => {
    const load = async () => {
      const s = await getSettings();
      setSettings(s);
      setLoading(false);
    };
    load();
  }, []);

  const save = async (updates) => {
    if (!settings) return;
    await saveSettings(settings.id, updates);
    setSettings({ ...settings, ...updates });
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
        <div className="w-10 h-10 rounded-full border-4 animate-spin" style={{ borderColor: 'var(--cv-spinner-track)', borderTopColor: 'var(--cv-spinner-head)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-8" style={{ color: 'var(--cv-accent)', fontFamily: "'Playfair Display', Georgia, serif" }}>Settings</h1>

      {/* Account */}
      <div className="rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--cv-text)' }}>Account</h3>
        </div>
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'var(--cv-accent-bg)', color: 'var(--cv-accent)', border: '1px solid var(--cv-accent-border)' }}>
                {(user.full_name || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                {user.full_name && <p className="text-sm font-medium truncate" style={{ color: 'var(--cv-text)' }}>{user.full_name}</p>}
                <p className="text-xs truncate" style={{ color: 'var(--cv-text-muted)' }}>{user.email}</p>
              </div>
            </div>
            <Button onClick={() => logout()} className="gap-2 h-10 rounded-xl w-full sm:w-auto"
              style={{ background: 'var(--cv-input-bg)', color: 'var(--cv-text-secondary)', border: '1px solid var(--cv-border)' }}>
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--cv-text-muted)' }}>Sign in to sync your collection across devices.</p>
            <Button onClick={() => navigateToLogin()} className="gap-2 h-10 rounded-xl"
              style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}>
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </div>
        )}
      </div>

      {/* Theme Picker */}
      <div className="rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--cv-text)' }}>Theme</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(themes).map(([key, theme]) => (
            <button key={key} onClick={() => setTheme(key)}
              className="rounded-xl p-3 text-left transition-all"
              style={{
                border: themeKey === key ? '2px solid var(--cv-accent)' : '1px solid var(--cv-border)',
                background: themeKey === key ? 'var(--cv-accent-bg)' : 'var(--cv-bg-card)',
              }}>
              <div className="flex gap-1 mb-2">
                {theme.preview.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                ))}
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--cv-text)' }}>{theme.name}</p>
              <p className="text-[10px]" style={{ color: 'var(--cv-text-muted)' }}>{theme.desc}</p>
              {settings?.default_theme === key && (
                <p className="text-[9px] font-bold mt-1" style={{ color: 'var(--cv-accent)' }}>★ Default</p>
              )}
            </button>
          ))}
        </div>
        <Button
          onClick={async () => {
            await save({ default_theme: themeKey });
          }}
          className="mt-3 gap-2 h-9 rounded-xl text-xs"
          style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}
        >
          <Palette className="w-3.5 h-3.5" /> Save "{themes[themeKey]?.name}" as Default
        </Button>
      </div>

      <div className="rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--cv-accent)' }} />
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--cv-text)' }}>AI Features</h3>
          <span className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md font-medium">Built-in</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--cv-text-muted)' }}>AI grading, enrichment, and market values are powered by Base44's built-in AI. No API key needed.</p>
      </div>

      <div className="rounded-2xl p-4 sm:p-5 mb-4 sm:mb-6" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <h3 className="font-semibold text-sm sm:text-base mb-4" style={{ color: 'var(--cv-text)' }}>Preferences</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm" style={{ color: 'var(--cv-text)' }}>Auto-enrich new coins</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>Automatically fetch historical data</p>
            </div>
            <Switch checked={settings?.ai_auto_enrich || false} onCheckedChange={v => save({ ai_auto_enrich: v })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm" style={{ color: 'var(--cv-text)' }}>Currency</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--cv-text-muted)' }}>Display currency for values</p>
            </div>
            <Input value={settings?.currency || 'USD'} onChange={e => save({ currency: e.target.value })}
              className="w-20 text-center h-10 rounded-xl shrink-0" style={{ background: 'var(--cv-input-bg)', border: '1px solid var(--cv-accent-border)', color: 'var(--cv-text)' }} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 sm:p-5" style={{ border: '1px solid var(--cv-border)', background: 'var(--cv-bg-card)' }}>
        <h3 className="font-semibold text-sm sm:text-base mb-4" style={{ color: 'var(--cv-text)' }}>Export Data</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={handleExportJSON} className="gap-2 h-11 rounded-xl justify-center" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}>
            <Download className="w-4 h-4" /> JSON Backup
          </Button>
          <Button onClick={handleExportCSV} className="gap-2 h-11 rounded-xl justify-center" style={{ background: 'var(--cv-accent-dim)', color: 'var(--cv-accent-text)', border: 'none' }}>
            <Download className="w-4 h-4" /> CSV Export
          </Button>
        </div>
      </div>
    </div>
  );
}