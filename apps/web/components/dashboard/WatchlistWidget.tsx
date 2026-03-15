'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Star, ArrowRight, Plus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function MiniChart({ isUp }: { isUp: boolean }) {
  const pts = Array.from({ length: 12 }, (_, i) => ({
    v: 50 + Math.sin(i * 0.8) * 10 + (Math.random() - 0.5) * 8 + (isUp ? i * 1.5 : -i * 1.5),
  }));
  return (
    <ResponsiveContainer width={60} height={28}>
      <LineChart data={pts}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={isUp ? '#00d4a0' : '#ff4d4d'}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WatchlistWidget() {
  const router = useRouter();

  const { data: watchlists, isLoading } = useQuery({
    queryKey: ['watchlists'],
    queryFn: () => apiClient.get('/api/v1/watchlists').then(r => r.data.data),
    refetchInterval: 30000,
  });

  const defaultList = watchlists?.[0];
  const symbols     = defaultList?.symbols?.map((s: any) => s.symbol).slice(0, 8) || [];

  const { data: quotes } = useQuery({
    queryKey: ['watchlist-quotes', symbols.join(',')],
    queryFn: () =>
      symbols.length > 0
        ? apiClient.get(`/api/v1/market/quotes?symbols=${symbols.join(',')}`).then(r => r.data.data)
        : Promise.resolve([]),
    enabled: symbols.length > 0,
    refetchInterval: 8000,
    staleTime: 6000,
  });

  const quoteMap: Record<string, any> = {};
  (quotes || []).forEach((q: any) => { quoteMap[q.symbol] = q; });

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-400/10 rounded-lg flex items-center justify-center">
            <Star size={11} className="text-yellow-400" fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {defaultList?.name || 'Watchlist'}
            </h3>
            <p className="text-[10px] text-gray-500">{symbols.length} symbols</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/trading/watchlist')}
          className="flex items-center gap-1 text-[10px] text-[#00d4a0] hover:underline"
        >
          Manage <ArrowRight size={10} />
        </button>
      </div>

      {/* Symbol rows */}
      <div className="divide-y divide-[#1a1a1a]">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <div className="h-3 w-12 bg-[#1e1e1e] rounded animate-pulse" />
                  <div className="h-2 w-20 bg-[#1e1e1e] rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-[#1e1e1e] rounded animate-pulse" />
              </div>
            ))
          : symbols.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-600">
              <Star size={24} className="mb-2 opacity-30" />
              <p className="text-xs text-center">Your watchlist is empty.<br />Add stocks from the Markets page.</p>
              <button
                onClick={() => router.push('/trading/markets')}
                className="mt-3 flex items-center gap-1.5 text-xs text-[#00d4a0] bg-[#00d4a015] px-3 py-1.5 rounded-lg hover:bg-[#00d4a025] transition-colors"
              >
                <Plus size={11} /> Browse Markets
              </button>
            </div>
          )
          : symbols.map((sym: string) => {
              const q    = quoteMap[sym];
              const isUp = (q?.changePercent || 0) >= 0;
              return (
                <button
                  key={sym}
                  onClick={() => router.push(`/trading/trade/${sym}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors group text-left"
                >
                  {/* Left — symbol + name */}
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-sm text-white group-hover:text-[#00d4a0] transition-colors">
                      {sym}
                    </p>
                    {q?.change !== undefined && (
                      <p className={`text-[10px] font-mono mt-0.5 ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                        {isUp ? '+' : ''}{q.change?.toFixed(2)} ({isUp ? '+' : ''}{q.changePercent?.toFixed(2)}%)
                      </p>
                    )}
                  </div>

                  {/* Center — mini sparkline */}
                  <div className="mx-3 opacity-70">
                    <MiniChart isUp={isUp} />
                  </div>

                  {/* Right — price */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono font-bold text-white">
                      {q ? `$${q.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </p>
                    <div className={`flex items-center justify-end gap-0.5 mt-0.5 text-[10px] font-mono ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                      {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
}