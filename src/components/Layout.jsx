import { Link, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Coins, LayoutGrid, BookOpen, TrendingUp, BarChart3, User, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'Collections', path: '/collections', icon: LayoutGrid },
  { label: 'Catalog', path: '/catalog', icon: BookOpen },
  { label: 'Price Guide', path: '/price-guide', icon: TrendingUp },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Profile', path: '/settings', icon: User },
];

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-[#f5f0e8]" style={{ fontFamily: "'Source Sans 3', 'Source Sans Pro', sans-serif" }}>
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px',
      }} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#c9a84c]/20" style={{ background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#e8c97a] flex items-center justify-center shadow-lg group-hover:shadow-[#c9a84c]/40 transition-shadow">
              <Coins className="w-4 h-4 text-[#0a0e1a]" />
            </div>
            <span className="text-lg font-bold tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#e8c97a' }}>
              CoinVault
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ label, path, icon: Icon }) => {
              const active = location.pathname === path || location.pathname.startsWith(path + '/');
              return (
                <Link key={path} to={path} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'text-[#e8c97a] bg-[#c9a84c]/10' : 'text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-[#f5f0e8]/70 hover:text-[#e8c97a]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#c9a84c]/20 bg-[#0a0e1a] px-4 pb-4 pt-2">
            {navItems.map(({ label, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${active ? 'text-[#e8c97a] bg-[#c9a84c]/10' : 'text-[#f5f0e8]/60 hover:text-[#f5f0e8]'}`}>
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Content */}
      <main className="pt-16 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}