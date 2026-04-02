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

  async getOHLCV(symbol: string, from: string, to: string, timespan = 'day'): Promise<any[]> {
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