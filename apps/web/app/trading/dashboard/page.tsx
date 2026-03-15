'use client';
import { useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { PortfolioSummaryBar }  from '@/components/dashboard/PortfolioSummaryBar';
import { EquityCurve }          from '@/components/dashboard/EquityCurve';
import { SectorAllocation }     from '@/components/dashboard/SectorAllocation';
import { PerformanceMetrics }   from '@/components/dashboard/PerformanceMetrics';
import { PositionHeatmap }      from '@/components/dashboard/PositionHeatmap';
import { MarketOverviewWidget } from '@/components/dashboard/MarketOverviewWidget';
import { RecentTradesWidget }   from '@/components/dashboard/RecentTradesWidget';
import { WatchlistWidget }      from '@/components/dashboard/WatchlistWidget';
import { AlgoPositionsWidget }  from '@/components/dashboard/AlgoPositionsWidget';
import { NewsWidget }           from '@/components/markets/NewsWidget';
import { apiClient }            from '@/lib/api/client';
import { RefreshCw, LayoutDashboard, TrendingUp, Layers, Bot } from 'lucide-react';

const TABS = [
  { label: 'Overview',  icon: LayoutDashboard, accent: '#00e5a0' },
  { label: 'Analytics', icon: TrendingUp,       accent: '#3b82f6' },
  { label: 'Positions', icon: Layers,           accent: '#8b5cf6' },
  { label: 'Algo',      icon: Bot,             accent: '#f59e0b' },
];

export default function DashboardPage() {
  const [tab, setTab]               = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const qc = useQueryClient();

  const { data: algoData } = useQuery({
    queryKey: ['algo-positions'],
    queryFn:  () => apiClient.get('/api/v1/algo-positions').then(r => r.data.data),
    refetchInterval: 60_000,
  });
  const algoCount = algoData?.positions?.length || 0;

  const refresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setRefreshing(false), 800);
  };

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-12 page-enter">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[#4a5275] text-xs font-medium mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {greeting} 👋
          </p>
          <h1 className="text-2xl font-bold text-white"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Trading Dashboard
          </h1>
          <p className="text-[#4a5275] text-xs mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex items-center gap-1 p-1 rounded-2xl"
            style={{ background: 'rgba(11, 12, 23, 0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}>
            {TABS.map(({ label, icon: Icon, accent }, i) => (
              <button key={label} onClick={() => setTab(i)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={tab === i
                  ? { background: `${accent}18`, color: accent, border: `1px solid ${accent}35`, fontFamily: 'Outfit, sans-serif' }
                  : { color: '#4a5275', fontFamily: 'Outfit, sans-serif', border: '1px solid transparent' }}>
                <Icon size={12} />
                <span className="hidden sm:block">{label}</span>
                {label === 'Algo' && algoCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ml-0.5"
                    style={{ background: accent, color: '#04050d' }}>
                    {algoCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <button onClick={refresh}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:bg-white/[0.05]"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(11,12,23,0.8)' }}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#00e5a0]' : 'text-[#4a5275]'} />
          </button>
        </div>
      </div>

      {/* ── Summary (always visible) ─────────────────────────── */}
      <PortfolioSummaryBar />

      {/* ── Market ticker (always visible) ───────────────────── */}
      <MarketOverviewWidget />

      {/* ══════════════════════════════════════════════════════ */}
      {/* OVERVIEW                                               */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <div className="space-y-5 stagger">
          <EquityCurve />

          {algoCount > 0 && (
            <GlassSection title="Algo Positions" icon={Bot} accent="#8b5cf6" badge={`${algoCount} open`}>
              <AlgoPositionsWidget />
            </GlassSection>
          )}

          <PositionHeatmap />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SectorAllocation />
            <PerformanceMetrics />
            <WatchlistWidget />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2"><RecentTradesWidget /></div>
            <div><NewsWidget limit={5} /></div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ANALYTICS                                              */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <div className="space-y-5 stagger">
          <EquityCurve />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectorAllocation />
            <PerformanceMetrics />
          </div>
          <RecentTradesWidget />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* POSITIONS                                              */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <div className="space-y-5 stagger">
          <PositionHeatmap />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <WatchlistWidget />
            <NewsWidget limit={6} />
          </div>
          <RecentTradesWidget />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ALGO                                                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <div className="space-y-5 stagger">
          {algoCount === 0 && (
            <div className="rounded-2xl p-5 flex items-center gap-4"
              style={{ background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
                <Bot size={18} className="text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>No algo positions open</p>
                <p className="text-[#4a5275] text-xs mt-0.5">
                  Activate a strategy in{' '}
                  <a href="/trading/algo" className="text-[#8b5cf6] hover:underline">Algo Trading</a>{' '}
                  — positions appear here automatically when buy conditions trigger.
                </p>
              </div>
            </div>
          )}
          <AlgoPositionsWidget />
        </div>
      )}
    </div>
  );
}

/* ── Section wrapper with glass header ────────────────────────── */
function GlassSection({ title, icon: Icon, accent, badge, children }: {
  title: string; icon: any; accent: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(11, 12, 23, 0.6)',
        border: `1px solid rgba(255,255,255,0.07)`,
        backdropFilter: 'blur(20px)',
      }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <span className="text-sm font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
            style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}