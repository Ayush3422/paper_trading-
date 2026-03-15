'use client';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';

interface Props {
  symbol: string;
  position?: {
    quantity: number;
    averageCost: number;
    totalCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
    unrealizedPnLPct: number;
  } | null;
}

export function PositionCard({ symbol, position }: Props) {
  if (!position) {
    return (
      <div className="bg-[#161616] border border-[#262626] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} className="text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-400">Your Position</h3>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-600 text-xs">No position in {symbol}</p>
          <p className="text-gray-700 text-[11px] mt-1">Place a BUY order to open one</p>
        </div>
      </div>
    );
  }

  const isUp   = position.unrealizedPnL >= 0;
  const fmt    = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const change = position.currentPrice - position.averageCost;

  return (
    <div className={`bg-[#161616] border rounded-xl p-4 ${isUp ? 'border-[#00d4a030]' : 'border-[#ff4d4d30]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isUp ? 'bg-[#00d4a015]' : 'bg-[#ff4d4d15]'}`}>
            {isUp ? <TrendingUp size={13} className="text-[#00d4a0]" /> : <TrendingDown size={13} className="text-[#ff4d4d]" />}
          </div>
          <h3 className="text-sm font-semibold text-white">Your Position</h3>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${isUp ? 'bg-[#00d4a015] text-[#00d4a0]' : 'bg-[#ff4d4d15] text-[#ff4d4d]'}`}>
          {isUp ? '+' : ''}{position.unrealizedPnLPct?.toFixed(2)}%
        </span>
      </div>

      <div className="space-y-2">
        {/* P&L highlight */}
        <div className={`rounded-lg p-3 text-center ${isUp ? 'bg-[#00d4a010]' : 'bg-[#ff4d4d10]'}`}>
          <p className="text-[10px] text-gray-500 mb-0.5">Unrealized P&L</p>
          <p className={`text-xl font-mono font-bold ${isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
            {isUp ? '+' : '-'}${Math.abs(position.unrealizedPnL).toFixed(2)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Shares',     value: position.quantity.toString() },
            { label: 'Avg Cost',   value: `$${fmt(position.averageCost)}` },
            { label: 'Mkt Value',  value: `$${fmt(position.marketValue)}` },
            { label: 'Per Share',  value: `${isUp ? '+' : ''}$${fmt(change)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#1a1a1a] rounded-lg p-2.5">
              <p className="text-[10px] text-gray-600">{label}</p>
              <p className="text-xs font-mono font-semibold text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}