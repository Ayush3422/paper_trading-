'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => apiClient.get('/api/v1/social/leaderboard?limit=50').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const entries = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2"><Trophy size={20} className="text-yellow-400" /> Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Top paper traders ranked by return</p>
      </div>

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((e: any, i) => {
            const podiumRank = [2,1,3][i];
            const isFirst = podiumRank === 1;
            const color = podiumRank === 1 ? '#FFD700' : podiumRank === 2 ? '#C0C0C0' : '#CD7F32';
            return (
              <div key={e.userId} className={`bg-[#161616] border rounded-xl p-4 text-center ${isFirst ? 'border-yellow-500/30 ring-1 ring-yellow-500/20' : 'border-[#262626]'}`}>
                <div className="text-2xl font-bold mb-2" style={{ color }}>#{podiumRank}</div>
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a] border-2 flex items-center justify-center mx-auto mb-2 text-lg font-bold" style={{ borderColor: color }}>
                  {e.username?.[0]?.toUpperCase()}
                </div>
                <p className="text-white font-semibold text-sm">{e.displayName || e.username}</p>
                <p className="text-gray-500 text-xs mb-2">@{e.username}</p>
                <p className={`text-lg font-mono font-bold ${e.totalReturnPct >= 0 ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                  {e.totalReturnPct >= 0 ? '+' : ''}{e.totalReturnPct?.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 text-sm">Loading leaderboard...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e1e]">
                {['Rank','Trader','Portfolio Value','Return','Trades'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.userId} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold font-mono ${e.rank <= 3 ? 'text-yellow-400' : 'text-gray-500'}`}>#{e.rank}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs font-bold text-gray-300">
                        {e.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{e.displayName || e.username}</p>
                        <p className="text-gray-600 text-xs">@{e.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300 text-xs">${Number(e.totalValue).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1 text-sm font-mono font-semibold ${e.totalReturnPct >= 0 ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                      {e.totalReturnPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {e.totalReturnPct >= 0 ? '+' : ''}{e.totalReturnPct?.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{e.tradeCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
