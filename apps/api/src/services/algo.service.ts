import { PrismaClient } from '@prisma/client';
import {
  SMA, EMA, WMA, RSI, STOCH, MACD, CCI, WILLIAMS_R, ROC, MFI,
  ATR, BOLLINGER, KELTNER, ADX, SUPERTREND, ICHIMOKU, OBV, CHAIKIN, DONCHIAN,
  ZSCORE, LINEAR_REG, VWAP, atrPositionSize, kellyFraction, Series,
} from './indicators';
import { STRATEGY_TEMPLATES } from './strategy.templates';

const prisma = new PrismaClient();

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StrategyCondition {
  id: string;
  indicator: string;
  param?: number;
  operator: 'CROSSES_ABOVE' | 'CROSSES_BELOW' | 'GREATER_THAN' | 'LESS_THAN';
  compareTo: string;
  compareParam?: number;
  value?: number;
}
export interface StrategyRule { conditions: StrategyCondition[]; logic: 'AND' | 'OR'; }
export interface StrategyConfig {
  symbols: string[];
  buyRule: StrategyRule;
  sellRule: StrategyRule;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: number;
  maxOpenTrades: number;
  timeframe: string;
  positionSizing?: 'FIXED' | 'ATR' | 'KELLY';
}

export interface Candle { date: string; open: number; high: number; low: number; close: number; volume: number; }

export interface BacktestTrade {
  symbol: string; side: 'BUY' | 'SELL';
  entryDate: string; exitDate: string;
  entryPrice: number; exitPrice: number; quantity: number;
  pnl: number; pnlPct: number; mae: number; mfe: number;
  exitReason: 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'TRAILING_STOP' | 'END_OF_DATA';
  holdingDays: number;
}

export interface BacktestResult {
  strategyId: string; symbol: string;
  startDate: string; endDate: string;
  startingCapital: number; endingCapital: number;
  totalReturn: number; totalReturnPct: number;
  annualizedReturn: number; benchmarkReturn: number;
  maxDrawdown: number; maxDrawdownPct: number;
  maxDrawdownDuration: number;
  sharpeRatio: number; sortinoRatio: number; calmarRatio: number;
  winRate: number; profitFactor: number;
  totalTrades: number; winningTrades: number; losingTrades: number;
  avgWin: number; avgLoss: number; avgHoldingDays: number;
  bestTrade: number; worstTrade: number;
  consecutiveWins: number; consecutiveLosses: number;
  recoveryFactor: number; expectancy: number;
  equityCurve: { date: string; value: number; drawdown: number; benchmark: number }[];
  monthlyReturns: { month: string; return: number }[];
  trades: BacktestTrade[];
}

// ── Candle Generator (realistic seeded random walk) ──────────────────────────
export function generateCandles(symbol: string, days: number): Candle[] {
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 0);
  const rng  = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })();

  // Base price from symbol
  const basePrice: Record<string, number> = {
    AAPL:42, MSFT:38, GOOGL:140, AMZN:185, NVDA:120, TSLA:25, META:45,
    AMD:35, SPY:400, QQQ:350, IWM:180, GLD:180, XLK:165, XLF:38, XLV:130,
    XLE:80, GDX:30, COIN:25, UBER:35, NFLX:50,
  };
  let price = (basePrice[symbol] || 50 + (seed % 300)) * (1 + rng() * 0.5);
  const longTrend  = (rng() - 0.46) * 0.00035;
  const now        = Date.now();
  const candles: Candle[] = [];

  for (let i = days; i >= 0; i--) {
    const date     = new Date(now - i * 86400000);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    const vol   = (rng() - 0.5) * 0.022 + longTrend;
    const gap   = (rng() - 0.5) * 0.008; // gap up/down
    const open  = price * (1 + gap);
    price       = Math.max(1, price * (1 + vol));

    const intraHigh = Math.max(open, price) * (1 + rng() * 0.012);
    const intraLow  = Math.min(open, price) * (1 - rng() * 0.012);
    const volume    = Math.floor((800000 + rng() * 8000000) * (1 + Math.abs(vol) * 20));

    candles.push({
      date:   date.toISOString().split('T')[0],
      open:   parseFloat(open.toFixed(2)),
      high:   parseFloat(intraHigh.toFixed(2)),
      low:    parseFloat(Math.max(0.01, intraLow).toFixed(2)),
      close:  parseFloat(price.toFixed(2)),
      volume,
    });
  }
  return candles;
}

// ── Full indicator suite for one candle series ────────────────────────────────
function buildAllIndicators(candles: Candle[]) {
  const c = candles.map(x => x.close);
  const h = candles.map(x => x.high);
  const l = candles.map(x => x.low);
  const o = candles.map(x => x.open);
  const v = candles.map(x => x.volume);

  const bb20    = BOLLINGER(c, 20, 2);
  const kelt    = KELTNER(h, l, c, 20, 10, 2);
  const macd    = MACD(c, 12, 26, 9);
  const stoch   = STOCH(h, l, c, 14, 3);
  const adx     = ADX(h, l, c, 14);
  const ich     = ICHIMOKU(h, l, c);
  const st      = SUPERTREND(h, l, c, 10, 3);
  const don20   = DONCHIAN(h, l, 20);
  const don28   = DONCHIAN(h, l, 28);
  const don10   = DONCHIAN(h, l, 10);

  const volSMA20 = SMA(v, 20);
  const obv      = OBV(c, v);
  const obvSMA20 = SMA(obv.filter(x => x != null) as number[], 20);
  const obvSMA20Full: Series = Array(c.length).fill(null);
  { let off = obv.findIndex(x => x != null); for (let i = 0; i < obvSMA20.length; i++) obvSMA20Full[off + i] = obvSMA20[i]; }

  return {
    price: c, open: o, high: h, low: l, volume: v,
    ma20:  SMA(c, 20),  ma50:  SMA(c, 50),  ma200: SMA(c, 200),
    wma20: WMA(c, 20),
    ema9:  EMA(c, 9),   ema13: EMA(c, 13), ema21: EMA(c, 21), ema50: EMA(c, 50),
    rsi14: RSI(c, 14),  rsi7:  RSI(c, 7),
    stochK: stoch.k,    stochD: stoch.d,
    macdLine: macd.line, macdSignal: macd.signal, macdHist: macd.hist,
    cci20:  CCI(h, l, c, 20),
    wr14:   WILLIAMS_R(h, l, c, 14),
    roc12:  ROC(c, 12), roc21: ROC(c, 21), roc252: ROC(c, 252),
    mfi14:  MFI(h, l, c, v, 14),
    atr14:  ATR(h, l, c, 14),
    bbUpper: bb20.upper, bbMid: bb20.mid, bbLower: bb20.lower,
    bbWidth: bb20.bandwidth, bbPctB: bb20.pctB,
    keltUpper: kelt.upper, keltMid: kelt.mid, keltLower: kelt.lower,
    adx14: adx.adx, pdi14: adx.pdi, mdi14: adx.mdi,
    supertrend: st.supertrend, stDir: st.direction,
    tenkan: ich.tenkan, kijun: ich.kijun, senkouA: ich.senkouA, senkouB: ich.senkouB,
    donUpper20: don20.upper, donLower20: don20.lower, donMid20: don20.mid,
    donUpper28: don28.upper, donLower28: don28.lower,
    donUpper10: don10.upper, donLower10: don10.lower,
    volSMA20,
    obv, obvSMA20: obvSMA20Full,
    cmf20:   CHAIKIN(h, l, c, v, 3, 10),
    zscore20: ZSCORE(c, 20),
    linReg20: LINEAR_REG(c, 20),
    linReg5:  LINEAR_REG(c, 5),
    vwap:    VWAP(h, l, c, v),
    prevMacdHist: [null, ...macd.hist.slice(0, -1)] as Series,
  };
}

type Inds = ReturnType<typeof buildAllIndicators>;

// ── Single indicator value lookup ─────────────────────────────────────────────
function getIndicatorVal(inds: Inds, name: string, param: number | undefined, idx: number): number | null {
  switch (name.toUpperCase()) {
    case 'PRICE':        return inds.price[idx];
    case 'OPEN':         return inds.open[idx];
    case 'HIGH':         return inds.high[idx];
    case 'LOW':          return inds.low[idx];
    case 'VOLUME':       return inds.volume[idx];
    case 'MA': return param === 200 ? inds.ma200[idx] : param === 50 ? inds.ma50[idx] : inds.ma20[idx];
    case 'EMA': return param === 50 ? inds.ema50[idx] : param === 21 ? inds.ema21[idx] : param === 13 ? inds.ema13[idx] : inds.ema9[idx];
    case 'RSI':          return inds.rsi14[idx];
    case 'STOCH_K':      return inds.stochK[idx];
    case 'STOCH_D':      return inds.stochD[idx];
    case 'MACD':         return inds.macdLine[idx];
    case 'MACD_HIST':    return inds.macdHist[idx];
    case 'SIGNAL':       return inds.macdSignal[idx];
    case 'CCI':          return inds.cci20[idx];
    case 'WILLIAMS_R':   return inds.wr14[idx];
    case 'ROC': return param === 252 ? inds.roc252[idx] : param === 21 ? inds.roc21[idx] : inds.roc12[idx];
    case 'MFI':          return inds.mfi14[idx];
    case 'ATR':          return inds.atr14[idx];
    case 'BB_UPPER':     return inds.bbUpper[idx];
    case 'BB_MID':       return inds.bbMid[idx];
    case 'BB_LOWER':     return inds.bbLower[idx];
    case 'BB_WIDTH':     return inds.bbWidth[idx];
    case 'KELTNER_UPPER': return inds.keltUpper[idx];
    case 'KELTNER_LOWER': return inds.keltLower[idx];
    case 'ADX':          return inds.adx14[idx];
    case 'PDI':          return inds.pdi14[idx];
    case 'MDI':          return inds.mdi14[idx];
    case 'SUPERTREND':   return inds.supertrend[idx];
    case 'TENKAN':       return inds.tenkan[idx];
    case 'KIJUN':        return inds.kijun[idx];
    case 'SENKOU_A':     return inds.senkouA[idx];
    case 'SENKOU_B':     return inds.senkouB[idx];
    case 'DONCHIAN_UPPER': return param === 28 ? inds.donUpper28[idx] : inds.donUpper20[idx];
    case 'DONCHIAN_LOWER': return param === 14 ? inds.donLower10[idx] : param === 10 ? inds.donLower10[idx] : inds.donLower20[idx];
    case 'VOL_MA':       return inds.volSMA20[idx];
    case 'OBV':          return inds.obv[idx] as number;
    case 'OBV_MA':       return inds.obvSMA20[idx];
    case 'CMF':          return inds.cmf20[idx];
    case 'ZSCORE':       return inds.zscore20[idx];
    case 'LINEAR_REG':   return param === 5 ? inds.linReg5[idx] : inds.linReg20[idx];
    case 'VWAP':         return inds.vwap[idx];
    case 'PREV_MACD_HIST': return inds.prevMacdHist[idx];
    case 'OPEN_HIGH':    return inds.high[Math.max(0, idx - Math.floor((param || 60) / 60))];
    case 'OPEN_LOW':     return inds.low[Math.max(0, idx - Math.floor((param || 60) / 60))];
    case 'VIX':          return 15 + (inds.rsi14[idx] ?? 50) * 0.3; // simulated
    case 'ATR_EXPANSION': {
      const atrVal = inds.atr14[idx]; const prev = inds.price[idx - 1];
      if (!atrVal || !prev) return null;
      return Math.abs(inds.price[idx] - prev) / atrVal;
    }
    case 'ATR_CONTRACTION': {
      const atrVal = inds.atr14[idx]; const prev = inds.price[idx - 1];
      if (!atrVal || !prev) return null;
      return Math.abs(inds.price[idx] - prev) / atrVal;
    }
    default: return null;
  }
}

// ── Evaluate one condition at index i ─────────────────────────────────────────
function evalCond(cond: StrategyCondition, inds: Inds, i: number): boolean {
  if (i < 1) return false;
  const curr = getIndicatorVal(inds, cond.indicator, cond.param, i);
  const prev = getIndicatorVal(inds, cond.indicator, cond.param, i - 1);
  if (curr == null) return false;

  let cmpCurr: number | null, cmpPrev: number | null;
  if (cond.compareTo === 'VALUE') {
    cmpCurr = cmpPrev = cond.value ?? 0;
  } else {
    cmpCurr = getIndicatorVal(inds, cond.compareTo, cond.compareParam, i);
    cmpPrev = getIndicatorVal(inds, cond.compareTo, cond.compareParam, i - 1);
  }
  if (cmpCurr == null) return false;

  switch (cond.operator) {
    case 'GREATER_THAN':  return curr > cmpCurr;
    case 'LESS_THAN':     return curr < cmpCurr;
    case 'CROSSES_ABOVE': return prev != null && cmpPrev != null && prev <= cmpPrev && curr > cmpCurr;
    case 'CROSSES_BELOW': return prev != null && cmpPrev != null && prev >= cmpPrev && curr < cmpCurr;
    default: return false;
  }
}

function evalRule(rule: StrategyRule, inds: Inds, i: number): boolean {
  if (!rule.conditions?.length) return false;
  const results = rule.conditions.map(c => evalCond(c, inds, i));
  return rule.logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

// ── Core Backtest Engine ──────────────────────────────────────────────────────
export function runBacktest(config: StrategyConfig, symbol: string, candles: Candle[], startCapital = 100000): BacktestResult {
  const inds    = buildAllIndicators(candles);
  let cash      = startCapital;
  let shares    = 0;
  let entry     = { price: 0, date: '', trailHigh: 0, index: 0 };
  let peak      = startCapital;
  let maxDD     = 0;
  let maxDDDur  = 0;
  let ddStart   = 0;

  const trades:      BacktestTrade[] = [];
  const equityCurve: BacktestResult['equityCurve'] = [];
  const monthlyMap:  Record<string, number[]> = {};

  // Benchmark: buy and hold
  const buyHoldQty   = Math.floor(startCapital / candles[0].close);
  const buyHoldCash  = startCapital - buyHoldQty * candles[0].close;

  for (let i = 1; i < candles.length; i++) {
    const c     = candles[i];
    const price = c.close;
    const equity = cash + shares * price;

    // Drawdown tracking
    if (equity > peak) { peak = equity; ddStart = i; }
    const dd = ((peak - equity) / peak) * 100;
    if (dd > maxDD)    { maxDD = dd; }
    if (dd > 0)        maxDDDur = Math.max(maxDDDur, i - ddStart);

    const benchmark = buyHoldQty * price + buyHoldCash;
    equityCurve.push({ date: c.date, value: parseFloat(equity.toFixed(2)), drawdown: parseFloat(dd.toFixed(2)), benchmark: parseFloat(benchmark.toFixed(2)) });

    // Monthly return tracking
    const month = c.date.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = [];
    monthlyMap[month].push(equity);

    // ── Position exit checks ──────────────────────────────────────────────
    if (shares > 0) {
      const pnlPct = ((price - entry.price) / entry.price) * 100;
      if (price > entry.trailHigh) entry.trailHigh = price;
      let exitReason: BacktestTrade['exitReason'] | null = null;

      if (config.stopLoss    && pnlPct <= -config.stopLoss)  exitReason = 'STOP_LOSS';
      else if (config.takeProfit && pnlPct >= config.takeProfit) exitReason = 'TAKE_PROFIT';
      else if (config.trailingStop) {
        const trailDrop = ((entry.trailHigh - price) / entry.trailHigh) * 100;
        if (trailDrop >= config.trailingStop) exitReason = 'TRAILING_STOP';
      }
      if (!exitReason && evalRule(config.sellRule, inds, i)) exitReason = 'SIGNAL';

      if (exitReason) {
        // Estimate MAE / MFE from intraday range
        const sliceH = candles.slice(entry.index, i + 1).map(x => x.high);
        const sliceL = candles.slice(entry.index, i + 1).map(x => x.low);
        const mfe = ((Math.max(...sliceH) - entry.price) / entry.price) * 100;
        const mae = ((Math.min(...sliceL) - entry.price) / entry.price) * 100;
        const pnl = (price - entry.price) * shares;
        const hDays = i - entry.index;

        trades.push({
          symbol, side: 'SELL', entryDate: entry.date, exitDate: c.date,
          entryPrice: entry.price, exitPrice: price, quantity: shares,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          mae: parseFloat(mae.toFixed(2)),
          mfe: parseFloat(mfe.toFixed(2)),
          exitReason, holdingDays: hDays,
        });
        cash  += shares * price;
        shares = 0;
      }
    }

    // ── Entry ─────────────────────────────────────────────────────────────
    if (shares === 0 && evalRule(config.buyRule, inds, i)) {
      let qty: number;
      if (config.positionSizing === 'ATR') {
        const atrVal = inds.atr14[i];
        qty = atrVal ? atrPositionSize(cash, config.stopLoss || 2, price, atrVal) : Math.floor(cash * (config.positionSize / 100) / price);
      } else {
        qty = Math.floor(cash * (config.positionSize / 100) / price);
      }
      if (qty > 0 && cash >= qty * price) {
        shares = qty;
        entry  = { price, date: c.date, trailHigh: price, index: i };
        cash  -= qty * price;
      }
    }
  }

  // Force close at end
  if (shares > 0) {
    const price  = candles[candles.length - 1].close;
    const pnlPct = ((price - entry.price) / entry.price) * 100;
    const pnl    = (price - entry.price) * shares;
    trades.push({
      symbol, side: 'SELL', entryDate: entry.date,
      exitDate: candles[candles.length - 1].date,
      entryPrice: entry.price, exitPrice: price, quantity: shares,
      pnl: parseFloat(pnl.toFixed(2)), pnlPct: parseFloat(pnlPct.toFixed(2)),
      mae: 0, mfe: parseFloat(pnlPct.toFixed(2)),
      exitReason: 'END_OF_DATA', holdingDays: candles.length - 1 - entry.index,
    });
    cash += shares * price;
  }

  // ── Statistics ────────────────────────────────────────────────────────────
  const endCap   = cash;
  const totRet   = endCap - startCapital;
  const totRetPct = (totRet / startCapital) * 100;
  const years    = candles.length / 252;
  const annRet   = years > 0 ? (Math.pow(endCap / startCapital, 1 / years) - 1) * 100 : 0;
  const bmFinal  = buyHoldQty * candles[candles.length - 1].close + buyHoldCash;
  const bmRet    = ((bmFinal - startCapital) / startCapital) * 100;

  const wins  = trades.filter(t => t.pnl > 0);
  const loses = trades.filter(t => t.pnl <= 0);
  const grossW = wins.reduce((s, t) => s + t.pnl, 0);
  const grossL = Math.abs(loses.reduce((s, t) => s + t.pnl, 0));

  // Sharpe / Sortino
  const dailyRets = equityCurve.map((e, i) => i === 0 ? 0 : (e.value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
  const mu   = dailyRets.reduce((s, r) => s + r, 0) / (dailyRets.length || 1);
  const sig  = Math.sqrt(dailyRets.reduce((s, r) => s + (r - mu) ** 2, 0) / (dailyRets.length || 1));
  const downRets = dailyRets.filter(r => r < 0);
  const sigD = downRets.length ? Math.sqrt(downRets.reduce((s, r) => s + r ** 2, 0) / downRets.length) : sig;
  const sharpe  = sig  > 0 ? parseFloat(((mu / sig)  * Math.sqrt(252)).toFixed(2)) : 0;
  const sortino = sigD > 0 ? parseFloat(((mu / sigD) * Math.sqrt(252)).toFixed(2)) : 0;
  const calmar  = maxDD > 0 ? parseFloat((annRet / maxDD).toFixed(2)) : 0;

  // Consecutive wins/losses
  let maxCW = 0, maxCL = 0, cw = 0, cl = 0;
  for (const t of trades) {
    if (t.pnl > 0) { cw++; cl = 0; maxCW = Math.max(maxCW, cw); }
    else           { cl++; cw = 0; maxCL = Math.max(maxCL, cl); }
  }

  // Monthly returns
  const monthlyReturns = Object.entries(monthlyMap).map(([month, vals]) => ({
    month,
    return: parseFloat((((vals[vals.length - 1] - vals[0]) / vals[0]) * 100).toFixed(2)),
  }));

  const avgHold   = trades.length ? trades.reduce((s, t) => s + t.holdingDays, 0) / trades.length : 0;
  const expectancy = trades.length ? (wins.length / trades.length) * (grossW / (wins.length || 1)) - (loses.length / trades.length) * (grossL / (loses.length || 1)) : 0;
  const recovery   = maxDD > 0 ? parseFloat((totRetPct / maxDD).toFixed(2)) : 0;

  return {
    strategyId: '', symbol,
    startDate:  candles[0]?.date || '', endDate: candles[candles.length - 1]?.date || '',
    startingCapital: startCapital, endingCapital: parseFloat(endCap.toFixed(2)),
    totalReturn: parseFloat(totRet.toFixed(2)), totalReturnPct: parseFloat(totRetPct.toFixed(2)),
    annualizedReturn: parseFloat(annRet.toFixed(2)), benchmarkReturn: parseFloat(bmRet.toFixed(2)),
    maxDrawdown: parseFloat((maxDD / 100 * startCapital).toFixed(2)), maxDrawdownPct: parseFloat(maxDD.toFixed(2)),
    maxDrawdownDuration: maxDDDur,
    sharpeRatio: sharpe, sortinoRatio: sortino, calmarRatio: calmar,
    winRate: trades.length ? parseFloat(((wins.length / trades.length) * 100).toFixed(1)) : 0,
    profitFactor: grossL > 0 ? parseFloat((grossW / grossL).toFixed(2)) : grossW > 0 ? 99 : 0,
    totalTrades: trades.length, winningTrades: wins.length, losingTrades: loses.length,
    avgWin: wins.length  ? parseFloat((grossW / wins.length).toFixed(2)) : 0,
    avgLoss: loses.length ? parseFloat((grossL / loses.length).toFixed(2)) : 0,
    avgHoldingDays: parseFloat(avgHold.toFixed(1)),
    bestTrade:  trades.length ? parseFloat(Math.max(...trades.map(t => t.pnlPct)).toFixed(2)) : 0,
    worstTrade: trades.length ? parseFloat(Math.min(...trades.map(t => t.pnlPct)).toFixed(2)) : 0,
    consecutiveWins: maxCW, consecutiveLosses: maxCL,
    recoveryFactor: recovery,
    expectancy: parseFloat(expectancy.toFixed(2)),
    equityCurve, monthlyReturns, trades,
  };
}

// ── AlgoService ───────────────────────────────────────────────────────────────
export class AlgoService {

  async createStrategy(userId: string, data: { name: string; description?: string; config: StrategyConfig }) {
    return prisma.strategy.create({ data: { userId, name: data.name, description: data.description || '', config: data.config as any, status: 'INACTIVE', backtestRun: false } });
  }

  async getStrategies(userId: string) {
    return prisma.strategy.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getStrategy(id: string, userId: string) {
    return prisma.strategy.findFirst({ where: { id, userId } });
  }

  async updateStrategy(id: string, _userId: string, data: any) {
    return prisma.strategy.update({ where: { id }, data });
  }

  async deleteStrategy(id: string, _userId: string) {
    return prisma.strategy.delete({ where: { id } });
  }

  async runBacktest(id: string, userId: string, days = 365) {
    const strategy = await prisma.strategy.findFirst({ where: { id, userId } });
    if (!strategy) throw new Error('Strategy not found');

    const config  = strategy.config as any as StrategyConfig;
    const symbols = (config.symbols || ['SPY']).slice(0, 5);
    const results: BacktestResult[] = [];

    for (const symbol of symbols) {
      const candles = generateCandles(symbol, days);
      const result  = runBacktest(config, symbol, candles, 100000 / symbols.length);
      result.strategyId = id;
      results.push(result);
    }

    await prisma.strategy.update({
      where: { id },
      data: { backtestRun: true, backtestResults: results as any, lastBacktestAt: new Date() },
    });

    return results;
  }

  async toggleStatus(id: string, userId: string) {
    const s = await prisma.strategy.findFirst({ where: { id, userId } });
    if (!s) throw new Error('Not found');
    const next = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return prisma.strategy.update({ where: { id }, data: { status: next } });
  }

  getTemplates() { return STRATEGY_TEMPLATES; }
}

export const algoService = new AlgoService();