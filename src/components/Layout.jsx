import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Coins, LayoutGrid, BookOpen, TrendingUp, BarChart3, User, CircleDollarSign, ScanBarcode, Grid3X3, FileText, ShoppingBag, MessageSquare } from 'lucide-react';
import SpotPriceWidget from '@/components/SpotPriceWidget';
import MessageInbox from '@/components/MessageInbox';
import { base44 } from '@/api/base44Client';
import ScanLookup from '@/components/ScanLookup';
import GlobalSearch from '@/components/GlobalSearch';

const navItems = [
  { label: 'Collections', path: '/dashboard', icon: LayoutGrid },
  { label: 'Catalog', path: '/catalog', icon: BookOpen },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Prices', path: '/price-guide', icon: TrendingUp },
  { label: 'Album', path: '/album', icon: Grid3X3 },
  { label: 'Exchange', path: '/marketplace', icon: ShoppingBag },
  { label: 'Settings', path: '/settings', icon: User },
  { label: 'Docs', path: '/docs', icon: FileText },
];

export default function Layout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const [showSpotWidget, setShowSpotWidget] = useState(() => localStorage.getItem('spotWidgetEnabled') === 'true');
  const [showInbox, setShowInbox] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u?.email) {
        base44.entities.Message.filter({ to_email: u.email, is_read: false }, '-created_date', 50)
          .then(msgs => setUnreadCount(msgs.length))
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 xl:px-6 flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, var(--cv-accent-dim), var(--cv-accent))' }}>
              <Coins className="w-3.5 h-3.5" style={{ color: 'var(--cv-accent-text)' }} />
            </div>
            <span className="text-base font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--cv-accent)' }}>CoinVault</span>
          </Link>
          <div className="flex items-center gap-0.5">
            <GlobalSearch />
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link key={path} to={path}
                className="flex items-center gap-1 px-2 xl:px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={isActive(path) ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-secondary)' }}>
                <Icon className="w-4 h-4" /> <span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
            <button onClick={toggleSpotWidget}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-1"
              style={showSpotWidget ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-secondary)' }}>
              <CircleDollarSign className="w-4 h-4" /> Spot
            </button>
            <button onClick={() => setShowInbox(true)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-1"
              style={{ color: 'var(--cv-text-secondary)' }}>
              <MessageSquare className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center bg-red-500 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
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
          <div className="flex items-center gap-1">
            <GlobalSearch compact />
            <button onClick={toggleSpotWidget} className="p-1.5 rounded-lg transition-colors"
              style={showSpotWidget ? { color: 'var(--cv-accent)', background: 'var(--cv-accent-bg)' } : { color: 'var(--cv-text-muted)' }}>
              <CircleDollarSign className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{ background: 'var(--cv-bg-nav)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--cv-accent-border)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)' }}>
        <div className="flex items-center justify-around h-14">
          {navItems.slice(0, 2).map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] transition-colors"
              style={{ color: isActive(path) ? 'var(--cv-accent)' : 'var(--cv-text-muted)' }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
          {/* Center scan button */}
          <button onClick={() => setShowScanner(true)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] -mt-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--cv-accent-dim), var(--cv-accent))' }}>
              <ScanBarcode className="w-5 h-5" style={{ color: 'var(--cv-accent-text)' }} />
            </div>
            <span className="text-[10px] font-medium leading-none" style={{ color: 'var(--cv-accent)' }}>Scan</span>
          </button>
          {[navItems[2], navItems[4]].map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[52px] transition-colors"
              style={{ color: isActive(path) ? 'var(--cv-accent)' : 'var(--cv-text-muted)' }}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {showSpotWidget && <SpotPriceWidget onClose={toggleSpotWidget} />}
      {showInbox && currentUser && <MessageInbox currentUser={currentUser} onClose={() => { setShowInbox(false); setUnreadCount(0); }} />}
      {showScanner && <ScanLookup onClose={() => setShowScanner(false)} />}

      <main className="pt-12 md:pt-14 pb-24 md:pb-0 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}