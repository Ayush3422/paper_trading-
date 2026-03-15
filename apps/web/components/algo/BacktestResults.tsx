'use client';
import { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';

interface Trade {
  symbol: string; entryDate: string; exitDate: string;
  entryPrice: number; exitPrice: number; quantity: number;
  pnl: number; pnlPct: number; mae: number; mfe: number;
  exitReason: string; holdingDays: number;
}
interface EquityPoint { date: string; value: number; drawdown: number; benchmark: number; }
interface MonthlyReturn { month: string; return: number; }
interface BacktestResult {
  symbol: string; startDate: string; endDate: string;
  startingCapital: number; endingCapital: number;
  totalReturn: number; totalReturnPct: number;
  annualizedReturn: number; benchmarkReturn: number;
  maxDrawdownPct: number; maxDrawdownDuration: number;
  sharpeRatio: number; sortinoRatio: number; calmarRatio: number;
  winRate: number; profitFactor: number;
  totalTrades: number; winningTrades: number; losingTrades: number;
  avgWin: number; avgLoss: number; avgHoldingDays: number;
  bestTrade: number; worstTrade: number;
  consecutiveWins: number; consecutiveLosses: number;
  recoveryFactor: number; expectancy: number;
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  trades: Trade[];
}

const fmt = (n: number, d = 2) => n.toFixed(d);
const fmtUSD = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number, plus = true) => `${plus && n > 0 ? '+' : ''}${n.toFixed(2)}%`;

const grade = (metric: string, val: number): string => {
  const grades: Record<string, [number, number, string, string, string]> = {
    sharpe:   [1.5, 1.0, 'text-[#00d4a0]', 'text-[#f59e0b]', 'text-[#f43f5e]'],
    winRate:  [55,  45,  'text-[#00d4a0]', 'text-[#f59e0b]', 'text-[#f43f5e]'],
    pf:       [1.5, 1.0, 'text-[#00d4a0]', 'text-[#f59e0b]', 'text-[#f43f5e]'],
    dd:       [10,  20,  'text-[#00d4a0]', 'text-[#f59e0b]', 'text-[#f43f5e]'],
    return:   [15,  5,   'text-[#00d4a0]', 'text-[#f59e0b]', 'text-[#f43f5e]'],
  };
  const g = grades[metric];
  if (!g) return 'text-white';
  if (metric === 'dd') return val < g[0] ? g[2] : val < g[1] ? g[3] : g[4];
  return val >= g[0] ? g[2] : val >= g[1] ? g[3] : g[4];
};

function StatCard({ label, value, sub, className = '' }: { label: string; value: React.ReactNode; sub?: string; className?: string }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3.5">
      <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-1">{label}</p>
      <div className={`text-base font-mono font-bold ${className}`}>{value}</div>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

const EquityTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#161616] border border-[#252525] rounded-xl px-3 py-2 shadow-2xl text-xs space-y-0.5">
      <p className="text-gray-500 text-[10px]">{d?.date}</p>
      <p className="text-white font-mono font-bold">{fmtUSD(d?.value)}</p>
      <p className="text-[#6366f1] font-mono">BH: {fmtUSD(d?.benchmark)}</p>
      {d?.drawdown > 0.1 && <p className="text-[#f43f5e] font-mono">DD: -{d?.drawdown?.toFixed(1)}%</p>}
    </div>
  );
};

const MonthTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="bg-[#161616] border border-[#252525] rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-500">{payload[0]?.payload?.month}</p>
      <p className={`font-mono font-bold ${v >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>{fmtPct(v)}</p>
    </div>
  );
};

const EXIT_BADGE: Record<string, string> = {
  SIGNAL:        'bg-[#6366f115] text-[#818cf8]',
  STOP_LOSS:     'bg-[#f43f5e15] text-[#f43f5e]',
  TAKE_PROFIT:   'bg-[#00d4a015] text-[#00d4a0]',
  TRAILING_STOP: 'bg-[#f59e0b15] text-[#f59e0b]',
  END_OF_DATA:   'bg-[#1e1e1e] text-gray-500',
};

export function BacktestResults({ results }: { results: BacktestResult[] }) {
  const [activeSymbol, setActiveSymbol] = useState(0);
  const [tab, setTab] = useState<'overview'|'trades'|'monthly'>('overview');
  const [tradePage, setTradePage] = useState(0);
  const TRADES_PER_PAGE = 15;

  if (!results?.length) return null;
  const r   = results[activeSymbol] || results[0];
  const isUp = r.totalReturnPct >= 0;
  const color = isUp ? '#00d4a0' : '#f43f5e';
  const outperform = r.totalReturnPct - r.benchmarkReturn;

  // Downsample equity curve for performance
  const stride   = Math.max(1, Math.floor(r.equityCurve.length / 200));
  const curve    = r.equityCurve.filter((_, i) => i % stride === 0);
  const tradePgs = Math.ceil(r.trades.length / TRADES_PER_PAGE);
  const pageTrades = [...r.trades].reverse().slice(tradePage * TRADES_PER_PAGE, (tradePage + 1) * TRADES_PER_PAGE);

  return (
    <div className="space-y-4">

      {/* Symbol tabs */}
      {results.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {results.map((res, i) => (
            <button key={res.symbol} onClick={() => setActiveSymbol(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${activeSymbol === i ? 'bg-[#6366f115] border-[#6366f130] text-[#818cf8]' : 'bg-[#111] border-[#1e1e1e] text-gray-500 hover:text-gray-300'}`}>
              {res.symbol}
              <span className={`text-[9px] ${(res.totalReturnPct||0) >= 0 ? 'text-[#00d4a0]':'text-[#f43f5e]'}`}>
                {fmtPct(res.totalReturnPct||0)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Score card row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Return" sub={fmtUSD(r.totalReturn)}
          value={fmtPct(r.totalReturnPct)} className={isUp ? 'text-[#00d4a0]' : 'text-[#f43f5e]'} />
        <StatCard label="Annualized Return" sub={`vs BH ${fmtPct(r.benchmarkReturn)}`}
          value={fmtPct(r.annualizedReturn)}
          className={r.annualizedReturn >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'} />
        <StatCard label="vs Buy & Hold" sub={outperform >= 0 ? 'Outperforms 🏆' : 'Underperforms'}
          value={fmtPct(outperform)}
          className={outperform >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'} />
        <StatCard label="Max Drawdown" sub={`${r.maxDrawdownDuration} days duration`}
          value={`-${fmt(r.maxDrawdownPct)}%`} className={grade('dd', r.maxDrawdownPct)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Sharpe Ratio"   sub="Risk-adjusted (ann.)" value={fmt(r.sharpeRatio)}   className={grade('sharpe', r.sharpeRatio)} />
        <StatCard label="Sortino Ratio"  sub="Downside-adjusted"    value={fmt(r.sortinoRatio)}  className={grade('sharpe', r.sortinoRatio)} />
        <StatCard label="Calmar Ratio"   sub="Return / Max DD"      value={fmt(r.calmarRatio)}   className={grade('sharpe', r.calmarRatio)} />
        <StatCard label="Profit Factor"  sub={`Gross W/L ratio`}    value={r.profitFactor > 0 ? fmt(r.profitFactor) : 'N/A'} className={grade('pf', r.profitFactor)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Win Rate" sub={`${r.winningTrades}W / ${r.losingTrades}L / ${r.totalTrades} trades`}
          value={`${fmt(r.winRate, 1)}%`} className={grade('winRate', r.winRate)} />
        <StatCard label="Avg Win"  sub={`Best: +${fmt(r.bestTrade)}%`}  value={`$${fmt(r.avgWin,0)}`}  className="text-[#00d4a0]" />
        <StatCard label="Avg Loss" sub={`Worst: ${fmt(r.worstTrade)}%`} value={`-$${fmt(r.avgLoss,0)}`} className="text-[#f43f5e]" />
        <StatCard label="Expectancy" sub={`${fmt(r.avgHoldingDays,1)} avg hold days`}
          value={`$${fmt(r.expectancy,0)}`} className={r.expectancy >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Recovery Factor" sub="Return / Max DD" value={fmt(r.recoveryFactor)} className={r.recoveryFactor >= 1 ? 'text-[#00d4a0]' : 'text-[#f59e0b]'} />
        <StatCard label="Max Consec. Wins"   value={r.consecutiveWins}   sub="In a row" className="text-[#00d4a0]" />
        <StatCard label="Max Consec. Losses" value={r.consecutiveLosses} sub="In a row" className="text-[#f43f5e]" />
        <StatCard label="Period" value={`${Math.round(r.equityCurve.length / 21)}mo`}
          sub={`${r.startDate} → ${r.endDate}`} />
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111] border border-[#1e1e1e] rounded-xl p-1 gap-1 w-fit">
        {(['overview','monthly','trades'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? 'bg-[#1e1e1e] text-white' : 'text-gray-600 hover:text-gray-300'}`}>
            {t === 'overview' ? '📈 Equity Curve' : t === 'monthly' ? '📅 Monthly P&L' : `📋 Trade Log (${r.trades.length})`}
          </button>
        ))}
      </div>

      {/* Equity curve */}
      {tab === 'overview' && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Portfolio Equity vs Buy & Hold</h4>
              <p className="text-[10px] text-gray-600 mt-0.5">{r.symbol} · {r.startDate} → {r.endDate}</p>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-0.5" style={{ background: color }} /> Strategy</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-[#6366f1]" /> Buy & Hold</span>
            </div>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={curve} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} width={44} />
                <Tooltip content={<EquityTip />} />
                <ReferenceLine y={r.startingCapital} stroke="#333" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="benchmark" stroke="#6366f1" strokeWidth={1.5} fill="url(#bg)" dot={false} strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#sg)" dot={false} activeDot={{ r: 4, fill: color, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Drawdown sub-chart */}
          <div className="px-4 pb-4">
            <p className="text-[10px] text-gray-600 mb-2">Drawdown %</p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={curve} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fill: '#555', fontSize: 8 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `-${v.toFixed(0)}%`} width={36} reversed />
                <Area type="monotone" dataKey="drawdown" stroke="#f43f5e" strokeWidth={1.5} fill="url(#ddg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly heatmap */}
      {tab === 'monthly' && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
            <h4 className="text-sm font-bold text-white">Monthly Returns</h4>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={r.monthlyReturns} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#555', fontSize: 8 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={36} />
                <Tooltip content={<MonthTip />} />
                <ReferenceLine y={0} stroke="#333" />
                <Bar dataKey="return" radius={[3, 3, 0, 0]}>
                  {r.monthlyReturns.map((entry, i) => (
                    <Cell key={i} fill={entry.return >= 0 ? '#00d4a040' : '#f43f5e40'}
                      stroke={entry.return >= 0 ? '#00d4a0' : '#f43f5e'} strokeWidth={1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Heatmap grid */}
            <div className="mt-4 grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {r.monthlyReturns.map((m, i) => {
                const intensity = Math.min(1, Math.abs(m.return) / 10);
                const bg = m.return >= 0
                  ? `rgba(0,212,160,${0.1 + intensity * 0.4})`
                  : `rgba(244,63,94,${0.1 + intensity * 0.4})`;
                return (
                  <div key={i} className="rounded-lg p-1.5 text-center" style={{ background: bg }} title={m.month}>
                    <p className="text-[8px] text-gray-500 leading-none">{m.month.slice(5)}</p>
                    <p className={`text-[10px] font-mono font-bold leading-none mt-0.5 ${m.return >= 0 ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
                      {m.return >= 0 ? '+' : ''}{m.return.toFixed(1)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trade log */}
      {tab === 'trades' && (
        <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Trade Log</h4>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="text-[#00d4a0]">■ {r.winningTrades} wins</span>
              <span className="text-[#f43f5e]">■ {r.losingTrades} losses</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1a1a1a] bg-[#0c0c0c]">
                  {['#','Symbol','Entry','Exit Date','Entry $','Exit $','Qty','P&L $','Return %','MAE','MFE','Hold','Reason'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] text-gray-600 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageTrades.map((t, i) => {
                  const win = t.pnl > 0;
                  const n = r.trades.length - (tradePage * TRADES_PER_PAGE + i);
                  return (
                    <tr key={i} className="border-b border-[#141414] hover:bg-[#141414] transition-colors">
                      <td className="px-3 py-2 text-gray-700 font-mono text-[10px]">{n}</td>
                      <td className="px-3 py-2 font-mono font-bold text-white">{t.symbol}</td>
                      <td className="px-3 py-2 font-mono text-gray-500 text-[10px]">{t.entryDate}</td>
                      <td className="px-3 py-2 font-mono text-gray-500 text-[10px]">{t.exitDate}</td>
                      <td className="px-3 py-2 font-mono text-gray-300">${t.entryPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-gray-300">${t.exitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-gray-500">{t.quantity}</td>
                      <td className={`px-3 py-2 font-mono font-bold ${win ? 'text-[#00d4a0]' : 'text-[#f43f5e]'}`}>
                        {win ? '+' : ''}{t.pnl.toFixed(0)}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${win ? 'bg-[#00d4a015] text-[#00d4a0]' : 'bg-[#f43f5e15] text-[#f43f5e]'}`}>
                          {win ? '+' : ''}{t.pnlPct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#f43f5e]">{t.mae.toFixed(1)}%</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-[#00d4a0]">+{t.mfe.toFixed(1)}%</td>
                      <td className="px-3 py-2 font-mono text-gray-600 text-[10px]">{t.holdingDays}d</td>
                      <td className="px-3 py-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${EXIT_BADGE[t.exitReason] || ''}`}>
                          {t.exitReason.replace(/_/g,' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tradePgs > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
              <p className="text-[10px] text-gray-600">Page {tradePage + 1} of {tradePgs}</p>
              <div className="flex gap-2">
                <button disabled={tradePage === 0} onClick={() => setTradePage(p => p - 1)}
                  className="px-3 py-1 text-xs rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">← Prev</button>
                <button disabled={tradePage >= tradePgs - 1} onClick={() => setTradePage(p => p + 1)}
                  className="px-3 py-1 text-xs rounded-lg bg-[#1a1a1a] text-gray-400 hover:text-white disabled:opacity-30 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}