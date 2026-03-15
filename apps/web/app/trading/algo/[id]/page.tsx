'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BacktestResults }    from '@/components/algo/BacktestResults';
import { StrategyBuilder }    from '@/components/algo/StrategyBuilder';
import { LiveSignalMonitor }  from '@/components/algo/LiveSignalMonitor';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, FlaskConical, Play, Pause, Edit2, BarChart2, Activity, ChevronDown } from 'lucide-react';

export default function StrategyDetailPage({ params }: { params: { id: string } }) {
  const { id }          = params;
  const qc              = useQueryClient();
  const [tab, setTab]   = useState<'results'|'live'|'edit'>('results');
  const [days, setDays] = useState(365);

  const { data, isLoading } = useQuery({
    queryKey: ['strategy', id],
    queryFn:  () => apiClient.get(`/api/v1/algo/strategies/${id}`).then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const backtest = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/algo/strategies/${id}/backtest`, { days }),
    onSuccess: () => {
      toast.success('Backtest complete!');
      qc.invalidateQueries({ queryKey: ['strategy', id] });
      qc.invalidateQueries({ queryKey: ['strategies'] });
      setTab('results');
    },
    onError: () => toast.error('Backtest failed'),
  });

  const toggle = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/algo/strategies/${id}/toggle`),
    onSuccess: (res) => {
      const next = res.data.data.status;
      const isNowLive = next === 'ACTIVE';
      toast.success(isNowLive ? '▶ Strategy is LIVE — checking every 60s' : '⏸ Strategy stopped');
      if (isNowLive) setTab('live');
      qc.invalidateQueries({ queryKey: ['strategy', id] });
      qc.invalidateQueries({ queryKey: ['strategies'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Strategy not found. <Link href="/trading/algo" className="text-[#6366f1] hover:underline">← Back</Link>
      </div>
    );
  }

  const isActive = data.status === 'ACTIVE';
  const results  = data.backtestResults || [];
  const bt       = results[0];

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/trading/algo"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#111] border border-[#1e1e1e] text-gray-500 hover:text-white hover:border-[#252525] transition-colors mt-0.5">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white">{data.name}</h1>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isActive ? 'bg-[#00d4a015] text-[#00d4a0] border border-[#00d4a030]'
                         : 'bg-[#111] text-gray-600 border border-[#252525]'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#00d4a0] animate-pulse' : 'bg-gray-700'}`} />
                {isActive ? 'LIVE — checking every 60s' : 'STOPPED'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
            {bt && (
              <div className="flex items-center gap-4 mt-1.5 text-[11px]">
                <span className={bt.totalReturnPct >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}>
                  {bt.totalReturnPct >= 0 ? '+' : ''}{bt.totalReturnPct?.toFixed(1)}% backtest
                </span>
                <span className="text-gray-600">Sharpe {bt.sharpeRatio?.toFixed(2)}</span>
                <span className="text-gray-600">{bt.totalTrades} trades</span>
                <span className="text-gray-600">WR {bt.winRate?.toFixed(1)}%</span>
                {data.totalTrades > 0 && (
                  <span className="text-[#818cf8]">{data.totalTrades} live trades placed</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select value={days} onChange={e => setDays(parseInt(e.target.value))}
              className="bg-[#111] border border-[#1e1e1e] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#6366f1] appearance-none pr-7 cursor-pointer">
              <option value={90}>3M backtest</option>
              <option value={180}>6M backtest</option>
              <option value={365}>1Y backtest</option>
              <option value={730}>2Y backtest</option>
              <option value={1825}>5Y backtest</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" />
          </div>

          <button onClick={() => backtest.mutate()} disabled={backtest.isPending}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#818cf8] bg-[#6366f115] border border-[#6366f130] rounded-xl hover:bg-[#6366f125] transition-colors disabled:opacity-50">
            <FlaskConical size={13} />
            {backtest.isPending ? 'Running...' : data.backtestRun ? 'Re-run' : 'Run Backtest'}
          </button>

          <button onClick={() => toggle.mutate()} disabled={toggle.isPending || !data.backtestRun}
            title={!data.backtestRun ? 'Run backtest first' : ''}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-40 ${
              isActive
                ? 'bg-[#f43f5e15] text-[#f43f5e] border-[#f43f5e30] hover:bg-[#f43f5e25]'
                : 'bg-[#00d4a015] text-[#00d4a0] border-[#00d4a030] hover:bg-[#00d4a025]'
            }`}>
            {isActive ? <><Pause size={13}/> Stop Strategy</> : <><Play size={13}/> Go Live</>}
          </button>
        </div>
      </div>

      {/* ── Config summary ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label:'Symbols',     value:(data.config?.symbols||[]).join(', ')||'—' },
          { label:'Position',    value:`${data.config?.positionSize||0}%` },
          { label:'Stop Loss',   value:data.config?.stopLoss   ?`${data.config.stopLoss}%`   :'None' },
          { label:'Take Profit', value:data.config?.takeProfit ?`${data.config.takeProfit}%` :'None' },
          { label:'Timeframe',   value:data.config?.timeframe  ||'1D' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-xl px-3.5 py-3">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-mono font-bold text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div className="flex bg-[#111] border border-[#1e1e1e] rounded-xl p-1 gap-1 w-fit">
        <button onClick={() => setTab('results')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'results' ? 'bg-[#1e1e1e] text-white' : 'text-gray-600 hover:text-gray-300'}`}>
          <BarChart2 size={12} /> Backtest
        </button>
        <button onClick={() => setTab('live')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'live' ? 'bg-[#1e1e1e] text-white' : 'text-gray-600 hover:text-gray-300'}`}>
          <Activity size={12} className={isActive ? 'text-[#00d4a0]' : ''} />
          Live Monitor
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00d4a0] animate-pulse" />}
        </button>
        <button onClick={() => setTab('edit')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'edit' ? 'bg-[#1e1e1e] text-white' : 'text-gray-600 hover:text-gray-300'}`}>
          <Edit2 size={12} /> Edit
        </button>
      </div>

      {/* ── Backtest tab ────────────────────────────────────────── */}
      {tab === 'results' && (
        results.length > 0 ? <BacktestResults results={results} /> : (
          <div className="bg-[#111] border border-[#1e1e1e] border-dashed rounded-2xl p-14 text-center">
            <div className="w-16 h-16 bg-[#6366f115] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FlaskConical size={28} className="text-[#6366f1]" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1">No backtest results yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Simulate this strategy over historical data before going live.
            </p>
            <div className="flex items-center justify-center gap-3">
              {[90,365,730,1825].map(d => (
                <button key={d} onClick={() => { setDays(d); backtest.mutate(); }}
                  disabled={backtest.isPending}
                  className="px-4 py-2 bg-[#6366f115] border border-[#6366f130] text-[#818cf8] text-xs font-semibold rounded-xl hover:bg-[#6366f125] transition-colors disabled:opacity-40">
                  {d===90?'3M':d===365?'1Y':d===730?'2Y':'5Y'}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* ── Live monitor tab ────────────────────────────────────── */}
      {tab === 'live' && (
        <div className="space-y-4">
          {!isActive && (
            <div className="bg-[#f59e0b10] border border-[#f59e0b25] rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
              <span className="text-[#f59e0b] text-lg">⚠️</span>
              <div>
                <p className="text-[#f59e0b] font-semibold">Strategy is stopped</p>
                <p className="text-gray-500 text-xs mt-0.5">Click "Go Live" above to start live execution. The worker checks conditions every 60 seconds during market hours.</p>
              </div>
            </div>
          )}
          {isActive && (
            <div className="bg-[#00d4a010] border border-[#00d4a025] rounded-xl px-4 py-3 flex items-center gap-3 text-sm">
              <Activity size={16} className="text-[#00d4a0] animate-pulse flex-shrink-0" />
              <div>
                <p className="text-[#00d4a0] font-semibold">Strategy is LIVE</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Checking conditions every 60 seconds against real Polygon.io data.
                  When your buy/sell conditions are met, paper orders are placed automatically.
                </p>
              </div>
            </div>
          )}
          <LiveSignalMonitor strategyId={id} />
        </div>
      )}

      {/* ── Edit tab ────────────────────────────────────────────── */}
      {tab === 'edit' && (
        <StrategyBuilder
          strategyId={id}
          initialName={data.name}
          initialDesc={data.description}
          initialConfig={data.config}
          onSave={() => {
            qc.invalidateQueries({ queryKey: ['strategy', id] });
            setTab('results');
          }}
        />
      )}
    </div>
  );
}