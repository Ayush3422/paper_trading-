'use client';
import { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStore } from '@/lib/store/market.store';
import { subscribeToSymbols } from '@/lib/socket/socket.client';

interface Props {
  symbol: string;
  initialPrice?: number;
  initialChange?: number;
  initialChangePct?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceTicker({ symbol, initialPrice = 0, initialChange = 0, initialChangePct = 0, size = 'md' }: Props) {
  const tick = useMarketStore(s => s.prices[symbol]);
  const prevPrice = useRef(initialPrice);

  useEffect(() => {
    subscribeToSymbols([symbol]);
  }, [symbol]);

  const price  = tick?.price          ?? initialPrice;
  const change = tick?.change         ?? initialChange;
  const pct    = tick?.changePercent  ?? initialChangePct;
  const isUp   = change >= 0;
  const changed = price !== prevPrice.current;
  useEffect(() => { prevPrice.current = price; }, [price]);

  const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`font-mono font-bold text-white ${sizes[size]} transition-colors duration-300 ${changed ? (isUp ? 'text-[#00d4a0]' : 'text-[#ff4d4d]') : ''}`}>
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isUp ? 'bg-[#00d4a020] text-[#00d4a0]' : 'bg-[#ff4d4d20] text-[#ff4d4d]'}`}>
        {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        <span>{isUp ? '+' : ''}{change.toFixed(2)} ({isUp ? '+' : ''}{pct.toFixed(2)}%)</span>
      </div>
    </div>
  );
}
