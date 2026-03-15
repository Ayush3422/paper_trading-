import axios from 'axios';
import { getCache, setCache, CACHE_TTL } from '../lib/redis';
import type { Quote, Candle, SearchResult } from '@paper-trading/types';
import { getMarketStatus as getStatus } from '../lib/market-hours';

// ── Simulated data for when API keys are missing / free tier ──────────────────
const MOCK_STOCKS = [
  { ticker:'AAPL', name:'Apple Inc.',           sector:'Technology',         exchange:'NASDAQ', price:189.30, change:2.45,  changePct:1.31,  volume:58432100, mktCap:2940000000000 },
  { ticker:'MSFT', name:'Microsoft Corp.',      sector:'Technology',         exchange:'NASDAQ', price:415.20, change:5.80,  changePct:1.42,  volume:22341000, mktCap:3080000000000 },
  { ticker:'GOOGL',name:'Alphabet Inc.',        sector:'Technology',         exchange:'NASDAQ', price:175.85, change:-1.20, changePct:-0.68, volume:19234000, mktCap:2190000000000 },
  { ticker:'AMZN', name:'Amazon.com Inc.',      sector:'Consumer Cyclical',  exchange:'NASDAQ', price:198.12, change:3.22,  changePct:1.65,  volume:31200000, mktCap:2080000000000 },
  { ticker:'META', name:'Meta Platforms',       sector:'Technology',         exchange:'NASDAQ', price:524.60, change:8.40,  changePct:1.63,  volume:14532000, mktCap:1330000000000 },
  { ticker:'TSLA', name:'Tesla Inc.',           sector:'Consumer Cyclical',  exchange:'NASDAQ', price:177.90, change:-5.30, changePct:-2.89, volume:92341000, mktCap:567000000000  },
  { ticker:'NVDA', name:'NVIDIA Corp.',         sector:'Technology',         exchange:'NASDAQ', price:875.40, change:22.10, changePct:2.59,  volume:43210000, mktCap:2160000000000 },
  { ticker:'NFLX', name:'Netflix Inc.',         sector:'Communication',      exchange:'NASDAQ', price:648.30, change:-8.70, changePct:-1.32, volume:5432100,  mktCap:278000000000  },
  { ticker:'JPM',  name:'JPMorgan Chase',       sector:'Financial',          exchange:'NYSE',   price:198.50, change:1.30,  changePct:0.66,  volume:8923000,  mktCap:573000000000  },
  { ticker:'V',    name:'Visa Inc.',            sector:'Financial',          exchange:'NYSE',   price:276.40, change:2.10,  changePct:0.77,  volume:6234000,  mktCap:565000000000  },
  { ticker:'JNJ',  name:'Johnson & Johnson',    sector:'Healthcare',         exchange:'NYSE',   price:145.60, change:-0.80, changePct:-0.55, volume:7823000,  mktCap:350000000000  },
  { ticker:'WMT',  name:'Walmart Inc.',         sector:'Consumer Defensive', exchange:'NYSE',   price:68.20,  change:0.90,  changePct:1.34,  volume:11234000, mktCap:548000000000  },
  { ticker:'DIS',  name:'Walt Disney Co.',      sector:'Communication',      exchange:'NYSE',   price:111.30, change:-2.40, changePct:-2.11, volume:9823000,  mktCap:204000000000  },
  { ticker:'MA',   name:'Mastercard Inc.',      sector:'Financial',          exchange:'NYSE',   price:468.90, change:4.20,  changePct:0.90,  volume:3234000,  mktCap:435000000000  },
  { ticker:'PG',   name:'Procter & Gamble',     sector:'Consumer Defensive', exchange:'NYSE',   price:162.40, change:0.60,  changePct:0.37,  volume:5823000,  mktCap:384000000000  },
  { ticker:'BAC',  name:'Bank of America',      sector:'Financial',          exchange:'NYSE',   price:39.80,  change:0.45,  changePct:1.14,  volume:34123000, mktCap:312000000000  },
  { ticker:'HD',   name:'Home Depot Inc.',      sector:'Consumer Cyclical',  exchange:'NYSE',   price:342.50, change:3.80,  changePct:1.12,  volume:3234000,  mktCap:341000000000  },
  { ticker:'XOM',  name:'Exxon Mobil Corp.',    sector:'Energy',             exchange:'NYSE',   price:112.30, change:-1.50, changePct:-1.32, volume:14532000, mktCap:449000000000  },
  { ticker:'CVX',  name:'Chevron Corp.',        sector:'Energy',             exchange:'NYSE',   price:153.40, change:-2.10, changePct:-1.35, volume:8234000,  mktCap:288000000000  },
  { ticker:'ABBV', name:'AbbVie Inc.',          sector:'Healthcare',         exchange:'NYSE',   price:168.90, change:1.20,  changePct:0.72,  volume:5234000,  mktCap:298000000000  },
  { ticker:'AMD',  name:'Advanced Micro Dev.',  sector:'Technology',         exchange:'NASDAQ', price:165.30, change:4.50,  changePct:2.80,  volume:38234000, mktCap:267000000000  },
  { ticker:'INTC', name:'Intel Corp.',          sector:'Technology',         exchange:'NASDAQ', price:30.50,  change:-0.80, changePct:-2.55, volume:28234000, mktCap:129000000000  },
  { ticker:'CRM',  name:'Salesforce Inc.',      sector:'Technology',         exchange:'NYSE',   price:278.40, change:5.30,  changePct:1.94,  volume:4234000,  mktCap:269000000000  },
  { ticker:'PYPL', name:'PayPal Holdings',      sector:'Financial',          exchange:'NASDAQ', price:64.20,  change:-1.30, changePct:-1.98, volume:12234000, mktCap:67000000000   },
  { ticker:'UBER', name:'Uber Technologies',    sector:'Technology',         exchange:'NYSE',   price:74.30,  change:2.10,  changePct:2.91,  volume:18234000, mktCap:153000000000  },
  { ticker:'SPOT', name:'Spotify Technology',   sector:'Communication',      exchange:'NYSE',   price:312.50, change:8.90,  changePct:2.93,  volume:2834000,  mktCap:59000000000   },
  { ticker:'SNOW', name:'Snowflake Inc.',       sector:'Technology',         exchange:'NYSE',   price:148.20, change:-4.30, changePct:-2.82, volume:8234000,  mktCap:49000000000   },
  { ticker:'PLTR', name:'Palantir Tech.',       sector:'Technology',         exchange:'NYSE',   price:22.40,  change:0.80,  changePct:3.70,  volume:42234000, mktCap:47000000000   },
  { ticker:'COIN', name:'Coinbase Global',      sector:'Financial',          exchange:'NASDAQ', price:224.30, change:12.50, changePct:5.90,  volume:8934000,  mktCap:54000000000   },
  { ticker:'RBLX', name:'Roblox Corp.',         sector:'Technology',         exchange:'NYSE',   price:38.40,  change:-1.20, changePct:-3.03, volume:9234000,  mktCap:24000000000   },
];

const MOCK_INDICES = [
  { symbol:'SPY',    name:'S&P 500',    price:524.61, change:6.32,  changePct:1.22  },
  { symbol:'QQQ',    name:'NASDAQ 100', price:447.98, change:7.84,  changePct:1.78  },
  { symbol:'DIA',    name:'DOW JONES',  price:394.23, change:-1.20, changePct:-0.30 },
  { symbol:'IWM',    name:'RUSSELL 2K', price:207.45, change:3.21,  changePct:1.57  },
  { symbol:'VIX',    name:'VIX',        price:13.24,  change:-0.45, changePct:-3.29 },
  { symbol:'GLD',    name:'GOLD',       price:231.40, change:1.20,  changePct:0.52  },
];

function addNoise(stock: any) {
  const factor = (Math.random() - 0.48) * 0.005;
  const newPrice = parseFloat((stock.price * (1 + factor)).toFixed(2));
  const change   = parseFloat((newPrice - (stock.price - stock.change)).toFixed(2));
  const changePct = parseFloat(((change / (newPrice - change)) * 100).toFixed(2));
  return { ...stock, price: newPrice, change, changePct };
}

// ─────────────────────────────────────────────────────────────────────────────
export class MarketDataService {
  private polygonKey = process.env.POLYGON_API_KEY || '';
  private finnhubKey = process.env.FINNHUB_API_KEY || '';

  // ── Single quote ────────────────────────────────────────────────────────────
  async getQuote(symbol: string): Promise<Quote> {
    const key = `quote:${symbol.toUpperCase()}`;
    const cached = await getCache<Quote>(key);
    if (cached) return cached;

    if (this.polygonKey) {
      try {
        const [tradeRes, prevRes] = await Promise.all([
          axios.get(`https://api.polygon.io/v2/last/trade/${symbol}?apiKey=${this.polygonKey}`, { timeout: 5000 }),
          axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${this.polygonKey}`, { timeout: 5000 }),
        ]);
        const price     = tradeRes.data.results?.p || prevRes.data.results?.[0]?.c || 0;
        const prevClose = prevRes.data.results?.[0]?.c || price;
        const change    = parseFloat((price - prevClose).toFixed(2));
        const quote: Quote = {
          symbol: symbol.toUpperCase(),
          price,
          open: prevRes.data.results?.[0]?.o || price,
          high: prevRes.data.results?.[0]?.h || price,
          low:  prevRes.data.results?.[0]?.l || price,
          close: prevClose,
          volume: prevRes.data.results?.[0]?.v || 0,
          change,
          changePercent: prevClose ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0,
          previousClose: prevClose,
          timestamp: Date.now(),
        };
        await setCache(key, quote, CACHE_TTL.QUOTE);
        return quote;
      } catch { /* fall through to mock */ }
    }

    const mock = addNoise(MOCK_STOCKS.find(s => s.ticker === symbol.toUpperCase()) || { ticker: symbol, name: symbol, sector: 'Unknown', exchange: 'N/A', price: 100, change: 0, changePct: 0, volume: 0, mktCap: 0 });
    const quote: Quote = {
      symbol: symbol.toUpperCase(), price: mock.price,
      open: mock.price - mock.change, high: mock.price + Math.abs(mock.change) * 0.5,
      low: mock.price - Math.abs(mock.change) * 0.5, close: mock.price,
      volume: mock.volume, change: mock.change, changePercent: mock.changePct,
      previousClose: mock.price - mock.change, timestamp: Date.now(),
    };
    await setCache(key, quote, CACHE_TTL.QUOTE);
    return quote;
  }

  // ── Multiple quotes ─────────────────────────────────────────────────────────
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    return Promise.all(symbols.map(s => this.getQuote(s)));
  }

  // ── Market indices ───────────────────────────────────────────────────────────
  async getIndices() {
    const key = 'indices:all';
    const cached = await getCache(key);
    if (cached) return cached;

    const indices = MOCK_INDICES.map(addNoise);
    if (this.polygonKey) {
      try {
        const results = await Promise.all(
          ['SPY','QQQ','DIA','IWM'].map(sym =>
            this.getQuote(sym).then(q => ({ symbol: q.symbol, name: MOCK_INDICES.find(i => i.symbol === sym)?.name || sym, price: q.price, change: q.change, changePct: q.changePercent }))
          )
        );
        await setCache(key, results, 30);
        return results;
      } catch { /* fall through */ }
    }

    await setCache(key, indices, 30);
    return indices;
  }

  // ── Top movers ───────────────────────────────────────────────────────────────
  async getMovers() {
    const key = 'movers:all';
    const cached = await getCache(key);
    if (cached) return cached;

    const stocks = MOCK_STOCKS.map(addNoise);
    const sorted  = [...stocks].sort((a, b) => b.changePct - a.changePct);
    const result  = {
      gainers: sorted.filter(s => s.changePct > 0).slice(0, 6),
      losers:  sorted.filter(s => s.changePct < 0).slice(0, 6).reverse(),
      active:  [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 6),
    };

    if (this.polygonKey) {
      try {
        const [gainRes, loseRes] = await Promise.all([
          axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apiKey=${this.polygonKey}`, { timeout: 6000 }),
          axios.get(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/losers?apiKey=${this.polygonKey}`,  { timeout: 6000 }),
        ]);
        const mapSnap = (item: any) => ({
          ticker: item.ticker,
          name: item.ticker,
          price: item.day?.c || item.lastTrade?.p || 0,
          change: item.todaysChange || 0,
          changePct: item.todaysChangePerc || 0,
          volume: item.day?.v || 0,
          mktCap: 0,
          sector: 'N/A',
          exchange: 'N/A',
        });
        result.gainers = (gainRes.data.tickers || []).slice(0, 6).map(mapSnap);
        result.losers  = (loseRes.data.tickers || []).slice(0, 6).map(mapSnap);
        await setCache(key, result, 60);
        return result;
      } catch { /* fall through */ }
    }

    await setCache(key, result, 30);
    return result;
  }

  // ── Screener ─────────────────────────────────────────────────────────────────
  async getScreener(filters: {
    sector?: string;
    minPrice?: number;
    maxPrice?: number;
    minChangePct?: number;
    maxChangePct?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    let stocks = MOCK_STOCKS.map(addNoise);

    if (filters.sector && filters.sector !== 'All')
      stocks = stocks.filter(s => s.sector === filters.sector);
    if (filters.minPrice !== undefined)
      stocks = stocks.filter(s => s.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined)
      stocks = stocks.filter(s => s.price <= filters.maxPrice!);
    if (filters.minChangePct !== undefined)
      stocks = stocks.filter(s => s.changePct >= filters.minChangePct!);
    if (filters.maxChangePct !== undefined)
      stocks = stocks.filter(s => s.changePct <= filters.maxChangePct!);
    if (filters.search)
      stocks = stocks.filter(s =>
        s.ticker.includes(filters.search!.toUpperCase()) ||
        s.name.toLowerCase().includes(filters.search!.toLowerCase())
      );

    const sortKey = (filters.sortBy || 'mktCap') as keyof typeof stocks[0];
    stocks.sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      return filters.sortOrder === 'asc' ? av - bv : bv - av;
    });

    return stocks;
  }

  // ── News ─────────────────────────────────────────────────────────────────────
  async getNews(symbol?: string) {
    const key = `news:${symbol || 'market'}`;
    const cached = await getCache(key);
    if (cached) return cached;

    if (this.finnhubKey) {
      try {
        const url = symbol
          ? `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${this.finnhubKey}`
          : `https://finnhub.io/api/v1/news?category=general&token=${this.finnhubKey}`;
        const { data } = await axios.get(url, { timeout: 5000 });
        const news = (data || []).slice(0, 10).map((n: any) => ({
          id: n.id, headline: n.headline, summary: n.summary,
          source: n.source, url: n.url, image: n.image,
          datetime: n.datetime * 1000,
          sentiment: n.sentiment || 'neutral',
        }));
        await setCache(key, news, 300);
        return news;
      } catch { /* fall through */ }
    }

    const mock = [
      { id:1, headline:`${symbol || 'Markets'} shows strong momentum amid tech rally`, source:'Reuters', url:'#', datetime: Date.now() - 3600000,  sentiment:'positive' },
      { id:2, headline:'Fed signals potential rate cuts in coming months',              source:'Bloomberg',url:'#', datetime: Date.now() - 7200000,  sentiment:'positive' },
      { id:3, headline:'Inflation data comes in line with expectations',               source:'CNBC',     url:'#', datetime: Date.now() - 10800000, sentiment:'neutral'  },
      { id:4, headline:'Tech sector leads gains as AI investments surge',              source:'WSJ',      url:'#', datetime: Date.now() - 18000000, sentiment:'positive' },
      { id:5, headline:'Oil prices slide on demand concerns from Asia',                source:'Reuters',  url:'#', datetime: Date.now() - 25200000, sentiment:'negative' },
    ];
    await setCache(key, mock, 300);
    return mock;
  }

  // ── OHLCV ────────────────────────────────────────────────────────────────────
  async getOHLCV(symbol: string, interval: string, from: string, to: string): Promise<Candle[]> {
    const key = `ohlcv:${symbol}:${interval}:${from}:${to}`;
    const cached = await getCache<Candle[]>(key);
    if (cached) return cached;

    if (this.polygonKey) {
      try {
        const multiplier = interval.replace(/[^0-9]/g, '') || '1';
        const timespan   = interval.includes('m') ? 'minute' : interval.includes('H') || interval.includes('h') ? 'hour' : 'day';
        const { data }   = await axios.get(
          `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${this.polygonKey}`,
          { timeout: 10000 }
        );
        const candles: Candle[] = (data.results || []).map((r: any) => ({
          time: Math.floor(r.t / 1000), open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
        }));
        await setCache(key, candles, CACHE_TTL.OHLCV);
        return candles;
      } catch { /* fall through */ }
    }
    return this.getSimulatedCandles(symbol, 90);
  }

  // ── Search ───────────────────────────────────────────────────────────────────
  async searchSymbols(query: string): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    const local = MOCK_STOCKS
      .filter(s => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map(s => ({ symbol: s.ticker, name: s.name, exchange: s.exchange, type: 'CS' }));

    if (local.length > 0) return local;

    if (this.polygonKey) {
      try {
        const { data } = await axios.get(
          `https://api.polygon.io/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=10&apiKey=${this.polygonKey}`,
          { timeout: 5000 }
        );
        return (data.results || []).map((r: any) => ({
          symbol: r.ticker, name: r.name, exchange: r.primary_exchange || 'N/A', type: r.type || 'CS',
        }));
      } catch { /* fall through */ }
    }
    return local;
  }

  // ── Market status ────────────────────────────────────────────────────────────
  getMarketStatus() { return getStatus(); }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private getSimulatedCandles(symbol: string, days: number): Candle[] {
    const seed  = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let price   = 50 + (seed % 400);
    const now   = Date.now();
    const out: Candle[] = [];
    for (let i = days; i >= 0; i--) {
      const delta = (Math.random() - 0.48) * price * 0.03;
      const open  = price;
      price       = Math.max(1, price + delta);
      out.push({
        time:   Math.floor((now - i * 86400000) / 1000),
        open:   parseFloat(open.toFixed(2)),
        high:   parseFloat((Math.max(open, price) + Math.random() * 2).toFixed(2)),
        low:    parseFloat((Math.max(1, Math.min(open, price) - Math.random() * 2)).toFixed(2)),
        close:  parseFloat(price.toFixed(2)),
        volume: Math.floor(Math.random() * 5000000 + 500000),
      });
    }
    return out;
  }

  getSectors() {
    return ['All','Technology','Financial','Healthcare','Consumer Cyclical','Consumer Defensive','Communication','Energy','Industrial','Utilities','Real Estate'];
  }
}

export const marketDataService = new MarketDataService();