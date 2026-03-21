import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Coins, LayoutGrid, BookOpen, TrendingUp, BarChart3, User, CircleDollarSign, ScanBarcode, Album } from 'lucide-react';
import SpotPriceWidget from '@/components/SpotPriceWidget';
import ScanLookup from '@/components/ScanLookup';

const navItems = [
  { label: 'Collections', path: '/dashboard', icon: LayoutGrid },
  { label: 'Album', path: '/album', icon: Album },
  { label: 'Catalog', path: '/catalog', icon: BookOpen },
  { label: 'Prices', path: '/price-guide', icon: TrendingUp },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const [showSpotWidget, setShowSpotWidget] = useState(() => localStorage.getItem('spotWidgetEnabled') === 'true');
  const [showScanner, setShowScanner] = useState(false);

  const toggleSpotWidget = () => {
    const next = !showSpotWidget;
    setShowSpotWidget(next);
    localStorage.setItem('spotWidgetEnabled', String(next));
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--cv-bg)', color: 'var(--cv-text)', fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '200px',
      }} />

      {/* Desktop nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 hidden md:block" style={{ background: 'var(--cv-bg-nav)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--cv-accent-border)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--cv-accent-dim), var(--cv-accent))' }}>
              <Coins className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)' }} />
            </div>
            <span className="text-base font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--cv-accent)' }}>CoinVault</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link key={path} to={path}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={isActive(path) ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-secondary)' }}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
            <button onClick={toggleSpotWidget}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-1"
              style={showSpotWidget ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-secondary)' }}>
              <CircleDollarSign className="w-4 h-4" /> Spot
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden" style={{ background: 'var(--cv-bg-nav)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--cv-border)' }}>
        <div className="flex items-center justify-between h-12 px-4">
          <Link to="/settings" className="p-1.5 rounded-lg transition-colors"
            style={isActive('/settings') ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-muted)' }}>
            <User className="w-5 h-5" />
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--cv-accent-dim), var(--cv-accent))' }}>
              <Coins className="w-3 h-3" style={{ color: 'var(--cv-accent-text)' }} />
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--cv-accent)' }}>CoinVault</span>
          </Link>
          <button onClick={toggleSpotWidget} className="p-1.5 rounded-lg transition-colors"
            style={showSpotWidget ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-muted)' }}>
            <CircleDollarSign className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]" style={{ background: 'var(--cv-bg-nav)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--cv-accent-border)' }}>
        <div className="flex items-center justify-around h-14">
          {navItems.slice(0, 2).map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] transition-colors"
              style={{ color: isActive(path) ? 'var(--cv-accent)' : 'var(--cv-text-muted)' }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
          {/* Center scan button */}
          <button onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] -mt-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--cv-accent-dim), var(--cv-accent))' }}>
              <ScanBarcode className="w-5 h-5" style={{ color: 'var(--cv-accent-text)' }} />
            </div>
            <span className="text-[10px] font-medium leading-none" style={{ color: 'var(--cv-accent)' }}>Scan</span>
          </button>
          {navItems.slice(2, 4).map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] transition-colors"
              style={{ color: isActive(path) ? 'var(--cv-accent)' : 'var(--cv-text-muted)' }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {showSpotWidget && <SpotPriceWidget onClose={toggleSpotWidget} />}
      {showScanner && <ScanLookup onClose={() => setShowScanner(false)} />}

      <main className="pt-12 md:pt-14 pb-20 md:pb-0 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}