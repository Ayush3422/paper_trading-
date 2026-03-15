'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Play, Pause, Trash2, BarChart2, FlaskConical, TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORY_COLOR: Record<string, string> = {
  'Trend Following':'#00d4a0','Momentum':'#a855f7','Mean Reversion':'#3b82f6',
  'Breakout':'#f59e0b','Volatility':'#ec4899','Volume':'#06b6d4',
  'Multi-Factor':'#8b5cf6','Statistical':'#f43f5e',
};

interface Strategy {
  id: string; name: string; description: string; status: string;
  config: any; backtestRun: boolean; backtestResults?: any[];
  totalPnL: number; totalTrades: number; createdAt: string;
}

export function StrategyCard({ strategy }: { strategy: Strategy }) {
  const qc     = useQueryClient();
  const router = useRouter();
  const isActive = strategy.status === 'ACTIVE';
  const bt = strategy.backtestResults?.[0];
  const btUp = (bt?.totalReturnPct || 0) >= 0;

  const toggle = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/algo/strategies/${strategy.id}/toggle`),
    onSuccess: (res) => {
      const next = res.data.data.status;
      toast.success(next === 'ACTIVE' ? `▶ ${strategy.name} is now live` : `⏸ ${strategy.name} stopped`);
      qc.invalidateQueries({ queryKey: ['strategies'] });
    },
  });

  const backtest = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/algo/strategies/${strategy.id}/backtest`, { days: 365 }),
    onSuccess: () => {
      toast.success('Backtest complete!');
      qc.invalidateQueries({ queryKey: ['strategies'] });
      router.push(`/trading/algo/${strategy.id}`);
    },
    onError: () => toast.error('Backtest failed'),
  });

  const del = useMutation({
    mutationFn: () => apiClient.delete(`/api/v1/algo/strategies/${strategy.id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['strategies'] }); },
  });

  const config    = strategy.config || {};
  const symbols   = config.symbols || [];
  const catColor  = CATEGORY_COLOR[config.category || ''] || '#6366f1';
  const conditions = (config.buyRule?.conditions?.length || 0) + (config.sellRule?.conditions?.length || 0);

  return (
    <div className="group bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden hover:border-[#252525] transition-all hover:shadow-xl hover:shadow-black/20 relative flex flex-col">

      {/* Status bar at top */}
      <div className={`h-0.5 w-full ${isActive ? 'bg-gradient-to-r from-[#00d4a0] to-transparent' : 'bg-[#1e1e1e]'}`} />

      {/* Card header */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#252525] flex items-center justify-center flex-shrink-0">
          {isActive
            ? <div className="w-2.5 h-2.5 rounded-full bg-[#00d4a0] animate-pulse" />
            : <div className="w-2.5 h-2.5 rounded-full bg-[#333]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white text-sm truncate">{strategy.name}</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[#00d4a015] text-[#00d4a0] border border-[#00d4a030]' : 'bg-[#1a1a1a] text-gray-600 border border-[#252525]'}`}>
              {isActive ? 'LIVE' : 'STOPPED'}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-1">{strategy.description || 'No description'}</p>
        </div>
      </div>

      {/* Backtest metrics */}
      {bt ? (
        <div className="px-4 pb-3 grid grid-cols-3 gap-2">
          <div className="bg-[#0c0c0c] rounded-xl p-2.5">
            <p className="text-[9px] text-gray-600 uppercase">Return</p>
            <p className={`text-sm font-mono font-bold mt-0.5 ${btUp ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
              {btUp ? '+' : ''}{bt.totalReturnPct?.toFixed(1)}%
            </p>
          </div>
          <div className="bg-[#0c0c0c] rounded-xl p-2.5">
            <p className="text-[9px] text-gray-600 uppercase">Win Rate</p>
            <p className={`text-sm font-mono font-bold mt-0.5 ${bt.winRate >= 50 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
              {bt.winRate?.toFixed(0)}%
            </p>
          </div>
          <div className="bg-[#0c0c0c] rounded-xl p-2.5">
            <p className="text-[9px] text-gray-600 uppercase">Sharpe</p>
            <p className={`text-sm font-mono font-bold mt-0.5 ${bt.sharpeRatio >= 1 ? 'text-[#00d4a0]' : 'text-[#f59e0b]'}`}>
              {bt.sharpeRatio?.toFixed(2)}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <div className="bg-[#0c0c0c] border border-dashed border-[#252525] rounded-xl p-3 text-center">
            <p className="text-[11px] text-gray-600">Run a backtest to see performance metrics</p>
          </div>
        </div>
      )}

      {/* Symbol & config pills */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {symbols.map((s: string) => (
          <span key={s} className="text-[9px] font-mono font-bold bg-[#1a1a1a] border border-[#252525] text-gray-400 px-2 py-0.5 rounded-lg">{s}</span>
        ))}
        <span className="text-[9px] bg-[#1a1a1a] text-gray-600 px-2 py-0.5 rounded-lg">{config.positionSize}% pos</span>
        {config.stopLoss && <span className="text-[9px] bg-[#f43f5e10] text-[#f43f5e] px-2 py-0.5 rounded-lg">SL {config.stopLoss}%</span>}
        {config.takeProfit && <span className="text-[9px] bg-[#00d4a010] text-[#00d4a0] px-2 py-0.5 rounded-lg">TP {config.takeProfit}%</span>}
        {config.trailingStop && <span className="text-[9px] bg-[#f59e0b10] text-[#f59e0b] px-2 py-0.5 rounded-lg">Trail {config.trailingStop}%</span>}
        <span className="text-[9px] bg-[#1a1a1a] text-gray-600 px-2 py-0.5 rounded-lg">{conditions} conditions</span>
      </div>

      {/* Actions */}
      <div className="mt-auto px-4 pb-4 flex gap-2">
        <button onClick={() => router.push(`/trading/algo/${strategy.id}`)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 bg-[#141414] border border-[#252525] rounded-xl hover:text-white hover:border-[#333] transition-colors">
          <BarChart2 size={11} /> View
        </button>

        <button onClick={() => backtest.mutate()} disabled={backtest.isPending}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-[#818cf8] bg-[#6366f115] border border-[#6366f130] rounded-xl hover:bg-[#6366f125] transition-colors disabled:opacity-40">
          <FlaskConical size={11} />
          {backtest.isPending ? '...' : strategy.backtestRun ? 'Re-test' : 'Backtest'}
        </button>

        <button onClick={() => toggle.mutate()} disabled={toggle.isPending || !strategy.backtestRun}
          title={!strategy.backtestRun ? 'Run backtest first' : ''}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-xl border transition-colors disabled:opacity-30 ${
            isActive ? 'bg-[#f43f5e15] text-[#f43f5e] border-[#f43f5e30] hover:bg-[#f43f5e25]'
                     : 'bg-[#00d4a015] text-[#00d4a0] border-[#00d4a030] hover:bg-[#00d4a025]'
          }`}>
          {isActive ? <><Pause size={11} /> Stop</> : <><Play size={11} /> Go Live</>}
        </button>

        <button onClick={() => confirm(`Delete "${strategy.name}"?`) && del.mutate()}
          className="ml-auto w-7 h-7 flex items-center justify-center text-gray-700 hover:text-[#f43f5e] hover:bg-[#f43f5e15] rounded-xl transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}