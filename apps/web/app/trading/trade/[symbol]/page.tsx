'use client';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StockChart } from '@/components/charts/StockChart';
import { PriceTicker } from '@/components/trading/PriceTicker';
import { OrderPanel } from '@/components/trading/OrderPanel';
import { CompanyInfoCard } from '@/components/trading/CompanyInfoCard';
import { PositionCard } from '@/components/trading/PositionCard';
import { RelatedStocks } from '@/components/trading/RelatedStocks';
import { NewsWidget } from '@/components/markets/NewsWidget';
import { OptionsChain } from '@/components/trading/OptionsChain';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { subscribeToSymbols } from '@/lib/socket/socket.client';
import { apiClient } from '@/lib/api/client';
import { ArrowLeft, Star, StarOff, Bell } from 'lucide-react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function TradePage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  const sym = symbol.toUpperCase();
  const qc  = useQueryClient();
  const [activeTab, setActiveTab] = useState<'chart' | 'news' | 'info' | 'options'>('chart');
  const [isWatched, setIsWatched] = useState(false);

  const { data: portfolio } = usePortfolio();
  const { data: quoteData, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', sym],
    queryFn: () => apiClient.get(`/api/v1/market/quote/${sym}`).then(r => r.data.data),
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: watchlists } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => apiClient.get('/api/v1/watchlists').then(r => r.data.data),
  });

  useEffect(() => { subscribeToSymbols([sym]); }, [sym]);

  // Check if already watched
  useEffect(() => {
    if (watchlists?.length > 0) {
      const watched = watchlists.some((wl: any) =>
        wl.symbols?.some((s: any) => s.symbol === sym)
      );
      setIsWatched(watched);
    }
  }, [watchlists, sym]);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      const list = watchlists?.[0];
      if (!list) throw new Error('Create a watchlist first');
      if (isWatched) {
        return apiClient.delete(`/api/v1/watchlists/${list.id}/symbols/${sym}`);
      }
      return apiClient.post(`/api/v1/watchlists/${list.id}/symbols`, { symbol: sym });
    },
    onSuccess: () => {
      setIsWatched(v => !v);
      toast.success(isWatched ? `${sym} removed from watchlist` : `${sym} added to watchlist`);
      qc.invalidateQueries({ queryKey: ['watchlists'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const position   = portfolio?.positions?.find((p: any) => p.symbol === sym);
  const cashBalance   = portfolio?.cashBalance || 0;
  const heldShares    = position ? Number(position.quantity) : 0;
  const currentPrice  = quoteData?.price || 0;
  const isUp          = (quoteData?.changePercent || 0) >= 0;

  return (
    <div className="space-y-4 pb-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          {/* Back + symbol */}
          <div className="flex items-center gap-3 mb-2">
            <Link href="/trading/markets"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#222] transition-colors">
              <ArrowLeft size={15} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00d4a015] border border-[#00d4a030] flex items-center justify-center">
                <span className="text-[#00d4a0] font-bold text-xs">{sym.slice(0,2)}</span>
              </div>
              <div>
                <span className="text-xl font-bold font-mono text-white">{sym}</span>
                <span className="text-xs text-gray-500 ml-2">NASDAQ</span>
              </div>
            </div>
          </div>

          {/* Live price */}
          {quoteLoading
            ? <div className="h-8 w-48 bg-[#1a1a1a] rounded-lg animate-pulse" />
            : <PriceTicker symbol={sym} initialPrice={currentPrice} initialChange={quoteData?.change || 0} initialChangePct={quoteData?.changePercent || 0} size="lg" />
          }
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toggleWatch.mutate()}
            disabled={toggleWatch.isPending}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              isWatched
                ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/20'
                : 'bg-[#1a1a1a] text-gray-400 border-[#262626] hover:border-[#333] hover:text-white'
            }`}>
            {isWatched ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
            {isWatched ? 'Watching' : 'Watch'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#1a1a1a] text-gray-400 border border-[#262626] hover:border-[#333] hover:text-white transition-colors">
            <Bell size={13} /> Alert
          </button>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">

        {/* Left: Chart + tabs (3 cols) */}
        <div className="xl:col-span-3 space-y-4">

          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-[#161616] border border-[#262626] rounded-xl p-1">
            {[
              { key: 'chart',   label: '📈 Chart'   },
              { key: 'options', label: '⛓ Options'  },
              { key: 'news',    label: '📰 News'     },
              { key: 'info',    label: '🏢 Company'  },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as any)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${activeTab === t.key ? 'bg-[#00d4a0] text-black font-bold' : 'text-gray-400 hover:text-white'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              <StockChart symbol={sym} height={420} />

              {/* Quick stats bar */}
              {quoteData && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Open',      value: `$${quoteData.open?.toFixed(2)}` },
                    { label: 'Day High',  value: `$${quoteData.high?.toFixed(2)}`,  color: 'text-[#00d4a0]' },
                    { label: 'Day Low',   value: `$${quoteData.low?.toFixed(2)}`,   color: 'text-[#ff4d4d]' },
                    { label: 'Prev Close',value: `$${quoteData.previousClose?.toFixed(2)}` },
                    { label: 'Volume',    value: quoteData.volume ? `${(quoteData.volume / 1e6).toFixed(2)}M` : 'N/A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[#161616] border border-[#262626] rounded-xl p-3">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                      <p className={`text-sm font-mono font-bold mt-0.5 ${color || 'text-white'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && (
            <OptionsChain symbol={sym} />
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <NewsWidget symbol={sym} limit={10} />
          )}

          {/* Company Tab */}
          {activeTab === 'info' && (
            <CompanyInfoCard symbol={sym} />
          )}
        </div>

        {/* Right sidebar (1 col) */}
        <div className="xl:col-span-1 space-y-4">
          {/* Order panel */}
          <OrderPanel
            symbol={sym}
            currentPrice={currentPrice}
            availableCash={cashBalance}
            heldShares={heldShares}
          />

          {/* Position card */}
          <PositionCard symbol={sym} position={position ? {
            quantity: Number(position.quantity),
            averageCost: Number(position.averageCost),
            totalCost: Number(position.totalCost),
            currentPrice,
            marketValue: Number(position.quantity) * currentPrice,
            unrealizedPnL: Number(position.unrealizedPnL),
            unrealizedPnLPct: Number(position.unrealizedPnLPct),
          } : null} />

          {/* Related stocks */}
          <RelatedStocks symbol={sym} />
        </div>
      </div>
    </div>
  );
}