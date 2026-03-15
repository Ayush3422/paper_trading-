'use client';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';

interface Props {
  symbol: string;
}

interface OptionContract {
  strike: number;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;        // implied volatility %
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  itm: boolean;      // in the money
  change: number;
  changePct: number;
}

// ── Black-Scholes simplified Greeks simulation ────────────────────────────────
function generateOptions(
  currentPrice: number,
  strike: number,
  daysToExpiry: number,
  isCall: boolean,
  baseIV: number
): OptionContract {
  const T   = daysToExpiry / 365;
  const r   = 0.05;  // risk-free rate
  const vol = baseIV + (Math.random() - 0.5) * 0.05;

  // Moneyness
  const moneyness = isCall
    ? (currentPrice - strike) / currentPrice
    : (strike - currentPrice) / currentPrice;

  // ITM check
  const itm = isCall ? currentPrice > strike : currentPrice < strike;

  // Simplified delta
  const delta = isCall
    ? Math.max(0.01, Math.min(0.99, 0.5 + moneyness * 2))
    : Math.max(-0.99, Math.min(-0.01, -0.5 + moneyness * 2));

  // IV skew — higher for far OTM
  const ivSkew = Math.abs(moneyness) * 0.3;
  const iv     = Math.max(0.05, Math.min(2.0, vol + ivSkew));

  // Option price using simplified model
  const intrinsic = Math.max(0, isCall ? currentPrice - strike : strike - currentPrice);
  const timeValue = currentPrice * iv * Math.sqrt(T) * 0.4 * Math.exp(-Math.abs(moneyness) * 2);
  const midPrice  = Math.max(0.01, intrinsic + timeValue);

  // Bid/Ask spread widens for OTM
  const spread = midPrice * (0.05 + Math.abs(moneyness) * 0.1);
  const bid    = Math.max(0.01, midPrice - spread / 2);
  const ask    = midPrice + spread / 2;
  const last   = midPrice * (0.97 + Math.random() * 0.06);

  // Volume & OI — higher for ATM
  const atmProximity = Math.exp(-Math.abs(moneyness) * 5);
  const volume       = Math.floor(atmProximity * 15000 * (0.5 + Math.random()));
  const openInterest = Math.floor(atmProximity * 40000 * (0.5 + Math.random()));

  // Greeks
  const gamma = Math.max(0, atmProximity * 0.05 * (1 / (currentPrice * iv * Math.sqrt(T) + 0.001)));
  const theta = -Math.max(0, (midPrice * iv) / (2 * Math.sqrt(T) + 0.001)) * (1 / 365);
  const vega  = Math.max(0, currentPrice * Math.sqrt(T) * 0.01 * atmProximity);

  const change    = (Math.random() - 0.45) * midPrice * 0.3;
  const changePct = (change / midPrice) * 100;

  return {
    strike,
    bid:  parseFloat(bid.toFixed(2)),
    ask:  parseFloat(ask.toFixed(2)),
    last: parseFloat(last.toFixed(2)),
    volume,
    openInterest,
    iv:   parseFloat((iv * 100).toFixed(1)),
    delta: parseFloat(delta.toFixed(3)),
    gamma: parseFloat(gamma.toFixed(4)),
    theta: parseFloat(theta.toFixed(4)),
    vega:  parseFloat(vega.toFixed(4)),
    itm,
    change:    parseFloat(change.toFixed(2)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

function generateExpiryDates() {
  const dates: { label: string; value: string; dte: number }[] = [];
  const now = new Date();
  // Weekly — next 4 Fridays
  for (let w = 1; w <= 4; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7) + (w - 1) * 7);
    const dte = Math.round((d.getTime() - now.getTime()) / 86400000);
    dates.push({ label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${dte}d)`, value: d.toISOString().split('T')[0], dte });
  }
  // Monthly — next 4 third Fridays
  for (let m = 1; m <= 4; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    let fridays = 0;
    while (fridays < 3) { if (d.getDay() === 5) fridays++; if (fridays < 3) d.setDate(d.getDate() + 1); }
    const dte = Math.round((d.getTime() - now.getTime()) / 86400000);
    dates.push({ label: `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${dte}d)`, value: d.toISOString().split('T')[0], dte });
  }
  return dates;
}

function generateStrikes(price: number, count = 16) {
  const step = price < 50 ? 1 : price < 200 ? 5 : price < 500 ? 10 : 25;
  const atm   = Math.round(price / step) * step;
  const half  = Math.floor(count / 2);
  return Array.from({ length: count }, (_, i) => atm + (i - half) * step);
}

function fmtNum(n: number, dec = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtVol(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
}

const GREEK_INFO: Record<string, string> = {
  Delta: 'Rate of change of option price per $1 move in underlying.',
  Gamma: 'Rate of change of Delta per $1 move in underlying.',
  Theta: 'Daily time decay — how much the option loses per day.',
  Vega:  'Sensitivity to 1% change in implied volatility.',
  IV:    'Implied Volatility — market\'s expectation of future price movement.',
};

export function OptionsChain({ symbol }: Props) {
  const [optionType, setOptionType] = useState<'CALLS' | 'PUTS' | 'BOTH'>('CALLS');
  const [expiryIdx, setExpiryIdx]   = useState(0);
  const [showGreeks, setShowGreeks] = useState(false);
  const [hoveredGreek, setHoveredGreek] = useState<string | null>(null);

  const { data: quoteData } = useQuery({
    queryKey: ['quote', symbol],
    queryFn: () => apiClient.get(`/api/v1/market/quote/${symbol}`).then(r => r.data.data),
    refetchInterval: 10000,
  });

  const price   = quoteData?.price || 150;
  const expiries = useMemo(() => generateExpiryDates(), []);
  const strikes  = useMemo(() => generateStrikes(price), [price]);
  const expiry   = expiries[expiryIdx];
  const dte      = expiry?.dte || 30;

  // Base IV from price volatility (simulated)
  const baseIV = 0.25 + (Math.sin(price * 0.01) * 0.1);

  const calls = useMemo(() =>
    strikes.map(s => generateOptions(price, s, dte, true,  baseIV)),
    [price, strikes, dte, baseIV]
  );
  const puts = useMemo(() =>
    strikes.map(s => generateOptions(price, s, dte, false, baseIV)),
    [price, strikes, dte, baseIV]
  );

  // Max OI for bar scaling
  const maxOI = Math.max(...calls.map(c => c.openInterest), ...puts.map(p => p.openInterest), 1);

  const cols = showGreeks
    ? ['Strike', 'Bid', 'Ask', 'Last', 'Chg', 'Vol', 'OI', 'IV', 'Δ Delta', 'Γ Gamma', 'Θ Theta', 'V Vega']
    : ['Strike', 'Bid', 'Ask', 'Last', 'Chg %', 'Volume', 'Open Int', 'IV %'];

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] bg-[#131313]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#6366f115] rounded-lg flex items-center justify-center">
            <span className="text-[#6366f1] text-xs font-bold">⛓</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Options Chain</h3>
          <span className="text-[10px] text-gray-500 bg-[#1e1e1e] px-2 py-0.5 rounded-full">{symbol}</span>
          <span className="text-[10px] text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Simulated</span>
        </div>

        {/* Current price reference */}
        <div className="flex items-center gap-1.5 text-xs font-mono ml-auto">
          <span className="text-gray-500">Underlying:</span>
          <span className="text-white font-bold">${fmtNum(price)}</span>
        </div>
      </div>

      {/* ── Controls ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-[#1e1e1e]">

        {/* Call / Put / Both */}
        <div className="flex bg-[#1a1a1a] rounded-lg p-0.5 gap-0.5">
          {(['CALLS','PUTS','BOTH'] as const).map(t => (
            <button key={t} onClick={() => setOptionType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                optionType === t
                  ? t === 'CALLS'
                    ? 'bg-[#00d4a0] text-black'
                    : t === 'PUTS'
                    ? 'bg-[#ff4d4d] text-white'
                    : 'bg-[#6366f1] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Expiry selector */}
        <select
          value={expiryIdx}
          onChange={e => setExpiryIdx(Number(e.target.value))}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366f1] cursor-pointer"
        >
          <optgroup label="── Weekly ──" />
          {expiries.slice(0, 4).map((exp, i) => (
            <option key={exp.value} value={i}>{exp.label}</option>
          ))}
          <optgroup label="── Monthly ──" />
          {expiries.slice(4).map((exp, i) => (
            <option key={exp.value} value={i + 4}>{exp.label}</option>
          ))}
        </select>

        {/* Greeks toggle */}
        <button
          onClick={() => setShowGreeks(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showGreeks
              ? 'bg-[#6366f120] text-[#6366f1] border-[#6366f140]'
              : 'bg-[#1a1a1a] text-gray-400 border-[#2a2a2a] hover:text-white'
          }`}
        >
          <span className="text-sm">Δ</span> Greeks
        </button>

        {/* DTE info */}
        <div className="ml-auto text-xs text-gray-500 flex items-center gap-1">
          <span className="text-[#6366f1] font-mono font-bold">{dte}</span> days to expiry
        </div>
      </div>

      {/* ── Greeks tooltip ─────────────────────────────────── */}
      {showGreeks && hoveredGreek && (
        <div className="px-4 py-2 bg-[#6366f110] border-b border-[#6366f130] text-xs text-[#6366f1]">
          <span className="font-semibold">{hoveredGreek}:</span> {GREEK_INFO[hoveredGreek.replace(/[ΔΓΘVδγθν\s]/g, '')]}
        </div>
      )}

      {/* ── BOTH view — side by side ───────────────────────── */}
      {optionType === 'BOTH' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#131313]">
                {/* Calls headers */}
                {['IV','OI','Vol','Last','Ask','Bid'].map(h => (
                  <th key={`c-${h}`} className="px-3 py-2 text-right text-[10px] text-[#00d4a070] font-medium">{h}</th>
                ))}
                {/* Strike center */}
                <th className="px-4 py-2 text-center text-[10px] text-gray-400 font-bold bg-[#1a1a1a]">STRIKE</th>
                {/* Puts headers */}
                {['Bid','Ask','Last','Vol','OI','IV'].map(h => (
                  <th key={`p-${h}`} className="px-3 py-2 text-left text-[10px] text-[#ff4d4d70] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strikes.map((strike, i) => {
                const call   = calls[i];
                const put    = puts[i];
                const isATM  = Math.abs(strike - price) < (strikes[1] - strikes[0]) / 2;
                return (
                  <tr key={strike}
                    className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a] transition-colors ${isATM ? 'ring-1 ring-inset ring-[#00d4a020]' : ''}`}>
                    {/* Call data */}
                    <td className={`px-3 py-2 text-right font-mono ${call.itm ? 'text-[#00d4a0]' : 'text-gray-500'}`}>{call.iv}%</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400">{fmtVol(call.openInterest)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400">{fmtVol(call.volume)}</td>
                    <td className={`px-3 py-2 text-right font-mono font-semibold ${call.itm ? 'text-white' : 'text-gray-400'}`}>${fmtNum(call.last)}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-300">${fmtNum(call.ask)}</td>
                    <td className={`px-3 py-2 text-right font-mono ${call.itm ? 'bg-[#00d4a008]' : ''}`}>
                      <span className="text-[#00d4a0]">${fmtNum(call.bid)}</span>
                    </td>

                    {/* Strike */}
                    <td className={`px-4 py-2 text-center font-mono font-bold bg-[#1a1a1a] border-x border-[#262626] ${isATM ? 'text-[#00d4a0]' : 'text-white'}`}>
                      {isATM && <span className="text-[8px] text-[#00d4a0] block leading-none mb-0.5">ATM</span>}
                      ${strike.toFixed(0)}
                    </td>

                    {/* Put data */}
                    <td className={`px-3 py-2 text-left font-mono ${put.itm ? 'bg-[#ff4d4d08]' : ''}`}>
                      <span className="text-[#ff4d4d]">${fmtNum(put.bid)}</span>
                    </td>
                    <td className="px-3 py-2 text-left font-mono text-gray-300">${fmtNum(put.ask)}</td>
                    <td className={`px-3 py-2 text-left font-mono font-semibold ${put.itm ? 'text-white' : 'text-gray-400'}`}>${fmtNum(put.last)}</td>
                    <td className="px-3 py-2 text-left font-mono text-gray-400">{fmtVol(put.volume)}</td>
                    <td className="px-3 py-2 text-left font-mono text-gray-400">{fmtVol(put.openInterest)}</td>
                    <td className={`px-3 py-2 text-left font-mono ${put.itm ? 'text-[#ff4d4d]' : 'text-gray-500'}`}>{put.iv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      ) : (
        /* ── Single side view ─────────────────────────────── */
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e1e1e] bg-[#131313]">
                {cols.map(col => (
                  <th key={col}
                    onMouseEnter={() => showGreeks && setHoveredGreek(col)}
                    onMouseLeave={() => setHoveredGreek(null)}
                    className={`px-3 py-2.5 text-left text-[10px] font-medium whitespace-nowrap select-none ${
                      ['Δ Delta','Γ Gamma','Θ Theta','V Vega'].includes(col)
                        ? 'text-[#6366f1] cursor-help'
                        : col === 'IV' || col === 'IV %'
                        ? 'text-[#f59e0b] cursor-help'
                        : 'text-gray-500'
                    }`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strikes.map((strike, i) => {
                const opt    = optionType === 'CALLS' ? calls[i] : puts[i];
                const isATM  = Math.abs(strike - price) < (strikes[1] - strikes[0]) / 2;
                const isITM  = opt.itm;
                const isUp   = opt.change >= 0;

                return (
                  <tr key={strike}
                    className={`border-b transition-colors cursor-pointer group
                      ${isATM     ? 'border-[#00d4a030] bg-[#00d4a005]' : 'border-[#1a1a1a]'}
                      ${isITM     ? 'hover:bg-[#00d4a008]' : 'hover:bg-[#1a1a1a]'}
                    `}>

                    {/* Strike */}
                    <td className="px-3 py-2.5 relative">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-sm ${isATM ? 'text-[#00d4a0]' : isITM ? 'text-white' : 'text-gray-400'}`}>
                          ${strike.toFixed(0)}
                        </span>
                        {isATM && (
                          <span className="text-[9px] font-bold text-black bg-[#00d4a0] px-1.5 py-0.5 rounded-full">ATM</span>
                        )}
                        {isITM && !isATM && (
                          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                            optionType === 'CALLS' ? 'bg-[#00d4a015] text-[#00d4a0]' : 'bg-[#ff4d4d15] text-[#ff4d4d]'
                          }`}>ITM</span>
                        )}
                      </div>
                      {/* OI bar */}
                      <div className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                        style={{
                          width: `${(opt.openInterest / maxOI) * 100}%`,
                          background: optionType === 'CALLS' ? '#00d4a040' : '#ff4d4d40',
                        }}
                      />
                    </td>

                    {/* Bid */}
                    <td className="px-3 py-2.5">
                      <span className={`font-mono font-semibold ${optionType === 'CALLS' ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                        ${fmtNum(opt.bid)}
                      </span>
                    </td>

                    {/* Ask */}
                    <td className="px-3 py-2.5 font-mono text-gray-300">${fmtNum(opt.ask)}</td>

                    {/* Last */}
                    <td className="px-3 py-2.5 font-mono font-semibold text-white">${fmtNum(opt.last)}</td>

                    {/* Change */}
                    {showGreeks ? (
                      <td className={`px-3 py-2.5 font-mono text-xs ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                        {isUp ? '+' : ''}{fmtNum(opt.change)}
                      </td>
                    ) : (
                      <td className="px-3 py-2.5">
                        <span className={`font-mono text-xs font-medium px-1.5 py-0.5 rounded-full ${isUp ? 'bg-[#00d4a015] text-[#00d4a0]' : 'bg-[#ff4d4d15] text-[#ff4d4d]'}`}>
                          {isUp ? '+' : ''}{fmtNum(opt.changePct)}%
                        </span>
                      </td>
                    )}

                    {/* Volume */}
                    <td className="px-3 py-2.5 font-mono text-gray-400">{fmtVol(opt.volume)}</td>

                    {/* Open Interest */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-400">{fmtVol(opt.openInterest)}</span>
                        <div className="flex-1 min-w-[40px] h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${(opt.openInterest / maxOI) * 100}%`,
                              background: optionType === 'CALLS' ? '#00d4a060' : '#ff4d4d60',
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* IV */}
                    <td className="px-3 py-2.5">
                      <span className={`font-mono text-xs font-medium ${
                        opt.iv > 80 ? 'text-[#ff4d4d]' : opt.iv > 50 ? 'text-[#f59e0b]' : 'text-[#f59e0b]'
                      }`}>{opt.iv}%</span>
                    </td>

                    {/* Greeks (when enabled) */}
                    {showGreeks && (
                      <>
                        <td className="px-3 py-2.5 font-mono text-[#6366f1] text-xs">{opt.delta}</td>
                        <td className="px-3 py-2.5 font-mono text-[#6366f180] text-xs">{opt.gamma}</td>
                        <td className="px-3 py-2.5 font-mono text-[#ff4d4d80] text-xs">{opt.theta}</td>
                        <td className="px-3 py-2.5 font-mono text-[#f59e0b80] text-xs">{opt.vega}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-[#1e1e1e] bg-[#131313] flex flex-wrap items-center gap-4 text-[10px] text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-[#00d4a040]" />
          <span>ITM (In the Money)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#00d4a0] font-bold">ATM</span>
          <span>= At the Money (nearest to current price)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#f59e0b]">IV</span>
          <span>= Implied Volatility</span>
        </div>
        <span className="ml-auto flex items-center gap-1 text-yellow-600">
          <Info size={10} /> Simulated data for educational use only
        </span>
      </div>
    </div>
  );
}