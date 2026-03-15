import { create } from 'zustand';
import type { Portfolio } from '@paper-trading/types';

interface PortfolioState {
  portfolio: Portfolio | null;
  setPortfolio: (p: Portfolio) => void;
  clearPortfolio: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: null,
  setPortfolio: (portfolio) => set({ portfolio }),
  clearPortfolio: () => set({ portfolio: null }),
}));
