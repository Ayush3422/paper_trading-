'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  TrendingUp, LayoutDashboard, List, BookOpen,
  Trophy, Settings, Bell, LogOut, Search, X, Globe, Bot,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';

const NAV = [
  { href: '/trading/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/trading/markets',    label: 'Markets',    icon: Globe            },
  { href: '/trading/algo',       label: 'Algo',       icon: Bot              },
  { href: '/trading/orders',     label: 'Orders',     icon: BookOpen         },
  { href: '/trading/watchlist',  label: 'Watchlist',  icon: List             },
  { href: '/trading/leaderboard',label: 'Leaderboard',icon: Trophy           },
];

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/market/search?q=${q}`);
      setResults(res.data.data || []);
    } finally { setLoading(false); }
  };

  const handleLogout = () => { logout(); router.push('/auth/login'); };
  const clearSearch  = () => { setSearch(''); setResults([]); };

  return (
    <nav className="h-14 bg-[#111] border-b border-[#1e1e1e] flex items-center px-4 gap-3 fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <Link href="/trading/dashboard" className="flex items-center gap-2 mr-2 flex-shrink-0">
        <div className="w-7 h-7 bg-[#00d4a0] rounded-lg flex items-center justify-center">
          <TrendingUp size={15} className="text-black" />
        </div>
        <span className="text-white font-bold text-sm hidden lg:block">PaperTrade</span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/trading/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? href === '/trading/algo'
                    ? 'bg-[#6366f120] text-[#6366f1] border border-[#6366f130]'
                    : 'bg-[#00d4a020] text-[#00d4a0] border border-[#00d4a030]'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
              }`}>
              <Icon size={13} />
              {label}
              {label === 'Algo' && (
                <span className="text-[8px] font-bold bg-[#6366f1] text-white px-1 py-0.5 rounded-full">AI</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-sm relative mx-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search stocks, ETFs..."
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4a0] transition-colors"
          />
          {search && (
            <button onClick={clearSearch} className="absolute right-2.5 top-2.5 text-gray-500 hover:text-gray-300">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {(results.length > 0 || (loading && search)) && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
            {loading && <div className="px-4 py-2.5 text-xs text-gray-500 animate-pulse">Searching...</div>}
            {results.slice(0, 7).map(r => (
              <button key={r.symbol}
                onClick={() => { router.push(`/trading/trade/${r.symbol}`); clearSearch(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#252525] transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-[#262626] border border-[#333] flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-300">{r.symbol?.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm font-bold leading-none">{r.symbol}</p>
                  <p className="text-gray-500 text-[11px] truncate mt-0.5">{r.name}</p>
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0 bg-[#262626] px-1.5 py-0.5 rounded">{r.exchange}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
          <Bell size={15} />
        </button>
        <Link href="/trading/settings"
          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-colors">
          <Settings size={14} />
        </Link>
        <div className="w-7 h-7 rounded-full bg-[#00d4a020] border border-[#00d4a050] flex items-center justify-center text-[#00d4a0] text-xs font-bold select-none">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <button onClick={handleLogout}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-[#ff4d4d] hover:bg-[#1a1a1a] rounded-lg transition-colors"
          title="Logout">
          <LogOut size={14} />
        </button>
      </div>
    </nav>
  );
}