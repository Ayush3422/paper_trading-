import { create } from 'zustand';
import type { PriceTick } from '@paper-trading/types';

interface MarketState {
  prices: Record<string, PriceTick>;
  isConnected: boolean;
  updatePrice: (tick: PriceTick) => void;
  setConnected: (v: boolean) => void;
  getPrice: (symbol: string) => PriceTick | undefined;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  isConnected: false,
  updatePrice: (tick) => set((s) => ({ prices: { ...s.prices, [tick.symbol]: tick } })),
  setConnected: (v) => set({ isConnected: v }),
  getPrice: (symbol) => get().prices[symbol],
}));
