'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { useMarketStore } from '@/lib/store/market.store';

const INDEX_META = [
  { symbol: 'SPY',  name: 'S&P 500',    shortName: 'SPX'  },
  { symbol: 'QQQ',  name: 'NASDAQ 100', shortName: 'NDX'  },
  { symbol: 'DIA',  name: 'Dow Jones',  shortName: 'DJIA' },
  { symbol: 'IWM',  name: 'Russell 2K', shortName: 'RUT'  },
];

export function MarketOverviewWidget() {
  const isConnected = useMarketStore(s => s.isConnected);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: () =>
      apiClient.get('/api/v1/market/quotes?symbols=SPY,QQQ,DIA,IWM').then(r => r.data.data),
    refetchInterval: 10000,
    staleTime: 8000,
  });

  const { data: status } = useQuery({
    queryKey: ['market-status'],
    queryFn: () => apiClient.get('/api/v1/market/status').then(r => r.data.data),
    refetchInterval: 60000,
  });

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <h3 className="text-sm font-semibold text-white">Market Overview</h3>
        <div className="flex items-center gap-2">
          {status && (
            <span className={`text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full ${
              status.open
                ? 'bg-[#00d4a020] text-[#00d4a0]'
                : 'bg-[#1e1e1e] text-gray-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.open ? 'bg-[#00d4a0] animate-pulse' : 'bg-gray-600'}`} />
              {status.open ? 'Market Open' : 'Market Closed'}
            </span>
          )}
          {isConnected
            ? <Wifi size={12} className="text-[#00d4a0]" />
            : <WifiOff size={12} className="text-gray-600" />
          }
        </div>
      </div>

      {/* Index tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-[#1e1e1e]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-2.5 w-16 bg-[#1e1e1e] rounded animate-pulse" />
                <div className="h-5 w-24 bg-[#1e1e1e] rounded animate-pulse" />
                <div className="h-2 w-14 bg-[#1e1e1e] rounded animate-pulse" />
              </div>
            ))
          : INDEX_META.map((meta, i) => {
              const q   = quotes?.find((q: any) => q.symbol === meta.symbol);
              const isUp = (q?.changePercent || 0) >= 0;
              return (
                <div key={meta.symbol} className="p-4 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 font-medium">{meta.shortName}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-[#00d4a0]' : 'bg-[#ff4d4d]'}`} />
                  </div>
                  <p className="text-base font-mono font-bold text-white">
                    {q ? `$${q.price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{meta.name}</p>
                  {q && (
                    <div className={`flex items-center gap-1 mt-1.5 text-xs font-mono font-medium ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {isUp ? '+' : ''}{q.changePercent?.toFixed(2)}%
                    </div>
                  )}
                </div>
              );
            })}
      </div>
    </div>
  );
}