'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return 'Just now';
}

export function RecentTradesWidget() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['trades-recent'],
    queryFn: () => apiClient.get('/api/v1/portfolio/trades?limit=8').then(r => r.data.data),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const trades = data?.trades || data || [];

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Trades</h3>
          <p className="text-[10px] text-gray-500 mt-0.5">Your last 8 executions</p>
        </div>
        <button
          onClick={() => router.push('/trading/orders')}
          className="flex items-center gap-1 text-[10px] text-[#00d4a0] hover:underline"
        >
          View all <ArrowRight size={10} />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e1e1e] bg-[#131313]">
              {['Symbol','Side','Qty','Price','Total','Time'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-[10px] text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1a1a1a]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-2.5 bg-[#1e1e1e] rounded animate-pulse w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              : trades.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-xs">
                    No trades yet — place your first order!
                  </td>
                </tr>
              )
              : trades.map((t: any) => {
                  const isBuy  = t.side === 'BUY';
                  const total  = Number(t.price) * Number(t.quantity);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/trading/trade/${t.symbol}`)}
                      className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-bold text-white group-hover:text-[#00d4a0] transition-colors">
                          {t.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBuy
                            ? 'bg-[#00d4a020] text-[#00d4a0]'
                            : 'bg-[#ff4d4d20] text-[#ff4d4d]'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-gray-300">{Number(t.quantity)}</td>
                      <td className="px-4 py-2.5 font-mono text-gray-300">
                        ${Number(t.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-white">
                        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-[10px]">
                        {timeAgo(t.executedAt || t.createdAt)}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}