'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Activity, RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

interface SignalLog {
  id:          string;
  strategyId:  string;
  strategyName:string;
  symbol:      string;
  signal:      'BUY' | 'SELL' | 'HOLD' | 'ERROR';
  price:       number;
  reason:      string;
  conditions:  { label: string; met: boolean; value: string }[];
  orderPlaced: boolean;
  orderId?:    string;
  timestamp:   string;
}

interface WorkerStatus {
  waiting:        number;
  active:         number;
  completed:      number;
  failed:         number;
  repeatableJobs: number;
  nextRun:        string | null;
}

const SIGNAL_STYLE = {
  BUY:   { bg:'bg-[#00d4a015]', border:'border-[#00d4a030]', text:'text-[#00d4a0]', icon:<TrendingUp  size={13}/> },
  SELL:  { bg:'bg-[#f43f5e15]', border:'border-[#f43f5e30]', text:'text-[#f43f5e]', icon:<TrendingDown size={13}/> },
  HOLD:  { bg:'bg-[#1a1a1a]',   border:'border-[#252525]',   text:'text-gray-500',  icon:<Minus size={13}/> },
  ERROR: { bg:'bg-[#f59e0b15]', border:'border-[#f59e0b30]', text:'text-[#f59e0b]', icon:<AlertCircle size={13}/> },
};

function timeAgo(ts: string): string {
  const secs = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
}

function SignalRow({ log }: { log: SignalLog }) {
  const [expanded, setExpanded] = useState(false);
  const style = SIGNAL_STYLE[log.signal] || SIGNAL_STYLE.HOLD;
  const ts    = new Date(log.timestamp).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${style.border} ${log.signal !== 'HOLD' ? style.bg : 'bg-[#111]'}`}>
      <div className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02]"
        onClick={() => log.conditions?.length && setExpanded(v => !v)}>

        {/* Signal badge */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold flex-shrink-0 ${style.bg} ${style.border} ${style.text}`}>
          {style.icon}
          {log.signal}
        </div>

        {/* Symbol */}
        <span className="font-mono font-bold text-white text-sm w-14 flex-shrink-0">{log.symbol}</span>

        {/* Price */}
        <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0">${log.price.toFixed(2)}</span>

        {/* Strategy name */}
        <span className="text-[11px] text-gray-500 truncate flex-1 min-w-0">{log.strategyName}</span>

        {/* Order placed */}
        {log.orderPlaced && (
          <span className="flex items-center gap-1 text-[10px] text-[#00d4a0] bg-[#00d4a015] border border-[#00d4a030] px-2 py-0.5 rounded-full flex-shrink-0">
            <CheckCircle size={10}/> Order placed
          </span>
        )}

        {/* Time */}
        <span className="text-[10px] text-gray-600 flex-shrink-0 tabular-nums">{ts}</span>

        {/* Expand indicator */}
        {log.conditions?.length > 0 && (
          <span className="text-gray-600 text-[10px] flex-shrink-0">{expanded ? '▲' : '▼'}</span>
        )}
      </div>

      {/* Conditions breakdown */}
      {expanded && log.conditions?.length > 0 && (
        <div className="border-t border-[#1e1e1e] px-4 py-3 space-y-1.5">
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Condition Check</p>
          {log.conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              {c.met
                ? <CheckCircle size={11} className="text-[#00d4a0] flex-shrink-0" />
                : <XCircle    size={11} className="text-[#f43f5e] flex-shrink-0" />
              }
              <span className={`text-[11px] font-mono ${c.met ? 'text-gray-300' : 'text-gray-600'}`}>{c.label}</span>
              <span className="ml-auto text-[10px] font-mono text-gray-600">{c.value}</span>
            </div>
          ))}
          {log.reason && (
            <p className={`text-[10px] mt-2 pt-2 border-t border-[#1e1e1e] ${style.text}`}>
              {log.reason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function LiveSignalMonitor({ strategyId }: { strategyId?: string }) {
  const [filter, setFilter] = useState<'ALL'|'BUY'|'SELL'|'HOLD'>('ALL');
  const [runningNow, setRunningNow] = useState(false);

  const endpoint = strategyId
    ? `/api/v1/algo/strategies/${strategyId}/signals`
    : '/api/v1/algo/signals';

  const { data: signalData, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey:      ['signals', strategyId],
    queryFn:       () => apiClient.get(`${endpoint}?limit=100`).then(r => r.data.data),
    refetchInterval: 60_000, // auto-refresh every 60s
  });

  const { data: workerData } = useQuery({
    queryKey:      ['worker-status'],
    queryFn:       () => apiClient.get('/api/v1/algo/worker-status').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const logs: SignalLog[] = signalData || [];
  const worker: WorkerStatus | null = workerData || null;

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.signal === filter);
  const buys  = logs.filter(l => l.signal === 'BUY').length;
  const sells = logs.filter(l => l.signal === 'SELL').length;
  const holds = logs.filter(l => l.signal === 'HOLD').length;
  const orders = logs.filter(l => l.orderPlaced).length;

  const runNow = async () => {
    setRunningNow(true);
    try {
      await apiClient.post('/api/v1/algo/run-now', {}, { timeout: 30000 });
      await refetch();
    } finally {
      setRunningNow(false);
    }
  };

  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className={logs.length > 0 ? 'text-[#00d4a0] animate-pulse' : 'text-gray-600'} />
            <h3 className="text-sm font-bold text-white">Live Signal Monitor</h3>
          </div>

          {/* Worker status pill */}
          {worker && (
            <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border ${
              worker.repeatableJobs > 0
                ? 'bg-[#00d4a015] border-[#00d4a030] text-[#00d4a0]'
                : 'bg-[#f59e0b15] border-[#f59e0b30] text-[#f59e0b]'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${worker.repeatableJobs > 0 ? 'bg-[#00d4a0] animate-pulse' : 'bg-[#f59e0b]'}`} />
              {worker.repeatableJobs > 0 ? 'Worker running' : 'Worker stopped'}
              {worker.nextRun && (
                <span className="opacity-60">· next: {new Date(worker.nextRun).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">Updated {lastUpdate}</span>
          <button onClick={runNow} disabled={runningNow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366f115] border border-[#6366f130] text-[#818cf8] text-xs font-semibold rounded-xl hover:bg-[#6366f125] transition-colors disabled:opacity-50">
            <RefreshCw size={12} className={runningNow ? 'animate-spin' : ''} />
            {runningNow ? 'Running...' : 'Run Now'}
          </button>
          <button onClick={() => refetch()}
            className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-white bg-[#1a1a1a] border border-[#252525] rounded-xl transition-colors">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 border-b border-[#1a1a1a]">
        {[
          { label:'BUY signals',   value:buys,  color:'text-[#00d4a0]' },
          { label:'SELL signals',  value:sells, color:'text-[#f43f5e]' },
          { label:'HOLD checks',   value:holds, color:'text-gray-500'  },
          { label:'Orders placed', value:orders,color:'text-[#818cf8]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="px-4 py-3 text-center border-r border-[#1a1a1a] last:border-0">
            <p className={`text-base font-mono font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-3 border-b border-[#1a1a1a]">
        {(['ALL','BUY','SELL','HOLD'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filter === f
                ? f === 'BUY'  ? 'bg-[#00d4a015] text-[#00d4a0] border border-[#00d4a030]'
                : f === 'SELL' ? 'bg-[#f43f5e15] text-[#f43f5e] border border-[#f43f5e30]'
                : 'bg-[#1e1e1e] text-white border border-[#252525]'
                : 'text-gray-600 hover:text-gray-300'
            }`}>
            {f} {f !== 'ALL' && <span className="opacity-60 ml-0.5 text-[10px]">({f === 'BUY' ? buys : f === 'SELL' ? sells : holds})</span>}
          </button>
        ))}
      </div>

      {/* Signal list */}
      <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#1a1a1a] rounded-xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={28} className="mx-auto mb-3 text-gray-700" />
            <p className="text-gray-500 text-sm font-medium">No signals yet</p>
            <p className="text-gray-600 text-xs mt-1">
              {logs.length === 0
                ? 'The worker checks your active strategies every 60 seconds during market hours. Click "Run Now" to trigger immediately.'
                : `No ${filter} signals in history`}
            </p>
            {logs.length === 0 && (
              <button onClick={runNow} disabled={runningNow}
                className="mt-4 px-4 py-2 bg-[#6366f1] text-white text-xs font-bold rounded-xl hover:bg-[#5558e3] transition-colors disabled:opacity-50">
                {runningNow ? 'Running check...' : '▶ Run Check Now'}
              </button>
            )}
          </div>
        ) : (
          filtered.map(log => <SignalRow key={log.id} log={log} />)
        )}
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#1a1a1a] text-[10px] text-gray-600">
          Showing {filtered.length} signals · Auto-refreshes every 60s · Click any row to see condition details
        </div>
      )}
    </div>
  );
}