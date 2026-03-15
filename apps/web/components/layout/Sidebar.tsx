
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Globe, BookOpen, List,
  Trophy, Bot, TrendingUp, Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/trading/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, accent: '#00e5a0' },
  { href: '/trading/markets',     label: 'Markets',     icon: Globe,           accent: '#3b82f6' },
  { href: '/trading/algo',        label: 'Algo',        icon: Bot,             accent: '#8b5cf6', badge: 'AI' },
  { href: '/trading/orders',      label: 'Orders',      icon: BookOpen,        accent: '#f59e0b' },
  { href: '/trading/watchlist',   label: 'Watchlist',   icon: List,            accent: '#06b6d4' },
  { href: '/trading/leaderboard', label: 'Leaderboard', icon: Trophy,          accent: '#f43f5e' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="
      fixed left-0 top-0 bottom-0 z-40
      w-[72px] xl:w-[220px]
      flex-col
      hidden md:flex
    " style={{
      background: 'rgba(11, 12, 23, 0.4)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '10px 0 30px -10px rgba(0, 0, 0, 0.5)',
    }}>

      {/* ── Logo ─────────────────────────────────────────────── */}
      <Link href="/trading/dashboard"
        className="flex items-center gap-3 px-4 py-5 group flex-shrink-0">
        {/* 3D logo cube */}
        <div className="relative w-9 h-9 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden
            group-hover:scale-110 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00e5a0, #00c4ff)',
              boxShadow: '0 4px 20px rgba(0, 229, 160, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
            }}>
            <TrendingUp size={18} className="text-[#04050d]" strokeWidth={2.5} />
            {/* shine */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
          </div>
          {/* live dot */}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#00e5a0] rounded-full border-2 border-[#07080f] animate-pulse" />
        </div>

        <div className="hidden xl:block overflow-hidden">
          <p className="text-sm font-bold text-white leading-none"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
            PaperTrade
          </p>
          <p className="text-[10px] text-[#00e5a0] font-medium mt-0.5 tracking-widest uppercase">Neural Grid</p>
        </div>
      </Link>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="mx-3 mb-2 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* ── Nav items ────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-hide">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent, badge }) => {
          const active = pathname === href || (href !== '/trading/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 relative overflow-hidden
                ${active
                  ? 'text-white'
                  : 'text-[#4a5275] hover:text-[#8892b0]'}
              `}
              style={active ? {
                background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
                borderLeft: `2px solid ${accent}`,
                paddingLeft: '10px',
              } : {
                borderLeft: '2px solid transparent',
              }}>

              {/* Active glow behind icon */}
              {active && (
                <div className="absolute left-0 inset-y-0 w-full opacity-30 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 0% 50%, ${accent}30, transparent 70%)` }} />
              )}

              {/* Icon */}
              <div className={`relative z-10 w-5 h-5 flex-shrink-0 transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon size={18} style={{ color: active ? accent : undefined }} strokeWidth={active ? 2 : 1.75} />
              </div>

              {/* Label */}
              <span className={`hidden xl:block text-sm font-medium relative z-10 transition-colors ${active ? 'text-white' : ''}`}
                style={{ fontFamily: 'Outfit, sans-serif', color: active ? accent : undefined }}>
                {label}
              </span>

              {/* Badge */}
              {badge && (
                <span className="hidden xl:flex ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full items-center"
                  style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="mx-3 mb-2 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

      {/* ── Market status ────────────────────────────────────── */}
      <MarketStatus />

      {/* ── Version ──────────────────────────────────────────── */}
      <div className="px-4 pb-5 hidden xl:block">
        <div className="flex items-center gap-2 p-2.5 rounded-xl"
          style={{ background: 'rgba(0, 229, 160, 0.04)', border: '1px solid rgba(0, 229, 160, 0.1)' }}>
          <Zap size={11} className="text-[#00e5a0]" />
          <span className="text-[10px] text-[#00e5a0] font-medium">Paper Trading Mode</span>
        </div>
      </div>
    </aside>
  );
}

function MarketStatus() {
  const now   = new Date();
  const et    = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const h     = et.getHours(), m = et.getMinutes(), d = et.getDay();
  const mins  = h * 60 + m;
  const open  = d >= 1 && d <= 5 && mins >= 570 && mins < 960;

  return (
    <div className="px-3 pb-3 hidden xl:block">
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
        style={{ background: open ? 'rgba(0, 229, 160, 0.06)' : 'rgba(244, 63, 94, 0.06)', border: `1px solid ${open ? 'rgba(0, 229, 160, 0.15)' : 'rgba(244, 63, 94, 0.15)'}` }}>
        <div className="relative flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${open ? 'bg-[#00e5a0]' : 'bg-[#f43f5e]'}`} />
          {open && <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#00e5a0] animate-ping opacity-60" />}
        </div>
        <div>
          <p className={`text-[11px] font-semibold ${open ? 'text-[#00e5a0]' : 'text-[#f43f5e]'}`}>
            Market {open ? 'Open' : 'Closed'}
          </p>
          <p className="text-[9px] text-[#4a5275]">
            {et.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET
          </p>
        </div>
      </div>
    </div>
  );
}