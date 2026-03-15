// ════════════════════════════════════════════════════════════════════════════
// PRODUCTION INDICATOR LIBRARY
// Covers: Trend, Momentum, Volatility, Volume, Oscillators, Statistical
// ════════════════════════════════════════════════════════════════════════════

export type Series = (number | null)[];

// ── Moving Averages ───────────────────────────────────────────────────────────
export function SMA(data: number[], period: number): Series {
  return data.map((_, i) =>
    i < period - 1 ? null :
    parseFloat((data.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period).toFixed(4))
  );
}

export function EMA(data: number[], period: number): Series {
  const k = 2 / (period + 1);
  const out: Series = Array(data.length).fill(null);
  let prev: number | null = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    if (prev === null) { prev = data.slice(0, period).reduce((s, v) => s + v, 0) / period; out[i] = prev; continue; }
    prev = data[i] * k + prev * (1 - k);
    out[i] = parseFloat(prev.toFixed(4));
  }
  return out;
}

export function WMA(data: number[], period: number): Series {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const weights = slice.reduce((s, _, j) => s + (j + 1), 0);
    return parseFloat((slice.reduce((s, v, j) => s + v * (j + 1), 0) / weights).toFixed(4));
  });
}

export function DEMA(data: number[], period: number): Series {
  const e1 = EMA(data, period);
  const validE1 = e1.filter(v => v !== null) as number[];
  const e2Raw  = EMA(validE1, period);
  const e2: Series = Array(data.length).fill(null);
  let offset = e1.findIndex(v => v !== null);
  for (let i = 0; i < e2Raw.length; i++) e2[offset + i] = e2Raw[i];
  return data.map((_, i) => e1[i] !== null && e2[i] !== null ? parseFloat(((2 * (e1[i] as number)) - (e2[i] as number)).toFixed(4)) : null);
}

export function TEMA(data: number[], period: number): Series {
  const e1 = EMA(data, period);
  const e1v = e1.filter(v => v !== null) as number[];
  const e2Raw = EMA(e1v, period);
  const e2v = e2Raw.filter(v => v !== null) as number[];
  const e3Raw = EMA(e2v, period);

  const e2: Series = Array(data.length).fill(null);
  const e3: Series = Array(data.length).fill(null);
  let off1 = e1.findIndex(v => v !== null);
  let off2 = off1 + e2Raw.findIndex(v => v !== null);
  let off3 = off2 + e3Raw.findIndex(v => v !== null);
  for (let i = 0; i < e2Raw.length; i++) e2[off1 + i] = e2Raw[i];
  for (let i = 0; i < e3Raw.length; i++) e3[off2 + i] = e3Raw[i];

  return data.map((_, i) =>
    e1[i] !== null && e2[i] !== null && e3[i] !== null
      ? parseFloat(((3 * (e1[i] as number)) - (3 * (e2[i] as number)) + (e3[i] as number)).toFixed(4))
      : null
  );
}

export function VWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): Series {
  let cumTPV = 0, cumVol = 0;
  return closes.map((_, i) => {
    const tp = (highs[i] + lows[i] + closes[i]) / 3;
    cumTPV  += tp * volumes[i];
    cumVol  += volumes[i];
    return cumVol > 0 ? parseFloat((cumTPV / cumVol).toFixed(4)) : null;
  });
}

// ── Momentum Oscillators ──────────────────────────────────────────────────────
export function RSI(data: number[], period = 14): Series {
  const out: Series = Array(data.length).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period && i < data.length; i++) {
    const d = data[i] - data[i - 1];
    if (d > 0) avgGain += d; else avgLoss += -d;
  }
  avgGain /= period; avgLoss /= period;
  if (period < data.length) out[period] = parseFloat((100 - 100 / (1 + avgGain / (avgLoss || 1e-9))).toFixed(2));
  for (let i = period + 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, d))  / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
    out[i]  = parseFloat((100 - 100 / (1 + avgGain / (avgLoss || 1e-9))).toFixed(2));
  }
  return out;
}

export function STOCH(highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3): { k: Series; d: Series } {
  const k: Series = closes.map((_, i) => {
    if (i < kPeriod - 1) return null;
    const hh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const ll = Math.min(...lows.slice( i - kPeriod + 1, i + 1));
    return hh === ll ? 50 : parseFloat(((closes[i] - ll) / (hh - ll) * 100).toFixed(2));
  });
  const kVals = k.filter(v => v !== null) as number[];
  const dRaw  = SMA(kVals, dPeriod);
  const d: Series = Array(closes.length).fill(null);
  let off = k.findIndex(v => v !== null);
  for (let i = 0; i < dRaw.length; i++) d[off + i] = dRaw[i];
  return { k, d };
}

export function MACD(data: number[], fast = 12, slow = 26, signal = 9): { line: Series; signal: Series; hist: Series } {
  const ema12 = EMA(data, fast);
  const ema26 = EMA(data, slow);
  const line: Series  = data.map((_, i) => ema12[i] != null && ema26[i] != null ? parseFloat(((ema12[i] as number) - (ema26[i] as number)).toFixed(4)) : null);
  const lineVals = line.filter(v => v != null) as number[];
  const sigRaw   = EMA(lineVals, signal);
  let si = 0;
  const sig: Series  = line.map(v => v != null ? (sigRaw[si++] ?? null) : null);
  const hist: Series = line.map((v, i) => v != null && sig[i] != null ? parseFloat(((v as number) - (sig[i] as number)).toFixed(4)) : null);
  return { line, signal: sig, hist };
}

export function CCI(highs: number[], lows: number[], closes: number[], period = 20): Series {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const typicalPrices = closes.slice(i - period + 1, i + 1).map((c, j) => (highs[i - period + 1 + j] + lows[i - period + 1 + j] + c) / 3);
    const tp   = (highs[i] + lows[i] + closes[i]) / 3;
    const mean = typicalPrices.reduce((s, v) => s + v, 0) / period;
    const mad  = typicalPrices.reduce((s, v) => s + Math.abs(v - mean), 0) / period;
    return mad === 0 ? 0 : parseFloat(((tp - mean) / (0.015 * mad)).toFixed(2));
  });
}

export function WILLIAMS_R(highs: number[], lows: number[], closes: number[], period = 14): Series {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const hh = Math.max(...highs.slice(i - period + 1, i + 1));
    const ll = Math.min(...lows.slice(i - period + 1, i + 1));
    return hh === ll ? -50 : parseFloat((((hh - closes[i]) / (hh - ll)) * -100).toFixed(2));
  });
}

export function ROC(data: number[], period = 12): Series {
  return data.map((v, i) => i < period ? null : parseFloat((((v - data[i - period]) / data[i - period]) * 100).toFixed(2)));
}

export function MFI(highs: number[], lows: number[], closes: number[], volumes: number[], period = 14): Series {
  const typPrices = closes.map((c, i) => (highs[i] + lows[i] + c) / 3);
  const rawMF     = typPrices.map((tp, i) => ({ tp, mf: tp * volumes[i], up: i > 0 && tp > typPrices[i - 1] }));
  return closes.map((_, i) => {
    if (i < period) return null;
    const slice   = rawMF.slice(i - period + 1, i + 1);
    const posFlow = slice.filter(v => v.up).reduce((s, v) => s + v.mf, 0);
    const negFlow = slice.filter(v => !v.up).reduce((s, v) => s + v.mf, 0);
    return negFlow === 0 ? 100 : parseFloat((100 - 100 / (1 + posFlow / negFlow)).toFixed(2));
  });
}

// ── Volatility ────────────────────────────────────────────────────────────────
export function ATR(highs: number[], lows: number[], closes: number[], period = 14): Series {
  const tr: number[] = closes.map((c, i) =>
    i === 0 ? highs[0] - lows[0] :
    Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]))
  );
  const out: Series = Array(closes.length).fill(null);
  let atr = tr.slice(0, period).reduce((s, v) => s + v, 0) / period;
  out[period - 1] = parseFloat(atr.toFixed(4));
  for (let i = period; i < closes.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    out[i] = parseFloat(atr.toFixed(4));
  }
  return out;
}

export function BOLLINGER(data: number[], period = 20, stdMult = 2): { upper: Series; mid: Series; lower: Series; bandwidth: Series; pctB: Series } {
  const mid = SMA(data, period);
  const upper: Series = [], lower: Series = [], bandwidth: Series = [], pctB: Series = [];
  data.forEach((_, i) => {
    if (mid[i] == null) { upper.push(null); lower.push(null); bandwidth.push(null); pctB.push(null); return; }
    const slice  = data.slice(i - period + 1, i + 1);
    const mean   = mid[i] as number;
    const stdDev = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    const u = mean + stdMult * stdDev;
    const l = mean - stdMult * stdDev;
    upper.push(parseFloat(u.toFixed(4)));
    lower.push(parseFloat(l.toFixed(4)));
    bandwidth.push(parseFloat(((u - l) / mean * 100).toFixed(2)));
    pctB.push(parseFloat(((data[i] - l) / (u - l)).toFixed(4)));
  });
  return { upper, mid, lower, bandwidth, pctB };
}

export function KELTNER(highs: number[], lows: number[], closes: number[], emaPeriod = 20, atrPeriod = 10, mult = 2): { upper: Series; mid: Series; lower: Series } {
  const mid   = EMA(closes, emaPeriod);
  const atr   = ATR(highs, lows, closes, atrPeriod);
  const upper = mid.map((m, i) => m != null && atr[i] != null ? parseFloat((m + mult * (atr[i] as number)).toFixed(4)) : null);
  const lower = mid.map((m, i) => m != null && atr[i] != null ? parseFloat((m - mult * (atr[i] as number)).toFixed(4)) : null);
  return { upper, mid, lower };
}

// ── Trend / Directional ───────────────────────────────────────────────────────
export function ADX(highs: number[], lows: number[], closes: number[], period = 14): { adx: Series; pdi: Series; mdi: Series } {
  const tr: number[]  = closes.map((c, i) => i === 0 ? highs[0] - lows[0] : Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  const dmPlus: number[]  = highs.map((h, i) => i === 0 ? 0 : Math.max(0, h - highs[i - 1]) > Math.max(0, lows[i - 1] - lows[i]) ? Math.max(0, h - highs[i - 1]) : 0);
  const dmMinus: number[] = lows.map((l, i)  => i === 0 ? 0 : Math.max(0, lows[i - 1] - l)  > Math.max(0, highs[i] - highs[i - 1]) ? Math.max(0, lows[i - 1] - l)  : 0);

  const smooth = (arr: number[], p: number) => {
    const out: number[] = Array(arr.length).fill(0);
    out[p - 1] = arr.slice(0, p).reduce((s, v) => s + v, 0);
    for (let i = p; i < arr.length; i++) out[i] = out[i - 1] - out[i - 1] / p + arr[i];
    return out;
  };

  const sTR  = smooth(tr, period);
  const sDMP = smooth(dmPlus, period);
  const sDMM = smooth(dmMinus, period);

  const pdi: Series = closes.map((_, i) => i < period ? null : parseFloat(((sDMP[i] / (sTR[i] || 1)) * 100).toFixed(2)));
  const mdi: Series = closes.map((_, i) => i < period ? null : parseFloat(((sDMM[i] / (sTR[i] || 1)) * 100).toFixed(2)));

  const dx: number[] = closes.map((_, i) => {
    if (pdi[i] == null || mdi[i] == null) return 0;
    const sum = (pdi[i] as number) + (mdi[i] as number);
    return sum === 0 ? 0 : Math.abs((pdi[i] as number) - (mdi[i] as number)) / sum * 100;
  });

  const adxArr: Series = Array(closes.length).fill(null);
  if (closes.length >= period * 2) {
    let adxVal = dx.slice(period, period * 2).reduce((s, v) => s + v, 0) / period;
    adxArr[period * 2 - 1] = parseFloat(adxVal.toFixed(2));
    for (let i = period * 2; i < closes.length; i++) {
      adxVal = (adxVal * (period - 1) + dx[i]) / period;
      adxArr[i] = parseFloat(adxVal.toFixed(2));
    }
  }

  return { adx: adxArr, pdi, mdi };
}

export function SUPERTREND(highs: number[], lows: number[], closes: number[], period = 10, mult = 3): { supertrend: Series; direction: Series } {
  const atr = ATR(highs, lows, closes, period);
  const hl2  = closes.map((_, i) => (highs[i] + lows[i]) / 2);
  const up   = hl2.map((h, i) => atr[i] != null ? h + mult * (atr[i] as number) : null);
  const dn   = hl2.map((h, i) => atr[i] != null ? h - mult * (atr[i] as number) : null);

  const finalUp:   (number | null)[] = [...up];
  const finalDn:   (number | null)[] = [...dn];
  const st:   Series = Array(closes.length).fill(null);
  const dir:  Series = Array(closes.length).fill(null);

  for (let i = 1; i < closes.length; i++) {
    if (up[i] == null || dn[i] == null) continue;
    finalUp[i] = (finalUp[i] as number) < (finalUp[i - 1] ?? Infinity) || closes[i - 1] > (finalUp[i - 1] ?? 0) ? finalUp[i] : finalUp[i - 1];
    finalDn[i] = (finalDn[i] as number) > (finalDn[i - 1] ?? -Infinity) || closes[i - 1] < (finalDn[i - 1] ?? Infinity) ? finalDn[i] : finalDn[i - 1];

    const prevDir = dir[i - 1] ?? 1;
    if (prevDir === -1 && closes[i] > (finalUp[i - 1] as number)) dir[i] = 1;
    else if (prevDir === 1 && closes[i] < (finalDn[i - 1] as number)) dir[i] = -1;
    else dir[i] = prevDir;

    st[i] = dir[i] === 1 ? finalDn[i] : finalUp[i];
  }

  return { supertrend: st, direction: dir };
}

export function ICHIMOKU(highs: number[], lows: number[], closes: number[]): {
  tenkan: Series; kijun: Series; senkouA: Series; senkouB: Series; chikou: Series;
} {
  const midVal = (arr1: number[], arr2: number[], i: number, p: number) => {
    if (i < p - 1) return null;
    const h = Math.max(...arr1.slice(i - p + 1, i + 1));
    const l = Math.min(...arr2.slice(i - p + 1, i + 1));
    return parseFloat(((h + l) / 2).toFixed(4));
  };

  const tenkan:  Series = closes.map((_, i) => midVal(highs, lows, i, 9));
  const kijun:   Series = closes.map((_, i) => midVal(highs, lows, i, 26));
  const senkouA: Series = closes.map((_, i) => tenkan[i] != null && kijun[i] != null ? parseFloat((((tenkan[i] as number) + (kijun[i] as number)) / 2).toFixed(4)) : null);
  const senkouB: Series = closes.map((_, i) => midVal(highs, lows, i, 52));
  const chikou:  Series = closes.map((c, i) => i < closes.length - 26 ? closes[i + 26] : null);

  return { tenkan, kijun, senkouA, senkouB, chikou };
}

// ── Volume Indicators ─────────────────────────────────────────────────────────
export function OBV(closes: number[], volumes: number[]): Series {
  let obv = 0;
  return closes.map((c, i) => {
    if (i === 0) return 0;
    obv += c > closes[i - 1] ? volumes[i] : c < closes[i - 1] ? -volumes[i] : 0;
    return obv;
  });
}

export function CHAIKIN(highs: number[], lows: number[], closes: number[], volumes: number[], fast = 3, slow = 10): Series {
  const mfm = closes.map((c, i) => lows[i] === highs[i] ? 0 : ((c - lows[i]) - (highs[i] - c)) / (highs[i] - lows[i]));
  const mfv = mfm.map((m, i) => m * volumes[i]);
  const adl: number[] = mfv.reduce((acc: number[], v) => { acc.push((acc[acc.length - 1] || 0) + v); return acc; }, []);
  const emaFast = EMA(adl, fast);
  const emaSlow = EMA(adl, slow);
  return adl.map((_, i) => emaFast[i] != null && emaSlow[i] != null ? parseFloat(((emaFast[i] as number) - (emaSlow[i] as number)).toFixed(2)) : null);
}

// ── Statistical ───────────────────────────────────────────────────────────────
export function ZSCORE(data: number[], period = 20): Series {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const mean  = slice.reduce((s, v) => s + v, 0) / period;
    const std   = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
    return std === 0 ? 0 : parseFloat(((data[i] - mean) / std).toFixed(4));
  });
}

export function LINEAR_REG(data: number[], period = 14): Series {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    const n     = period;
    const xs    = Array.from({ length: n }, (_, j) => j);
    const xMean = (n - 1) / 2;
    const yMean = slice.reduce((s, v) => s + v, 0) / n;
    const num   = xs.reduce((s, x, j) => s + (x - xMean) * (slice[j] - yMean), 0);
    const den   = xs.reduce((s, x) => s + (x - xMean) ** 2, 0);
    const slope = den === 0 ? 0 : num / den;
    return parseFloat((yMean + slope * (n - 1 - xMean)).toFixed(4));
  });
}

export function DONCHIAN(highs: number[], lows: number[], period = 20): { upper: Series; lower: Series; mid: Series } {
  const upper = highs.map((_, i) => i < period - 1 ? null : parseFloat(Math.max(...highs.slice(i - period + 1, i + 1)).toFixed(4)));
  const lower = lows.map((_, i)  => i < period - 1 ? null : parseFloat(Math.min(...lows.slice(i - period + 1,  i + 1)).toFixed(4)));
  const mid   = upper.map((u, i) => u != null && lower[i] != null ? parseFloat(((u + (lower[i] as number)) / 2).toFixed(4)) : null);
  return { upper, lower, mid };
}

// ── Position Sizing ───────────────────────────────────────────────────────────
export function kellyFraction(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0) return 0;
  const b = avgWin / avgLoss;
  const p = winRate / 100;
  const q = 1 - p;
  return Math.max(0, Math.min(0.25, (b * p - q) / b)); // cap at 25%
}

export function atrPositionSize(capital: number, riskPct: number, entryPrice: number, atrValue: number, atrMult = 2): number {
  if (atrValue === 0) return 0;
  const riskAmount = capital * (riskPct / 100);
  const stopDist   = atrValue * atrMult;
  return Math.floor(riskAmount / stopDist);
}