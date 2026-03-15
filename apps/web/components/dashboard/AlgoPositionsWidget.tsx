'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Bot, Activity,
  RefreshCw, ExternalLink, ChevronRight, Clock, Target,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────────────────────
interface AlgoPosition {
  id: string; symbol: string; quantity: number;
  avgCost: number; costBasis: number; livePrice: number;
  marketValue: number; pnl: number; pnlPct: number;
  change1d: number; change1dAmt: number;
  volume: number; dayHigh: number; dayLow: number; openPrice: number;
  daysHeld: number; openedAt: string;
  strategyName: string; weight: number;
  stopLoss?: number; takeProfit?: number;
}
interface Summary {
  totalPositions: number; totalCostBasis: number; totalMarketValue: number;
  totalPnL: number; totalPnLPct: number; todayPnL: number;
  winners: number; losers: number; winRate: number;
  bestPosition: { symbol: string; pnlPct: number } | null;
  worstPosition: { symbol: string; pnlPct: number } | null;
  avgHoldDays: number;
}
interface Signal { symbol: string; signal: string; price: number; reason: string; timestamp: string; strategyName: string; }

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtUSD = (n: number, abs = false) =>
  `${abs || n >= 0 ? '' : '-'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct  = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const clr     = (n: number) => n >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]';
const bg      = (n: number) => n >= 0 ? 'bg-[#00d4a015] border-[#00d4a030]' : 'bg-[#f43f5e15] border-[#f43f5e30]';

const SIGNAL_STYLE: Record<string, string> = {
  BUY:  'bg-[#00d4a015] text-[#00d4a0] border-[#00d4a030]',
  SELL: 'bg-[#f43f5e15] text-[#f43f5e] border-[#f43f5e30]',
  HOLD: 'bg-[#1a1a1a] text-gray-600 border-[#252525]',
};

// ── Position Row ───────────────────────────────────────────────────────────────
function PositionRow({ pos, onClick }: { pos: AlgoPosition; onClick: () => void }) {
  const isUp   = pos.pnl >= 0;
  const td1Up  = pos.change1d >= 0;

  // Mini price bar (how price sits between day low/high)
  const range   = pos.dayHigh - pos.dayLow || 1;
  const pricePct = Math.min(100, Math.max(0, ((pos.livePrice - pos.dayLow) / range) * 100));

  // Stop / take profit progress
  const hasRisk = pos.stopLoss || pos.takeProfit;
  const stopPct  = pos.stopLoss   ? -pos.stopLoss   : null;
  const tpPct    = pos.takeProfit ?  pos.takeProfit  : null;
  const progress = tpPct ? Math.min(100, Math.max(0, (pos.pnlPct / tpPct) * 100)) : null;

  return (
    <div
      onClick={onClick}
      className={`group bg-[#111] border rounded-2xl p-4 cursor-pointer hover:border-[#2a2a2a] transition-all hover:shadow-lg hover:shadow-black/20 relative overflow-hidden ${bg(pos.pnl)}`}>

      {/* Accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isUp ? 'bg-[#00d4a0]' : 'bg-[#f43f5e]'}`} />

      <div className="pl-2">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-base">{pos.symbol}</span>
              <span className="text-[9px] bg-[#6366f115] border border-[#6366f130] text-[#818cf8] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Bot size={8} /> ALGO
              </span>
            </div>
            <p className="text-[10px] text-gray-600 mt-0.5 truncate max-w-[140px]">{pos.strategyName}</p>
          </div>

          <div className="text-right">
            <p className="text-white font-mono font-bold">${pos.livePrice.toFixed(2)}</p>
            <p className={`text-xs font-mono font-semibold ${td1Up ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
              {td1Up ? '▲' : '▼'} {Math.abs(pos.change1d).toFixed(2)}% today
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Qty</p>
            <p className="text-xs font-mono font-bold text-white">{pos.quantity}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Avg Cost</p>
            <p className="text-xs font-mono font-bold text-white">${pos.avgCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Market Val</p>
            <p className="text-xs font-mono font-bold text-white">{fmtUSD(pos.marketValue, true)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Total P&L</p>
            <p className={`text-xs font-mono font-bold ${clr(pos.pnl)}`}>{fmtUSD(pos.pnl)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Return</p>
            <p className={`text-xs font-mono font-bold ${clr(pos.pnlPct)}`}>{fmtPct(pos.pnlPct)}</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 uppercase tracking-wide">Held</p>
            <p className="text-xs font-mono font-bold text-gray-400">{pos.daysHeld}d</p>
          </div>
        </div>

        {/* Day range bar */}
        <div className="mb-2.5">
          <div className="flex justify-between text-[9px] text-gray-600 mb-1">
            <span>Lo ${pos.dayLow.toFixed(2)}</span>
            <span className="text-gray-500">Day Range</span>
            <span>Hi ${pos.dayHigh.toFixed(2)}</span>
          </div>
          <div className="relative h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#f43f5e30] to-[#00d4a030] rounded-full w-full" />
            <div className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-sm shadow-white/50 -translate-x-0.5"
              style={{ left: `${pricePct}%` }} />
          </div>
        </div>

        {/* Stop / TP progress bar */}
        {hasRisk && (
          <div className="mb-2">
            <div className="flex justify-between text-[9px] mb-1">
              {stopPct && <span className="text-[#f43f5e]">SL {stopPct}%</span>}
              <span className={`font-mono font-bold ${clr(pos.pnlPct)}`}>{fmtPct(pos.pnlPct)}</span>
              {tpPct   && <span className="text-[#00d4a0]">TP +{tpPct}%</span>}
            </div>
            {progress !== null && (
              <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${isUp ? 'bg-[#00d4a0]' : 'bg-[#f43f5e]'}`}
                  style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Weight badge */}
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-gray-600">{pos.weight}% of algo portfolio</span>
          <span className="text-[9px] text-gray-600 flex items-center gap-1 group-hover:text-[#818cf8] transition-colors">
            View trade <ChevronRight size={9} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Weight Donut ───────────────────────────────────────────────────────────────
const DONUT_COLORS = ['#00d4a0','#6366f1','#f59e0b','#ec4899','#06b6d4','#a855f7','#f43f5e','#84cc16'];

function WeightDonut({ positions }: { positions: AlgoPosition[] }) {
  const data = positions.map((p, i) => ({ name: p.symbol, value: p.marketValue, color: DONUT_COLORS[i % DONUT_COLORS.length] }));
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
      <p className="text-xs font-bold text-gray-300 mb-3">Algo Portfolio Allocation</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie data={data} cx={45} cy={45} innerRadius={28} outerRadius={45}
              dataKey="value" stroke="none">
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 min-w-0">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
              <span className="font-mono font-bold text-white text-xs flex-shrink-0">{d.name}</span>
              <div className="flex-1 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${positions[i]?.weight || 0}%`, background: d.color }} />
              </div>
              <span className="text-[10px] text-gray-500 flex-shrink-0">{positions[i]?.weight}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── P&L Bar Chart ──────────────────────────────────────────────────────────────
function PnlChart({ positions }: { positions: AlgoPosition[] }) {
  const data = positions.map(p => ({ symbol: p.symbol, pnl: p.pnl, pnlPct: p.pnlPct }));
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
      <p className="text-xs font-bold text-gray-300 mb-3">P&L by Position ($)</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top:5, right:5, left:0, bottom:0 }}>
          <XAxis dataKey="symbol" tick={{ fill:'#555', fontSize:10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill:'#555', fontSize:9  }} tickLine={false} axisLine={false}
            tickFormatter={v => `$${v >= 0 ? '' : '-'}${Math.abs(v).toFixed(0)}`} width={44} />
          <Tooltip
            formatter={(v: number) => [fmtUSD(v), 'P&L']}
            contentStyle={{ background:'#161616', border:'1px solid #252525', borderRadius:8, fontSize:11 }} />
          <ReferenceLine y={0} stroke="#333" />
          <Bar dataKey="pnl" radius={[4,4,0,0]}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#00d4a040' : '#f43f5e40'}
              stroke={d.pnl >= 0 ? '#00d4a0' : '#f43f5e'} strokeWidth={1} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Signal Timeline ────────────────────────────────────────────────────────────
function SignalTimeline({ signals }: { signals: Signal[] }) {
  if (!signals.length) return null;
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-4">
      <p className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-2">
        <Activity size={12} className="text-[#00d4a0]" /> Recent Algo Activity
      </p>
      <div className="space-y-2">
        {signals.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${SIGNAL_STYLE[s.signal] || SIGNAL_STYLE.HOLD}`}>
              {s.signal}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-xs">{s.symbol}</span>
                <span className="font-mono text-gray-500 text-[10px]">${s.price?.toFixed(2)}</span>
                <span className="text-[9px] text-gray-600 ml-auto flex-shrink-0">
                  {new Date(s.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
              <p className="text-[10px] text-gray-600 truncate mt-0.5">{s.strategyName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Widget ────────────────────────────────────────────────────────────────
export function AlgoPositionsWidget() {
  const router = useRouter();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey:        ['algo-positions'],
    queryFn:         () => apiClient.get('/api/v1/algo-positions').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const positions: AlgoPosition[]  = data?.positions    || [];
  const summary:   Summary | null  = data?.summary      || null;
  const signals:   Signal[]        = data?.recentSignals || [];

  if (isLoading) {
    return (
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-[#6366f115] rounded-lg animate-pulse" />
          <div className="h-4 w-40 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 bg-[#1a1a1a] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!positions.length) {
    return (
      <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-[#6366f115] border border-[#6366f125] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bot size={26} className="text-[#6366f1] opacity-60" />
        </div>
        <h3 className="text-white font-bold mb-1">No Algo Positions</h3>
        <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
          When your live strategies place buy orders, they'll appear here with full analysis.
        </p>
        <button onClick={() => router.push('/trading/algo')}
          className="text-xs text-[#6366f1] hover:underline flex items-center gap-1 mx-auto">
          Go to Algo Trading <ChevronRight size={12} />
        </button>
      </div>
    );
  }

  const isUp = (summary?.totalPnL || 0) >= 0;

  return (
    <div className="space-y-4">

      {/* ── Section header ────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#6366f115] border border-[#6366f130] rounded-xl flex items-center justify-center">
            <Bot size={14} className="text-[#6366f1]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Algo Trading Positions</h2>
            <p className="text-[10px] text-gray-500">{positions.length} open · live prices from Polygon.io</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/trading/algo')}
            className="text-[11px] text-[#6366f1] hover:text-[#818cf8] flex items-center gap-1 transition-colors">
            Manage strategies <ExternalLink size={10} />
          </button>
          <button onClick={() => refetch()}
            className="w-7 h-7 flex items-center justify-center bg-[#111] border border-[#1e1e1e] rounded-xl text-gray-500 hover:text-white transition-colors">
            <RefreshCw size={11} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total P&L */}
          <div className={`border rounded-xl p-3.5 ${bg(summary.totalPnL)}`}>
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Total P&L</p>
            <p className={`text-lg font-mono font-bold mt-0.5 ${clr(summary.totalPnL)}`}>
              {fmtUSD(summary.totalPnL)}
            </p>
            <p className={`text-[10px] font-mono ${clr(summary.totalPnLPct)}`}>
              {fmtPct(summary.totalPnLPct)}
            </p>
          </div>

          {/* Today */}
          <div className={`border rounded-xl p-3.5 ${bg(summary.todayPnL)}`}>
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Today's P&L</p>
            <p className={`text-lg font-mono font-bold mt-0.5 ${clr(summary.todayPnL)}`}>
              {fmtUSD(summary.todayPnL)}
            </p>
            <p className="text-[10px] text-gray-600">across {positions.length} positions</p>
          </div>

          {/* Win rate */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Win Rate</p>
            <p className={`text-lg font-mono font-bold mt-0.5 ${summary.winRate >= 50 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
              {summary.winRate.toFixed(0)}%
            </p>
            <p className="text-[10px] text-gray-600">{summary.winners}W · {summary.losers}L</p>
          </div>

          {/* Market value */}
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wide">Invested</p>
            <p className="text-lg font-mono font-bold mt-0.5 text-white">
              {fmtUSD(summary.totalMarketValue, true)}
            </p>
            <p className="text-[10px] text-gray-600">avg hold {summary.avgHoldDays}d</p>
          </div>
        </div>
      )}

      {/* ── Best / Worst callout ───────────────────────────────── */}
      {summary?.bestPosition && summary?.worstPosition && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#00d4a010] border border-[#00d4a025] rounded-xl px-4 py-2.5 flex items-center gap-3">
            <TrendingUp size={16} className="text-[#00d4a0] flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Best Position</p>
              <p className="text-sm font-mono font-bold text-white">{summary.bestPosition.symbol}
                <span className="text-[#00d4a0] ml-2 text-xs">{fmtPct(summary.bestPosition.pnlPct)}</span>
              </p>
            </div>
          </div>
          <div className="bg-[#f43f5e10] border border-[#f43f5e25] rounded-xl px-4 py-2.5 flex items-center gap-3">
            <TrendingDown size={16} className="text-[#f43f5e] flex-shrink-0" />
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-wide">Worst Position</p>
              <p className="text-sm font-mono font-bold text-white">{summary.worstPosition.symbol}
                <span className="text-[#f43f5e] ml-2 text-xs">{fmtPct(summary.worstPosition.pnlPct)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Position cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {positions.map(pos => (
          <PositionRow key={pos.id} pos={pos}
            onClick={() => router.push(`/trading/trade/${pos.symbol}`)} />
        ))}
      </div>

      {/* ── Analysis row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeightDonut positions={positions} />
        <PnlChart    positions={positions} />
        <SignalTimeline signals={signals} />
      </div>
    </div>
  );
}