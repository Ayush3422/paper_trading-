'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Percent, Activity } from 'lucide-react';

export function PortfolioSummaryBar() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: () => apiClient.get('/api/v1/portfolio/summary').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const stats = [
    {
      label: 'Portfolio Value',
      value: data?.totalValue ?? 0,
      prev: data?.startingCapital ?? 100000,
      format: 'usd',
      icon: DollarSign,
      accent: '#00e5a0',
      glow: 'rgba(0, 229, 160, 0.15)',
    },
    {
      label: 'Total P&L',
      value: data?.totalPnL ?? 0,
      format: 'pnl',
      icon: data?.totalPnL >= 0 ? TrendingUp : TrendingDown,
      accent: (data?.totalPnL ?? 0) >= 0 ? '#00e5a0' : '#f43f5e',
      glow: (data?.totalPnL ?? 0) >= 0 ? 'rgba(0, 229, 160, 0.12)' : 'rgba(244, 63, 94, 0.12)',
    },
    {
      label: 'Return',
      value: data?.totalReturnPct ?? 0,
      format: 'pct',
      icon: Percent,
      accent: (data?.totalReturnPct ?? 0) >= 0 ? '#00e5a0' : '#f43f5e',
      glow: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Cash Available',
      value: data?.cashBalance ?? 100000,
      format: 'usd',
      icon: BarChart2,
      accent: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Open Positions',
      value: data?.openPositions ?? 0,
      format: 'num',
      icon: Activity,
      accent: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.12)',
    },
  ];

  const fmt = (v: number, f: string) => {
    if (f === 'usd') return `$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (f === 'pnl') return `${v >= 0 ? '+' : '-'}$${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (f === 'pct') return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
    return String(v);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 stagger">
      {stats.map(({ label, value, format, icon: Icon, accent, glow }) => {
        const isNeg = format === 'pnl' && value < 0 || format === 'pct' && value < 0;
        return (
          <div key={label}
            className="relative rounded-2xl p-4 overflow-hidden card-lift animate-fade-in-up group"
            style={{
              background: 'rgba(11, 12, 23, 0.8)',
              border: `1px solid rgba(255, 255, 255, 0.07)`,
              backdropFilter: 'blur(20px)',
              boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset`,
            }}>

            {/* Glow bg on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
              style={{ background: `radial-gradient(ellipse at 20% 50%, ${glow}, transparent 70%)` }} />

            {/* Top accent line */}
            <div className="absolute top-0 left-4 right-4 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent}50, transparent)` }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: '#4a5275', fontFamily: 'Outfit, sans-serif' }}>
                  {label}
                </p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
                  <Icon size={13} style={{ color: accent }} strokeWidth={2} />
                </div>
              </div>

              <p className="text-xl font-bold leading-none animate-fade-in-up"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  color: format === 'pnl' || format === 'pct'
                    ? (isNeg ? '#f43f5e' : '#00e5a0')
                    : '#f0f2ff',
                  textShadow: format === 'pnl' || format === 'pct'
                    ? `0 0 20px ${isNeg ? 'rgba(244,63,94,0.4)' : 'rgba(0,229,160,0.4)'}`
                    : 'none',
                }}>
                {fmt(value, format)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}