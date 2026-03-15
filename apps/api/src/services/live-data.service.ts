// ════════════════════════════════════════════════════════════════════════════
// LIVE MARKET DATA SERVICE
// Fetches real OHLCV candles from Polygon.io for live strategy execution
// ════════════════════════════════════════════════════════════════════════════

import axios from 'axios';

const POLYGON_KEY = process.env.POLYGON_API_KEY!;
const BASE        = 'https://api.polygon.io';

export interface LiveCandle {
  date:   string;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
  vwap?:  number;
}

export interface LiveQuote {
  symbol:      string;
  price:       number;
  open:        number;
  high:        number;
  low:         number;
  close:       number;
  prevClose:   number;
  change:      number;
  changePct:   number;
  volume:      number;
  timestamp:   number;
  marketOpen:  boolean;
}

// ── Fetch last N daily candles ────────────────────────────────────────────────
export async function fetchDailyCandles(symbol: string, days = 400): Promise<LiveCandle[]> {
  try {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - Math.ceil(days * 1.45)); // extra for weekends/holidays

    const url = `${BASE}/v2/aggs/ticker/${symbol}/range/1/day/${from.toISOString().split('T')[0]}/${to.toISOString().split('T')[0]}`;
    const res = await axios.get(url, {
      params: { adjusted: true, sort: 'asc', limit: 50000, apiKey: POLYGON_KEY },
      timeout: 10000,
    });

    if (!res.data?.results?.length) {
      console.warn(`[LiveData] No daily candles for ${symbol}`);
      return [];
    }

    return res.data.results.map((r: any) => ({
      date:   new Date(r.t).toISOString().split('T')[0],
      open:   r.o, high: r.h, low: r.l, close: r.c,
      volume: r.v, vwap: r.vw,
    }));
  } catch (e: any) {
    console.error(`[LiveData] fetchDailyCandles ${symbol}:`, e.message);
    return [];
  }
}

// ── Fetch last N hourly candles ───────────────────────────────────────────────
export async function fetchHourlyCandles(symbol: string, bars = 400): Promise<LiveCandle[]> {
  try {
    const to   = new Date();
    const from = new Date();
    from.setDate(from.getDate() - Math.ceil(bars / 6.5)); // ~6.5 trading hrs/day

    const url = `${BASE}/v2/aggs/ticker/${symbol}/range/1/hour/${from.toISOString().split('T')[0]}/${to.toISOString().split('T')[0]}`;
    const res = await axios.get(url, {
      params: { adjusted: true, sort: 'asc', limit: 50000, apiKey: POLYGON_KEY },
      timeout: 10000,
    });

    if (!res.data?.results?.length) return [];

    return res.data.results.map((r: any) => ({
      date:   new Date(r.t).toISOString(),
      open:   r.o, high: r.h, low: r.l, close: r.c,
      volume: r.v, vwap: r.vw,
    }));
  } catch (e: any) {
    console.error(`[LiveData] fetchHourlyCandles ${symbol}:`, e.message);
    return [];
  }
}

// ── Fetch live snapshot (current price + today OHLCV) ─────────────────────────
export async function fetchLiveQuote(symbol: string): Promise<LiveQuote | null> {
  try {
    const res = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`, {
      params: { apiKey: POLYGON_KEY },
      timeout: 8000,
    });

    const t = res.data?.ticker;
    if (!t) return null;

    const price     = t.lastTrade?.p || t.day?.c || 0;
    const prevClose = t.prevDay?.c || price;
    const change    = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
    const now       = new Date();
    const h         = now.getHours();
    const marketOpen = h >= 9.5 && h < 16; // rough EST check

    return {
      symbol,
      price,
      open:      t.day?.o || 0,
      high:      t.day?.h || 0,
      low:       t.day?.l || 0,
      close:     t.day?.c || 0,
      prevClose,
      change:    parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      volume:    t.day?.v || 0,
      timestamp: Date.now(),
      marketOpen,
    };
  } catch (e: any) {
    console.error(`[LiveData] fetchLiveQuote ${symbol}:`, e.message);
    return null;
  }
}

// ── Fetch multiple quotes at once ─────────────────────────────────────────────
export async function fetchLiveQuotes(symbols: string[]): Promise<Record<string, LiveQuote>> {
  const results: Record<string, LiveQuote> = {};
  // Polygon batch endpoint
  try {
    const tickers = symbols.join(',');
    const res = await axios.get(`${BASE}/v2/snapshot/locale/us/markets/stocks/tickers`, {
      params: { tickers, apiKey: POLYGON_KEY },
      timeout: 10000,
    });

    for (const t of res.data?.tickers || []) {
      const price     = t.lastTrade?.p || t.day?.c || 0;
      const prevClose = t.prevDay?.c || price;
      const change    = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      results[t.ticker] = {
        symbol:    t.ticker, price, prevClose,
        open:      t.day?.o || 0, high: t.day?.h || 0,
        low:       t.day?.l || 0, close: t.day?.c || 0,
        change:    parseFloat(change.toFixed(2)),
        changePct: parseFloat(changePct.toFixed(2)),
        volume:    t.day?.v || 0,
        timestamp: Date.now(),
        marketOpen: true,
      };
    }
  } catch (e: any) {
    console.error('[LiveData] fetchLiveQuotes batch:', e.message);
  }
  return results;
}

// ── Is market open right now? ─────────────────────────────────────────────────
export function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to ET
  const et  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = et.getDay();   // 0=Sun, 6=Sat
  const h   = et.getHours();
  const m   = et.getMinutes();
  const mins = h * 60 + m;
  if (day === 0 || day === 6) return false;
  return mins >= 570 && mins < 960; // 9:30 – 16:00
}

// ── Choose candle fetcher based on timeframe ──────────────────────────────────
export async function fetchCandlesForTimeframe(symbol: string, timeframe: string): Promise<LiveCandle[]> {
  const tf = timeframe?.toUpperCase() || '1D';
  if (tf === '1D') return fetchDailyCandles(symbol, 400);
  if (tf === '4H') return fetchHourlyCandles(symbol, 400);
  if (tf === '1H') return fetchHourlyCandles(symbol, 400);
  return fetchDailyCandles(symbol, 400);
}