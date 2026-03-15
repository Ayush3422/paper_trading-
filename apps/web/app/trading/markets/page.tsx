'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { IndicesBar } from '@/components/markets/IndicesBar';
import { MoverCard } from '@/components/markets/MoverCard';
import { StockScreener } from '@/components/markets/StockScreener';
import { NewsWidget } from '@/components/markets/NewsWidget';
import { SectorHeatmap } from '@/components/markets/SectorHeatmap';
import { toast } from 'sonner';
import { BarChart2, Clock, Globe } from 'lucide-react';

function MarketStatusBadge() {
  const { data } = useQuery({
    queryKey: ['market-status'],
    queryFn: () => apiClient.get('/api/v1/market/status').then(r => r.data.data),
    refetchInterval: 60000,
  });

  if (!data) return null;

  const colors = {
    regular:     { dot: 'bg-[#00d4a0]', text: 'text-[#00d4a0]', label: 'Market Open' },
    'pre-market':{ dot: 'bg-yellow-400', text: 'text-yellow-400', label: 'Pre-Market'  },
    'after-hours':{ dot: 'bg-blue-400',  text: 'text-blue-400',  label: 'After Hours' },
    closed:      { dot: 'bg-gray-500',   text: 'text-gray-500',  label: 'Market Closed'},
  };
  const cfg = colors[data.session as keyof typeof colors] || colors.closed;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-lg">
      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${data.open ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
      <span className="text-[10px] text-gray-600 flex items-center gap-1">
        <Clock size={9} /> NYSE · ET
      </span>
    </div>
  );
}

export default function MarketsPage() {
  const qc = useQueryClient();

  const { data: moversData, isLoading: moversLoading } = useQuery({
    queryKey: ['movers'],
    queryFn: () => apiClient.get('/api/v1/market/movers').then(r => r.data.data),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const { data: watchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => apiClient.get('/api/v1/watchlists').then(r => r.data.data),
  });

  const addToWatchlist = useMutation({
    mutationFn: async (symbol: string) => {
      const list = (watchlists || [])[0];
      if (!list) throw new Error('Create a watchlist first in the Watchlist tab');
      return apiClient.post(`/api/v1/watchlists/${list.id}/symbols`, { symbol });
    },
    onSuccess: (_, symbol) => {
      toast.success(`${symbol} added to watchlist ✓`);
      qc.invalidateQueries({ queryKey: ['watchlists'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add'),
  });

  const gainers = moversData?.gainers || [];
  const losers  = moversData?.losers  || [];
  const active  = moversData?.active  || [];

  return (
    <div className="space-y-5 pb-8">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe size={20} className="text-[#00d4a0]" />
            Markets
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time market overview and stock screener</p>
        </div>
        <MarketStatusBadge />
      </div>

      {/* ── Indices Bar ─────────────────────────────────────── */}
      <div className="-mx-4 sm:mx-0 sm:rounded-xl overflow-hidden border border-[#262626]">
        <IndicesBar />
      </div>

      {/* ── Sector Heatmap ──────────────────────────────────── */}
      <SectorHeatmap />

      {/* ── Top Movers ──────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <BarChart2 size={15} className="text-[#00d4a0]" /> Top Movers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MoverCard
            title="Top Gainers"
            type="gainers"
            stocks={moversLoading ? [] : gainers}
            onAddToWatchlist={sym => addToWatchlist.mutate(sym)}
          />
          <MoverCard
            title="Top Losers"
            type="losers"
            stocks={moversLoading ? [] : losers}
            onAddToWatchlist={sym => addToWatchlist.mutate(sym)}
          />
          <MoverCard
            title="Most Active"
            type="active"
            stocks={moversLoading ? [] : active}
            onAddToWatchlist={sym => addToWatchlist.mutate(sym)}
          />
        </div>
      </div>

      {/* ── Screener + News ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Screener — 3 cols */}
        <div className="xl:col-span-3 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00d4a0" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Stock Screener
          </h2>
          <StockScreener />
        </div>

        {/* News — 1 col */}
        <div className="xl:col-span-1">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
              <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>
            </svg>
            Market News
          </h2>
          <NewsWidget limit={8} />
        </div>
      </div>

    </div>
  );
}