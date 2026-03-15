'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, Target, Zap, BarChart2, Award } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function MetricCard({ label, value, sub, icon, color, bg }: MetricCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-3.5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-mono font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function WinRateDonut({ rate }: { rate: number }) {
  const r   = 36;
  const circ = 2 * Math.PI * r;
  const dash = (rate / 100) * circ;

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#1e1e1e"   strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#00d4a0"   strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-mono font-bold text-white">{rate.toFixed(0)}%</span>
        <span className="text-[9px] text-gray-500">Win Rate</span>
      </div>
    </div>
  );
}

export function PerformanceMetrics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiClient.get('/api/v1/portfolio/analytics').then(r => r.data.data),
    staleTime: 60000,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiClient.get('/api/v1/portfolio').then(r => r.data.data),
  });

  const winRate     = analytics?.winRate        || 0;
  const avgWin      = analytics?.avgWin         || 0;
  const avgLoss     = Math.abs(analytics?.avgLoss || 0);
  const tradeCount  = analytics?.tradeCount     || 0;
  const totalPnL    = analytics?.totalRealizedPnL || 0;
  const profitFactor = analytics?.profitFactor  || 0;
  const totalReturn = portfolio?.totalPnLPct    || 0;

  // Radar data — normalize 0–100
  const radarData = [
    { subject: 'Win Rate',     A: Math.min(100, winRate) },
    { subject: 'Profit Factor',A: Math.min(100, profitFactor * 20) },
    { subject: 'Return',       A: Math.min(100, Math.max(0, totalReturn + 50)) },
    { subject: 'Activity',     A: Math.min(100, tradeCount * 2) },
    { subject: 'Avg Win',      A: Math.min(100, avgWin > 0 ? 50 + (avgWin / 500) * 50 : 0) },
    { subject: 'Risk Mgmt',    A: Math.min(100, avgLoss > 0 ? Math.max(0, 100 - (avgLoss / avgWin || 1) * 30) : 50) },
  ];

  if (isLoading) {
    return (
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 h-64 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#00d4a0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e1e]">
        <h3 className="text-sm font-semibold text-white">Performance</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Trading statistics</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Win rate donut + key stats */}
        <div className="flex items-center gap-4">
          <WinRateDonut rate={winRate} />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total Trades</span>
              <span className="font-mono font-bold text-white">{tradeCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Profit Factor</span>
              <span className={`font-mono font-bold ${profitFactor >= 1 ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                {profitFactor > 0 ? profitFactor.toFixed(2) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Realized P&L</span>
              <span className={`font-mono font-bold ${totalPnL >= 0 ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                {totalPnL >= 0 ? '+' : '-'}${Math.abs(totalPnL).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total Return</span>
              <span className={`font-mono font-bold ${totalReturn >= 0 ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Avg win / loss bar */}
        <div className="bg-[#1a1a1a] rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-[10px] text-gray-500 mb-2">
            <span>Avg Win vs Avg Loss</span>
            {avgLoss > 0 && <span className="text-white font-mono">Ratio: {(avgWin / avgLoss).toFixed(2)}</span>}
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#00d4a0] font-mono font-semibold">+${avgWin.toFixed(2)}</span>
              <span className="text-[10px] text-gray-500">Avg Win</span>
            </div>
            <div className="w-full bg-[#131313] rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#00d4a0] rounded-full"
                style={{ width: `${Math.min(100, (avgWin / (avgWin + avgLoss || 1)) * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#ff4d4d] font-mono font-semibold">-${avgLoss.toFixed(2)}</span>
              <span className="text-[10px] text-gray-500">Avg Loss</span>
            </div>
            <div className="w-full bg-[#131313] rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#ff4d4d] rounded-full"
                style={{ width: `${Math.min(100, (avgLoss / (avgWin + avgLoss || 1)) * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Radar chart */}
        {tradeCount > 0 && (
          <div>
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">Trading Score</p>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e1e1e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#555', fontSize: 9 }} />
                <Radar dataKey="A" stroke="#00d4a0" fill="#00d4a0" fillOpacity={0.15} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {tradeCount === 0 && (
          <div className="text-center py-4 text-gray-600">
            <BarChart2 size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Start trading to see your stats</p>
          </div>
        )}
      </div>
    </div>
  );
}