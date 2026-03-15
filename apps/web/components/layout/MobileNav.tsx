'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Globe, Bot, BookOpen, List } from 'lucide-react';

const NAV = [
  { href: '/trading/dashboard', icon: LayoutDashboard, label: 'Home',    accent: '#00e5a0' },
  { href: '/trading/markets',   icon: Globe,           label: 'Markets', accent: '#3b82f6' },
  { href: '/trading/algo',      icon: Bot,             label: 'Algo',    accent: '#8b5cf6' },
  { href: '/trading/orders',    icon: BookOpen,        label: 'Orders',  accent: '#f59e0b' },
  { href: '/trading/watchlist', icon: List,            label: 'Watch',   accent: '#06b6d4' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-50
      flex items-center justify-around
      h-[68px] safe-area-pb px-2
    " style={{
      background: 'rgba(7, 8, 16, 0.95)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderTop: '1px solid rgba(255, 255, 255, 0.07)',
    }}>

      {NAV.map(({ href, icon: Icon, label, accent }) => {
        const active = pathname === href || (href !== '/trading/dashboard' && pathname.startsWith(href));
        return (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all relative"
            style={active ? { background: `${accent}14` } : {}}>

            {/* Active indicator dot */}
            {active && (
              <div className="absolute top-1 w-1 h-1 rounded-full"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
            )}

            <div className={`transition-all duration-200 ${active ? 'scale-110' : ''}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? accent : '#4a5275' }} />
            </div>

            <span className="text-[9px] font-semibold tracking-wide"
              style={{
                color: active ? accent : '#4a5275',
                fontFamily: 'Outfit, sans-serif',
              }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}