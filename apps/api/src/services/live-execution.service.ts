// ════════════════════════════════════════════════════════════════════════════
// LIVE STRATEGY EXECUTION ENGINE
// Runs every minute. Evaluates active strategies against real Polygon data.
// Places paper orders automatically when conditions trigger.
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client';
import { fetchCandlesForTimeframe, fetchLiveQuote, isMarketOpen, LiveCandle } from './live-data.service';
import {
  SMA, EMA, RSI, STOCH, MACD, CCI, WILLIAMS_R, ROC, MFI,
  ATR, BOLLINGER, KELTNER, ADX, SUPERTREND, DONCHIAN, OBV, CHAIKIN, ZSCORE, LINEAR_REG,
} from './indicators';

const prisma = new PrismaClient();

// ── Signal log entry ──────────────────────────────────────────────────────────
export interface SignalLog {
  id:          string;
  strategyId:  string;
  strategyName:string;
  symbol:      string;
  signal:      'BUY' | 'SELL' | 'HOLD' | 'ERROR';
  price:       number;
  reason:      string;
  conditions:  { label: string; met: boolean; value: string }[];
  timestamp:   Date;
  orderPlaced: boolean;
  orderId?:    string;
}

// ── Build indicators from real candles ───────────────────────────────────────
function buildIndicators(candles: LiveCandle[]) {
  const c = candles.map(x => x.close);
  const h = candles.map(x => x.high);
  const l = candles.map(x => x.low);
  const v = candles.map(x => x.volume);

  const bb   = BOLLINGER(c, 20, 2);
  const kelt = KELTNER(h, l, c, 20, 10, 2);
  const macd = MACD(c, 12, 26, 9);
  const stoch = STOCH(h, l, c, 14, 3);
  const adx  = ADX(h, l, c, 14);
  const st   = SUPERTREND(h, l, c, 10, 3);
  const don20 = DONCHIAN(h, l, 20);
  const don28 = DONCHIAN(h, l, 28);
  const don10 = DONCHIAN(h, l, 10);
  const volSMA20 = SMA(v, 20);
  const obv      = OBV(c, v);

  return {
    price:c, high:h, low:l, volume:v,
    ma20:SMA(c,20), ma50:SMA(c,50), ma200:SMA(c,200),
    ema9:EMA(c,9), ema13:EMA(c,13), ema21:EMA(c,21), ema50:EMA(c,50),
    rsi14:RSI(c,14),
    stochK:stoch.k, stochD:stoch.d,
    macdLine:macd.line, macdSignal:macd.signal, macdHist:macd.hist,
    cci20:CCI(h,l,c,20),
    wr14:WILLIAMS_R(h,l,c,14),
    roc12:ROC(c,12), roc21:ROC(c,21), roc252:ROC(c,252),
    mfi14:MFI(h,l,c,v,14),
    atr14:ATR(h,l,c,14),
    bbUpper:bb.upper, bbMid:bb.mid, bbLower:bb.lower, bbWidth:bb.bandwidth,
    keltUpper:kelt.upper, keltLower:kelt.lower,
    adx14:adx.adx, pdi14:adx.pdi, mdi14:adx.mdi,
    supertrend:st.supertrend, stDir:st.direction,
    donUpper20:don20.upper, donLower20:don20.lower,
    donUpper28:don28.upper, donLower10:don10.lower,
    volSMA20, obv,
    cmf20:CHAIKIN(h,l,c,v,3,10),
    zscore20:ZSCORE(c,20),
    linReg20:LINEAR_REG(c,20),
    prevMacdHist:[null,...macd.hist.slice(0,-1)] as (number|null)[],
  };
}

type Inds = ReturnType<typeof buildIndicators>;

function getVal(inds: Inds, name: string, param: number|undefined, i: number): number|null {
  switch(name.toUpperCase()) {
    case 'PRICE':        return inds.price[i];
    case 'VOLUME':       return inds.volume[i];
    case 'MA':           return param===200?inds.ma200[i]:param===50?inds.ma50[i]:inds.ma20[i];
    case 'EMA':          return param===50?inds.ema50[i]:param===21?inds.ema21[i]:param===13?inds.ema13[i]:inds.ema9[i];
    case 'RSI':          return inds.rsi14[i];
    case 'STOCH_K':      return inds.stochK[i];
    case 'STOCH_D':      return inds.stochD[i];
    case 'MACD':         return inds.macdLine[i];
    case 'MACD_HIST':    return inds.macdHist[i];
    case 'SIGNAL':       return inds.macdSignal[i];
    case 'CCI':          return inds.cci20[i];
    case 'WILLIAMS_R':   return inds.wr14[i];
    case 'ROC':          return param===252?inds.roc252[i]:param===21?inds.roc21[i]:inds.roc12[i];
    case 'MFI':          return inds.mfi14[i];
    case 'ATR':          return inds.atr14[i];
    case 'BB_UPPER':     return inds.bbUpper[i];
    case 'BB_MID':       return inds.bbMid[i];
    case 'BB_LOWER':     return inds.bbLower[i];
    case 'BB_WIDTH':     return inds.bbWidth[i];
    case 'KELTNER_UPPER':return inds.keltUpper[i];
    case 'KELTNER_LOWER':return inds.keltLower[i];
    case 'ADX':          return inds.adx14[i];
    case 'PDI':          return inds.pdi14[i];
    case 'MDI':          return inds.mdi14[i];
    case 'SUPERTREND':   return inds.supertrend[i];
    case 'DONCHIAN_UPPER':return param===28?inds.donUpper28[i]:inds.donUpper20[i];
    case 'DONCHIAN_LOWER':return param===10?inds.donLower10[i]:inds.donLower20[i];
    case 'VOL_MA':       return inds.volSMA20[i];
    case 'OBV':          return inds.obv[i] as number;
    case 'CMF':          return inds.cmf20[i];
    case 'ZSCORE':       return inds.zscore20[i];
    case 'LINEAR_REG':   return inds.linReg20[i];
    case 'PREV_MACD_HIST':return inds.prevMacdHist[i];
    default:             return null;
  }
}

interface Condition { id:string; indicator:string; param?:number; operator:string; compareTo:string; compareParam?:number; value?:number; }
interface Rule { conditions:Condition[]; logic:'AND'|'OR'; }

function evalConditionDetailed(cond: Condition, inds: Inds, i: number): { met: boolean; label: string; value: string } {
  const curr = getVal(inds, cond.indicator, cond.param, i);
  const prev = getVal(inds, cond.indicator, cond.param, i-1);

  let cmpCurr: number|null, cmpPrev: number|null;
  if (cond.compareTo === 'VALUE') {
    cmpCurr = cmpPrev = cond.value ?? 0;
  } else {
    cmpCurr = getVal(inds, cond.compareTo, cond.compareParam, i);
    cmpPrev = getVal(inds, cond.compareTo, cond.compareParam, i-1);
  }

  const indLabel = `${cond.indicator}${cond.param ? `(${cond.param})` : ''}`;
  const cmpLabel = cond.compareTo === 'VALUE' ? String(cond.value ?? 0) : `${cond.compareTo}${cond.compareParam ? `(${cond.compareParam})` : ''}`;
  const label    = `${indLabel} ${cond.operator.replace('_',' ')} ${cmpLabel}`;

  if (curr == null || cmpCurr == null) return { met: false, label, value: 'N/A' };

  let met = false;
  switch(cond.operator) {
    case 'GREATER_THAN':  met = curr > cmpCurr; break;
    case 'LESS_THAN':     met = curr < cmpCurr; break;
    case 'CROSSES_ABOVE': met = prev != null && cmpPrev != null && prev <= cmpPrev && curr > cmpCurr; break;
    case 'CROSSES_BELOW': met = prev != null && cmpPrev != null && prev >= cmpPrev && curr < cmpCurr; break;
  }

  return {
    met,
    label,
    value: `${curr.toFixed(4)} vs ${cmpCurr.toFixed(4)}`,
  };
}

function evalRule(rule: Rule, inds: Inds, i: number): { triggered: boolean; details: { label:string; met:boolean; value:string }[] } {
  if (!rule.conditions?.length) return { triggered: false, details: [] };
  const details = rule.conditions.map(c => evalConditionDetailed(c, inds, i));
  const triggered = rule.logic === 'AND' ? details.every(d => d.met) : details.some(d => d.met);
  return { triggered, details };
}

// ── Check stop/take profit ────────────────────────────────────────────────────
async function checkExitConditions(position: any, currentPrice: number, config: any): Promise<string|null> {
  const entryPrice = Number(position.averageCost) || (Number(position.totalCost) / Number(position.quantity));
  const pnlPct     = ((currentPrice - entryPrice) / entryPrice) * 100;

  if (config.stopLoss    && pnlPct <= -config.stopLoss)  return `STOP_LOSS (P&L: ${pnlPct.toFixed(2)}%)`;
  if (config.takeProfit  && pnlPct >= config.takeProfit) return `TAKE_PROFIT (P&L: ${pnlPct.toFixed(2)}%)`;
  if (config.trailingStop) {
    // fetch strategy state for trailing high
    const trailHigh = position.metadata?.trailHigh || entryPrice;
    const trailDrop = ((trailHigh - currentPrice) / trailHigh) * 100;
    if (trailDrop >= config.trailingStop) return `TRAILING_STOP (drop: ${trailDrop.toFixed(2)}%)`;
  }
  return null;
}

// ── Place a paper BUY order ───────────────────────────────────────────────────
async function placePaperBuy(userId: string, symbol: string, price: number, config: any, reason: string): Promise<string|null> {
  try {
    const portfolio = await prisma.portfolio.findFirst({ where: { userId, isDefault: true } });
    if (!portfolio) return null;

    const allocate = Number(portfolio.cashBalance) * (config.positionSize / 100);
    const qty      = Math.floor(allocate / price);
    if (qty <= 0) { console.log(`[LiveExec] Not enough balance for ${symbol}`); return null; }

    const total  = qty * price;
    if (Number(portfolio.cashBalance) < total) { console.log(`[LiveExec] Insufficient balance`); return null; }

    const order = await prisma.order.create({
      data: {
        userId,
        portfolioId: portfolio.id,
        symbol,
        side:          'BUY',
        orderType:     'MARKET',
        status:        'FILLED',
        quantity:      qty,
        executedPrice: price,
        executedAt:    new Date(),
        filledQuantity:qty,
        notes:         `[ALGO] ${reason}`,
      },
    });

    // Update balance 
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data:  { cashBalance: { decrement: total } },
    });

    const existing = await prisma.position.findFirst({ where: { portfolioId: portfolio.id, symbol } });
    if (existing && Number(existing.quantity) > 0) {
      const newQty  = Number(existing.quantity) + qty;
      const newCost = Number(existing.totalCost) + total;
      await prisma.position.update({
        where: { id: existing.id },
        data:  { quantity: newQty, totalCost: newCost, averageCost: newCost / newQty, updatedAt: new Date() },
      });
    } else if (existing) {
      await prisma.position.update({
        where: { id: existing.id },
        data:  { quantity: qty, totalCost: total, averageCost: price, currentPrice: price, updatedAt: new Date() },
      });
    } else {
      await prisma.position.create({
        data: {
          portfolioId: portfolio.id, symbol, quantity: qty,
          averageCost: price, totalCost: total,
          currentPrice: price,
          openedAt: new Date(),
        },
      });
    }

    console.log(`[LiveExec] ✅ BUY ${qty} ${symbol} @ $${price} — ${reason}`);
    return order.id;
  } catch(e: any) {
    console.error('[LiveExec] placePaperBuy error:', e.message);
    return null;
  }
}

// ── Place a paper SELL order ──────────────────────────────────────────────────
async function placePaperSell(userId: string, symbol: string, price: number, reason: string): Promise<string|null> {
  try {
    const portfolio = await prisma.portfolio.findFirst({ where: { userId, isDefault: true } });
    if (!portfolio) return null;

    const position = await prisma.position.findFirst({ where: { portfolioId: portfolio.id, symbol } });
    if (!position || Number(position.quantity) <= 0) return null;

    const qty   = Number(position.quantity);
    const total = qty * price;
    const pnl   = total - Number(position.totalCost);

    const order = await prisma.order.create({
      data: {
        userId, portfolioId: portfolio.id, symbol, side: 'SELL', orderType: 'MARKET', status: 'FILLED',
        quantity: qty, executedPrice: price, executedAt: new Date(),
        filledQuantity: qty, notes: `[ALGO] ${reason}`,
      },
    });

    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data:  { 
        cashBalance: { increment: total },
        realizedPnL: { increment: pnl }
      },
    });

    await prisma.position.update({
      where: { id: position.id },
      data:  { quantity: 0, totalCost: 0, currentPrice: price, unrealizedPnL: 0, unrealizedPnLPct: 0, updatedAt: new Date() },
    });

    console.log(`[LiveExec] ✅ SELL ${qty} ${symbol} @ $${price} P&L: $${pnl.toFixed(2)} — ${reason}`);
    return order.id;
  } catch(e: any) {
    console.error('[LiveExec] placePaperSell error:', e.message);
    return null;
  }
}

// ── Save signal log to DB ─────────────────────────────────────────────────────
async function saveSignalLog(log: Omit<SignalLog, 'id'>) {
  try {
    await prisma.strategySignalLog.create({
      data: {
        strategyId:   log.strategyId,
        strategyName: log.strategyName,
        symbol:       log.symbol,
        signal:       log.signal,
        price:        log.price,
        reason:       log.reason,
        conditions:   log.conditions as any,
        orderPlaced:  log.orderPlaced,
        orderId:      log.orderId,
        timestamp:    log.timestamp,
      },
    });
  } catch(e: any) {
    // Table might not exist yet — log to console
    console.log(`[SignalLog] ${log.signal} ${log.symbol} @ $${log.price} — ${log.reason}`);
  }
}

// ── MAIN: Run all active strategies ──────────────────────────────────────────
export async function runActiveStrategies(): Promise<SignalLog[]> {
  const logs: SignalLog[] = [];

  if (!isMarketOpen()) {
    console.log('[LiveExec] Market closed — skipping execution run');
    return logs;
  }

  const strategies = await prisma.strategy.findMany({
    where:   { status: 'ACTIVE' },
    include: { user: { select: { id: true } } },
  });

  if (!strategies.length) {
    console.log('[LiveExec] No active strategies');
    return logs;
  }

  console.log(`[LiveExec] Running ${strategies.length} active strateg${strategies.length > 1 ? 'ies' : 'y'}`);

  for (const strategy of strategies) {
    const config  = strategy.config as any;
    const symbols = (config.symbols || []) as string[];
    const userId  = (strategy as any).user?.id || strategy.userId;

    for (const symbol of symbols) {
      try {
        // ── Fetch real candles ───────────────────────────────────────────
        const candles = await fetchCandlesForTimeframe(symbol, config.timeframe || '1D');
        if (candles.length < 50) {
          console.warn(`[LiveExec] Not enough candles for ${symbol} (${candles.length})`);
          continue;
        }

        // ── Build indicators on real data ────────────────────────────────
        const inds = buildIndicators(candles);
        const last = candles.length - 1;

        // ── Get real-time price ──────────────────────────────────────────
        const quote = await fetchLiveQuote(symbol);
        const price = quote?.price || candles[last].close;

        // ── Check if we have an open position ───────────────────────────
        const portfolio = await prisma.portfolio.findFirst({ where: { userId, isDefault: true } });
        const openPosition = portfolio ? await prisma.position.findFirst({
          where: { portfolioId: portfolio.id, symbol, quantity: { gt: 0 } },
        }) : null;

        let signal: SignalLog['signal'] = 'HOLD';
        let reason = '';
        let conditions: SignalLog['conditions'] = [];
        let orderId: string|undefined;
        let orderPlaced = false;

        if (openPosition) {
          // ── Check stop loss / take profit first ──────────────────────
          const exitReason = await checkExitConditions(openPosition, price, config);
          if (exitReason) {
            const id = await placePaperSell(userId, symbol, price, exitReason);
            signal      = 'SELL';
            reason      = exitReason;
            orderId     = id || undefined;
            orderPlaced = !!id;
          } else {
            // ── Check sell rule conditions ───────────────────────────
            const sellResult = evalRule(config.sellRule, inds, last);
            conditions = sellResult.details;
            if (sellResult.triggered) {
              const id = await placePaperSell(userId, symbol, price, 'SELL signal triggered');
              signal      = 'SELL';
              reason      = 'Sell conditions met: ' + sellResult.details.filter(d => d.met).map(d => d.label).join(' | ');
              orderId     = id || undefined;
              orderPlaced = !!id;
            } else {
              signal = 'HOLD';
              reason = 'Holding position — sell conditions not met';
            }
          }
        } else {
          // ── Check buy rule conditions ──────────────────────────────
          const buyResult = evalRule(config.buyRule, inds, last);
          conditions = buyResult.details;
          if (buyResult.triggered) {
            const id = await placePaperBuy(userId, symbol, price, config, 'BUY signal triggered');
            signal      = 'BUY';
            reason      = 'Buy conditions met: ' + buyResult.details.filter(d => d.met).map(d => d.label).join(' | ');
            orderId     = id || undefined;
            orderPlaced = !!id;
          } else {
            signal = 'HOLD';
            reason = 'Watching — buy conditions not met';
          }
        }

        const log: Omit<SignalLog, 'id'> = {
          strategyId:   strategy.id,
          strategyName: strategy.name,
          symbol, signal, price, reason, conditions,
          timestamp:   new Date(),
          orderPlaced, orderId,
        };

        await saveSignalLog(log);
        logs.push({ id: `${strategy.id}-${symbol}-${Date.now()}`, ...log });

        // Update strategy's last run time and total trades
        await prisma.strategy.update({
          where: { id: strategy.id },
          data:  {
            lastRunAt: new Date(),
            totalTrades: { increment: orderPlaced ? 1 : 0 },
          } as any,
        });

      } catch(e: any) {
        console.error(`[LiveExec] Error processing ${strategy.name}/${symbol}:`, e.message);
        logs.push({
          id: `err-${Date.now()}`,
          strategyId:   strategy.id,
          strategyName: strategy.name,
          symbol, signal: 'ERROR', price: 0,
          reason: e.message, conditions: [],
          timestamp: new Date(), orderPlaced: false,
        });
      }
    }
  }

  console.log(`[LiveExec] Done. ${logs.filter(l => l.signal === 'BUY').length} buys, ${logs.filter(l => l.signal === 'SELL').length} sells, ${logs.filter(l => l.signal === 'HOLD').length} holds`);
  return logs;
}

// ── Fetch recent signal logs from DB ─────────────────────────────────────────
export async function getSignalLogs(strategyId?: string, limit = 50): Promise<any[]> {
  try {
    return await prisma.strategySignalLog.findMany({
      where:   strategyId ? { strategyId } : undefined,
      orderBy: { timestamp: 'desc' },
      take:    limit,
    });
  } catch(e) {
    return [];
  }
}