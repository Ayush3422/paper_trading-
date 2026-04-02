// ── Inline types (replaces @paper-trading/types import) ──────────────────────
export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface MarketIndex {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

import axios from 'axios';

const POLYGON_KEY = process.env.POLYGON_API_KEY || '';
const BASE = 'https://api.polygon.io';

export class MarketDataService {
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const res = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`, {
        params: { apiKey: POLYGON_KEY },
        timeout: 8000,
      });
      const t = res.data?.ticker;
      if (!t) return null;
      const price = t.lastTrade?.p || t.day?.c || 0;
      const prevClose = t.prevDay?.c || price;
      return {
        symbol,
        price,
        change: parseFloat((price - prevClose).toFixed(2)),
        changePercent: prevClose > 0 ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
        volume: t.day?.v || 0,
        high: t.day?.h || price,
        low: t.day?.l || price,
        open: t.day?.o || price,
        previousClose: prevClose,
        timestamp: Date.now(),
      };
    } catch (e: any) {
      console.error(`[MarketData] getQuote ${symbol}:`, e.message);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    const results: Record<string, StockQuote> = {};
    try {
      const res = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/tickers`, {
        params: { tickers: symbols.join(','), apiKey: POLYGON_KEY },
        timeout: 10000,
      });
      for (const t of res.data?.tickers || []) {
        const price = t.lastTrade?.p || t.day?.c || 0;
        const prevClose = t.prevDay?.c || price;
        results[t.ticker] = {
          symbol: t.ticker,
          price,
          change: parseFloat((price - prevClose).toFixed(2)),
          changePercent: prevClose > 0 ? parseFloat(((price - prevClose) / prevClose * 100).toFixed(2)) : 0,
          volume: t.day?.v || 0,
          high: t.day?.h || price,
          low: t.day?.l || price,
          open: t.day?.o || price,
          previousClose: prevClose,
          timestamp: Date.now(),
        };
      }
    } catch (e: any) {
      console.error('[MarketData] getMultipleQuotes:', e.message);
    }
    return results;
  }

  async getOHLCV(symbol: string, interval: string, from: string, to: string): Promise<any[]> {
    const timespanMap: Record<string, string> = { '1D': 'day', '1W': 'week', '1M': 'month', '1H': 'hour', '5m': 'minute' };
    const timespan = timespanMap[interval] || 'day';
    try {
      const res = await axios.get(`${BASE}/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}`, {
        params: { adjusted: true, sort: 'asc', limit: 50000, apiKey: POLYGON_KEY },
        timeout: 10000,
      });
      return res.data?.results || [];
    } catch (e: any) {
      console.error('[MarketData] getOHLCV:', e.message);
      return [];
    }
  }

  async searchTickers(query: string): Promise<any[]> {
    try {
      const res = await axios.get(`${BASE}/v3/reference/tickers`, {
        params: { search: query, active: true, limit: 10, apiKey: POLYGON_KEY },
        timeout: 8000,
      });
      return res.data?.results || [];
    } catch (e: any) {
      console.error('[MarketData] search:', e.message);
      return [];
    }
  }

  async searchSymbols(query: string): Promise<any[]> {
    return this.searchTickers(query);
  }

  async getMarketIndices(): Promise<MarketIndex[]> {
    const indices = [
      { symbol: 'SPY',  name: 'S&P 500'    },
      { symbol: 'QQQ',  name: 'NASDAQ 100' },
      { symbol: 'DIA',  name: 'Dow Jones'  },
      { symbol: 'IWM',  name: 'Russell 2000'},
    ];
    const results: MarketIndex[] = [];
    for (const idx of indices) {
      const q = await this.getQuote(idx.symbol);
      if (q) results.push({ ...idx, price: q.price, change: q.change, changePercent: q.changePercent });
    }
    return results;
  }

  async getIndices(): Promise<MarketIndex[]> {
    return this.getMarketIndices();
  }

  getMarketStatus(): { open: boolean; session: string; nextOpen?: string; nextClose?: string } {
    const now = new Date();
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();
    const totalMins = hour * 60 + minute;
    const isWeekday = day >= 1 && day <= 5;
    const marketOpen = 13 * 60 + 30;  // 9:30 AM ET = 13:30 UTC
    const marketClose = 20 * 60;       // 4:00 PM ET = 20:00 UTC
    const preMarketOpen = 8 * 60;      // 4:00 AM ET
    const afterHoursClose = 24 * 60;   // 8:00 PM ET

    if (!isWeekday) return { open: false, session: 'closed' };
    if (totalMins >= marketOpen && totalMins < marketClose) return { open: true, session: 'regular' };
    if (totalMins >= preMarketOpen && totalMins < marketOpen) return { open: false, session: 'pre-market' };
    if (totalMins >= marketClose && totalMins < afterHoursClose) return { open: false, session: 'after-hours' };
    return { open: false, session: 'closed' };
  }

  getSectors(): { name: string; changePct: number }[] {
    return [
      { name: 'Technology', changePct: 0 },
      { name: 'Healthcare', changePct: 0 },
      { name: 'Financials', changePct: 0 },
      { name: 'Energy', changePct: 0 },
      { name: 'Consumer Discretionary', changePct: 0 },
      { name: 'Industrials', changePct: 0 },
      { name: 'Real Estate', changePct: 0 },
      { name: 'Utilities', changePct: 0 },
      { name: 'Materials', changePct: 0 },
      { name: 'Communication Services', changePct: 0 },
      { name: 'Consumer Staples', changePct: 0 },
    ];
  }

  async getScreener(params: {
    sector?: string; minPrice?: number; maxPrice?: number;
    minChangePct?: number; maxChangePct?: number;
    sortBy?: string; sortOrder?: string; search?: string;
  }): Promise<any[]> {
    try {
      const queryParams: any = { active: true, market: 'stocks', limit: 50, apiKey: POLYGON_KEY };
      if (params.search) queryParams.search = params.search;
      const res = await axios.get(`${BASE}/v3/reference/tickers`, { params: queryParams, timeout: 10000 });
      return res.data?.results || [];
    } catch (e: any) {
      console.error('[MarketData] getScreener:', e.message);
      return [];
    }
  }

  async getNews(symbol?: string): Promise<any[]> {
    try {
      const params: any = { limit: 10, apiKey: POLYGON_KEY };
      if (symbol) params.ticker = symbol;
      const res = await axios.get(`${BASE}/v2/reference/news`, { params, timeout: 8000 });
      return res.data?.results || [];
    } catch (e: any) {
      console.error('[MarketData] getNews:', e.message);
      return [];
    }
  }

  async getMovers(): Promise<{ gainers: any[]; losers: any[] }> {
    try {
      const res = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/gainers`, {
        params: { apiKey: POLYGON_KEY }, timeout: 8000,
      });
      const gainers = (res.data?.tickers || []).slice(0, 5);
      const res2 = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/losers`, {
        params: { apiKey: POLYGON_KEY }, timeout: 8000,
      });
      const losers = (res2.data?.tickers || []).slice(0, 5);
      return { gainers, losers };
    } catch (e: any) {
      console.error('[MarketData] getMovers:', e.message);
      return { gainers: [], losers: [] };
    }
  }
}

export const marketDataService = new MarketDataService();