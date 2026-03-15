'use client';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface Props {
  totalValue: number;
  cashBalance: number;
  totalPnL: number;
  totalPnLPct: number;
  dayPnL?: number;
  dayPnLPct?: number;
}

function Stat({ label, value, sub, isChange }: { label: string; value: string; sub?: string; isChange?: boolean }) {
  const isPos = isChange ? !value.startsWith('-') : null;
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-mono font-bold ${isChange ? (isPos ? 'text-[#00d4a0]' : 'text-[#ff4d4d]') : 'text-white'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${isChange ? (isPos ? 'text-[#00d4a060]' : 'text-[#ff4d4d60]') : 'text-gray-600'}`}>{sub}</p>}
    </div>
  );
}

export function PortfolioCard({ totalValue, cashBalance, totalPnL, totalPnLPct, dayPnL = 0, dayPnLPct = 0 }: Props) {
  const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pct = (n: number) => `${n >= 0 ? '+' : '-'}${Math.abs(n).toFixed(2)}%`;
  const signed = (n: number) => `${n >= 0 ? '+' : '-'}${fmt(n)}`;

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-[#00d4a020] rounded-lg flex items-center justify-center">
          <DollarSign size={16} className="text-[#00d4a0]" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Portfolio Value</p>
          <p className="text-2xl font-mono font-bold text-white">{fmt(totalValue)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total P&L" value={signed(totalPnL)} sub={pct(totalPnLPct)} isChange />
        <Stat label="Today's P&L" value={signed(dayPnL)} sub={pct(dayPnLPct)} isChange />
        <Stat label="Cash Available" value={fmt(cashBalance)} />
        <Stat label="Invested" value={fmt(totalValue - cashBalance)} />
      </div>
    </div>
  );
}
