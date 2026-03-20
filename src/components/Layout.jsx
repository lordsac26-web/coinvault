import { Link, useLocation, Outlet } from 'react-router-dom';
import { Coins, LayoutGrid, BookOpen, TrendingUp, BarChart3, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

const navItems = [
  { label: 'Collections', path: '/dashboard', icon: LayoutGrid },
  { label: 'Catalog', path: '/catalog', icon: BookOpen },
  { label: 'Prices', path: '/price-guide', icon: TrendingUp },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f5f0e8]" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      {/* Subtle grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px',
      }} />

      {/* Top nav — desktop only */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#c9a84c]/15 hidden md:block" style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c97a] flex items-center justify-center shadow-lg group-hover:shadow-[#c9a84c]/30 transition-shadow">
              <Coins className="w-3.5 h-3.5 text-[#0a0e1a]" />
            </div>
            <span className="text-base font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#e8c97a' }}>
              CoinVault
            </span>
          </Link>
          <div className="flex items-center gap-0.5">
            {navItems.map(({ label, path, icon: Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isActive(path) ? 'text-[#e8c97a] bg-[#c9a84c]/10' : 'text-[#f5f0e8]/50 hover:text-[#f5f0e8] hover:bg-white/5'}`}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile top bar — logo only */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden border-b border-[#c9a84c]/10" style={{ background: 'rgba(10,14,26,0.95)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-center h-12">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c97a] flex items-center justify-center">
              <Coins className="w-3 h-3 text-[#0a0e1a]" />
            </div>
            <span className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#e8c97a' }}>
              CoinVault
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[#c9a84c]/15 pb-[env(safe-area-inset-bottom)]" style={{ background: 'rgba(10,14,26,0.97)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px] transition-colors ${isActive(path) ? 'text-[#e8c97a]' : 'text-[#f5f0e8]/35'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="pt-12 md:pt-14 pb-20 md:pb-0 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}