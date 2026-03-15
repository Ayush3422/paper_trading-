'use client';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RELATED: Record<string, string[]> = {
  AAPL:  ['MSFT','GOOGL','META','AMZN'],
  MSFT:  ['AAPL','GOOGL','CRM','AMZN'],
  GOOGL: ['META','MSFT','AAPL','AMZN'],
  AMZN:  ['AAPL','MSFT','GOOGL','META'],
  META:  ['GOOGL','SNAP','PINS','TWTR'],
  TSLA:  ['RIVN','NIO','F','GM'],
  NVDA:  ['AMD','INTC','QCOM','TSM'],
  JPM:   ['BAC','WFC','GS','MS'],
  DEFAULT: ['SPY','QQQ','AAPL','MSFT'],
};

export function RelatedStocks({ symbol }: { symbol: string }) {
  const router  = useRouter();
  const related = RELATED[symbol] || RELATED.DEFAULT;

  const { data, isLoading } = useQuery({
    queryKey: ['quotes-related', symbol],
    queryFn: () => apiClient.get(`/api/v1/market/quotes?symbols=${related.join(',')}`).then(r => r.data.data),
    refetchInterval: 10000,
    staleTime: 8000,
  });

  const quotes = data || [];

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <h3 className="text-sm font-semibold text-white">Related Stocks</h3>
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <div className="h-3 w-12 bg-[#1e1e1e] rounded animate-pulse" />
                  <div className="h-2 w-20 bg-[#1e1e1e] rounded animate-pulse" />
                </div>
                <div className="h-3 w-16 bg-[#1e1e1e] rounded animate-pulse" />
              </div>
            ))
          : quotes.map((q: any) => {
              const isUp = q.changePercent >= 0;
              return (
                <button key={q.symbol} onClick={() => router.push(`/trading/trade/${q.symbol}`)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors group text-left">
                  <div>
                    <p className="text-sm font-mono font-bold text-white group-hover:text-[#00d4a0] transition-colors">{q.symbol}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">${q.price?.toFixed(2)}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-mono font-semibold px-2 py-1 rounded-lg ${isUp ? 'bg-[#00d4a015] text-[#00d4a0]' : 'bg-[#ff4d4d15] text-[#ff4d4d]'}`}>
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isUp ? '+' : ''}{q.changePercent?.toFixed(2)}%
                  </div>
                </button>
              );
            })}
      </div>
    </div>
  );
}