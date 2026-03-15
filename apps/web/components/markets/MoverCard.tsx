'use client';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  sector?: string;
}

interface Props {
  title: string;
  type: 'gainers' | 'losers' | 'active';
  stocks: Stock[];
  onAddToWatchlist?: (symbol: string) => void;
}

const TYPE_CONFIG = {
  gainers: { icon: TrendingUp,  color: '#00d4a0', bg: '#00d4a015', label: 'Top Gainers'  },
  losers:  { icon: TrendingDown,color: '#ff4d4d', bg: '#ff4d4d15', label: 'Top Losers'   },
  active:  { icon: Zap,         color: '#f59e0b', bg: '#f59e0b15', label: 'Most Active'  },
};

function formatVolume(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

function formatMktCap(v: number) {
  if (v >= 1_000_000_000_000) return `$${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (v >= 1_000_000_000)     return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000)         return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${v}`;
}

export function MoverCard({ title, type, stocks, onAddToWatchlist }: Props) {
  const router = useRouter();
  const cfg    = TYPE_CONFIG[type];
  const Icon   = cfg.icon;
  const isUp   = type !== 'losers';

  return (
    <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e1e]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
          <Icon size={14} style={{ color: cfg.color }} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      {/* Rows */}
      <div className="flex-1 divide-y divide-[#1a1a1a]">
        {stocks.map((stock) => {
          const up = stock.changePct >= 0;
          return (
            <div
              key={stock.ticker}
              onClick={() => router.push(`/trading/trade/${stock.ticker}`)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors cursor-pointer group"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-white text-sm group-hover:text-[#00d4a0] transition-colors">
                    {stock.ticker}
                  </span>
                  {stock.sector && (
                    <span className="text-[10px] text-gray-600 bg-[#1e1e1e] px-1.5 py-0.5 rounded hidden sm:block">
                      {stock.sector}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{stock.name}</p>
              </div>

              <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                {type === 'active' && (
                  <span className="text-xs text-gray-500 font-mono hidden md:block">
                    {formatVolume(stock.volume)}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold text-white">
                    ${stock.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-xs font-mono font-medium ${up ? 'text-[#00d4a0]' : 'text-[#ff4d4d]'}`}>
                    {up ? '+' : ''}{stock.changePct?.toFixed(2)}%
                  </p>
                </div>

                {onAddToWatchlist && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddToWatchlist(stock.ticker); }}
                    className="w-6 h-6 rounded flex items-center justify-center text-gray-600 hover:text-[#00d4a0] hover:bg-[#00d4a015] transition-colors opacity-0 group-hover:opacity-100"
                    title="Add to watchlist"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {stocks.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs">Loading...</div>
        )}
      </div>
    </div>
  );
}