'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function IndicesBar() {
  const { data } = useQuery({
    queryKey: ['indices'],
    queryFn: () => apiClient.get('/api/v1/market/indices').then(r => r.data.data),
    refetchInterval: 15000,
  });

  const indices = data || [];

  return (
    <div className="w-full bg-[#111] border-b border-[#1e1e1e] overflow-hidden">
      <div className="flex items-center overflow-x-auto scrollbar-hide gap-0 divide-x divide-[#1e1e1e]">
        {indices.map((idx: any) => {
          const isUp = idx.changePct >= 0;
          return (
            <div key={idx.symbol} className="flex items-center gap-3 px-5 py-2.5 flex-shrink-0 hover:bg-[#1a1a1a] transition-colors cursor-default">
              <div>
                <p className="text-xs font-semibold text-gray-300 leading-none">{idx.name}</p>
                <p className="text-[10px] text-gray-600 mt-0.5 font-mono">{idx.symbol}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-white leading-none">
                  {idx.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-0.5 mt-0.5 justify-end ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                  {isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  <span className="text-[10px] font-mono">
                    {isUp ? '+' : ''}{idx.changePct?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}