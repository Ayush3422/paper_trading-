'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, X, ChevronRight, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth.store';
import { apiClient } from '@/lib/api/client';

const PAGE_TITLES: Record<string, string> = {
  '/trading/dashboard':   'Dashboard',
  '/trading/markets':     'Markets',
  '/trading/algo':        'Algo Trading',
  '/trading/orders':      'Orders',
  '/trading/watchlist':   'Watchlist',
  '/trading/leaderboard': 'Leaderboard',
};

export function TopBar() {
  const { user, logout }  = useAuthStore();
  const router            = useRouter();
  const pathname          = usePathname();
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] || 'Trade';
  const isTradeSymbol = pathname.startsWith('/trading/trade/');
  const symbol = isTradeSymbol ? pathname.split('/').pop() : null;

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/market/search?q=${q}`);
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => { setSearch(''); setResults([]); };

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (searchRef.current  && !searchRef.current.contains(e.target  as Node)) setFocused(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'TU';

  return (
    <header className="
      fixed top-0 right-0 left-0 md:left-[72px] xl:left-[220px]
      h-16 z-30 flex items-center gap-4 px-5
    " style={{
      background: 'rgba(4, 5, 13, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    }}>

      {/* ── Page title (hidden on mobile, shown md+) ─────────── */}
      <div className="hidden md:block flex-shrink-0">
        {symbol ? (
          <div className="flex items-center gap-2">
            <span className="text-[#4a5275] text-sm">Markets</span>
            <ChevronRight size={13} className="text-[#4a5275]" />
            <span className="text-white font-bold text-sm font-mono">{symbol}</span>
          </div>
        ) : (
          <h1 className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{pageTitle}</h1>
        )}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div ref={searchRef} className="flex-1 max-w-md relative mx-auto">
        <div className="relative">
          <Search size={13} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${focused ? 'text-[#00e5a0]' : 'text-[#4a5275]'}`} />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search stocks, ETFs, crypto..."
            className="w-full h-9 pl-9 pr-8 text-xs text-[#f0f2ff] placeholder-[#4a5275] rounded-xl outline-none transition-all"
            style={{
              background: focused ? 'rgba(0, 229, 160, 0.04)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${focused ? 'rgba(0, 229, 160, 0.4)' : 'rgba(255, 255, 255, 0.07)'}`,
              fontFamily: 'Outfit, sans-serif',
              boxShadow: focused ? '0 0 0 3px rgba(0, 229, 160, 0.08), 0 0 20px rgba(0, 229, 160, 0.05)' : 'none',
            }}
          />
          {search && (
            <button onClick={clear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#4a5275] hover:text-white transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {focused && (results.length > 0 || (loading && search)) && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden animate-fade-in-scale z-50"
            style={{
              background: 'rgba(11, 12, 23, 0.98)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}>
            {loading && (
              <div className="px-4 py-3 flex items-center gap-2.5 text-xs text-[#4a5275]">
                <div className="w-3 h-3 border-2 border-[#4a5275] border-t-[#00e5a0] rounded-full animate-spin" />
                Searching markets...
              </div>
            )}
            {results.slice(0, 7).map((r: any, i) => (
              <button key={r.symbol} onClick={() => { router.push(`/trading/trade/${r.symbol}`); clear(); setFocused(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'rgba(0, 229, 160, 0.1)', color: '#00e5a0', fontFamily: 'JetBrains Mono, monospace' }}>
                  {r.symbol?.slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{r.symbol}</p>
                  <p className="text-[10px] text-[#4a5275] truncate max-w-[200px]">{r.name}</p>
                </div>
                <div className="ml-auto text-[10px] text-[#4a5275]">{r.type || 'Stock'}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right actions ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-white/[0.05]"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <Bell size={15} className="text-[#4a5275]" />
          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#f43f5e] rounded-full" />
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-white/[0.04]"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, #00e5a0, #3b82f6)', color: '#04050d', fontFamily: 'Syne, sans-serif' }}>
              {initials}
            </div>
            <span className="text-xs text-[#8892b0] hidden lg:block" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {user?.username || 'Trader'}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden animate-fade-in-scale z-50"
              style={{
                background: 'rgba(11, 12, 23, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.09)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
              }}>
              <div className="px-4 py-3.5 border-b border-white/[0.06]">
                <p className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.username}</p>
                <p className="text-[11px] text-[#4a5275] mt-0.5">{user?.email}</p>
              </div>
              {[
                { icon: Settings, label: 'Settings', href: '/trading/settings' },
                { icon: LogOut,   label: 'Sign out',  onClick: () => { logout(); router.push('/auth/login'); } },
              ].map(({ icon: Icon, label, href, onClick }) => (
                <button key={label}
                  onClick={() => { setProfileOpen(false); onClick ? onClick() : router.push(href!); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors">
                  <Icon size={14} className="text-[#4a5275]" />
                  <span className="text-sm text-[#8892b0]" style={{ fontFamily: 'Outfit, sans-serif' }}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}