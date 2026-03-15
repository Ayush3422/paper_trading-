'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

function getHeatColor(pct: number) {
  if (pct >  5)  return { bg: '#00d4a0',   text: '#003d2e', border: '#00d4a060' };
  if (pct >  2)  return { bg: '#00d4a080', text: '#00d4a0', border: '#00d4a040' };
  if (pct >  0)  return { bg: '#00d4a030', text: '#00d4a0', border: '#00d4a030' };
  if (pct > -2)  return { bg: '#ff4d4d30', text: '#ff4d4d', border: '#ff4d4d30' };
  if (pct > -5)  return { bg: '#ff4d4d80', text: '#ff4d4d', border: '#ff4d4d40' };
  return              { bg: '#ff4d4d',   text: '#3d0000', border: '#ff4d4d60' };
}

export function PositionHeatmap() {
  const router = useRouter();

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.get('/api/v1/portfolio').then(r => r.data.data),
    refetchInterval: 15000,
  });

  const positions = portfolio?.positions || [];
  const totalValue = portfolio?.totalValue || 1;

  if (isLoading) {
    return (
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
        <div className="h-4 w-32 bg-[#1e1e1e] rounded animate-pulse mb-4" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#1e1e1e] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <div>
          <h3 className="text-sm font-semibold text-white">Position Heatmap</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Sized by portfolio weight</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00d4a0] inline-block"/>Gain</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#ff4d4d] inline-block"/>Loss</span>
        </div>
      </div>

      <div className="p-3">
        {positions.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <div className="grid grid-cols-4 gap-2 mb-4 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-[#1e1e1e]" />
              ))}
            </div>
            <p className="text-xs">No positions to display</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {positions
              .sort((a: any, b: any) => Number(b.marketValue) - Number(a.marketValue))
              .map((pos: any) => {
                const pct    = Number(pos.unrealizedPnLPct) || 0;
                const weight = (Number(pos.marketValue) / totalValue) * 100;
                const colors = getHeatColor(pct);
                const isUp   = pct >= 0;

                // Size based on weight
                const sizeClass = weight > 15 ? 'row-span-2 col-span-2' :
                                  weight > 8  ? 'col-span-2' : '';

                return (
                  <div
                    key={pos.symbol}
                    onClick={() => router.push(`/trading/trade/${pos.symbol}`)}
                    className={`${sizeClass} rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg flex flex-col justify-between min-h-[72px] border`}
                    style={{ background: colors.bg, borderColor: colors.border }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-sm" style={{ color: colors.text }}>
                        {pos.symbol}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}
                        style={{ opacity: 0.9 }}>
                        {isUp ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono" style={{ color: colors.text, opacity: 0.7 }}>
                        ${Number(pos.currentPrice).toFixed(2)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: colors.text, opacity: 0.5 }}>
                        {weight.toFixed(1)}% of portfolio
                      </p>
                    </div>
                  </div>
                );
              })}

            {/* Cash tile */}
            {portfolio?.cashBalance > 0 && (
              <div className="rounded-xl p-3 min-h-[72px] flex flex-col justify-between border border-[#262626] bg-[#1a1a1a]">
                <span className="font-mono font-bold text-sm text-gray-400">CASH</span>
                <div>
                  <p className="text-[10px] font-mono text-gray-500">
                    ${Number(portfolio.cashBalance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[9px] text-gray-600 mt-0.5">
                    {((portfolio.cashBalance / totalValue) * 100).toFixed(1)}% of portfolio
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}