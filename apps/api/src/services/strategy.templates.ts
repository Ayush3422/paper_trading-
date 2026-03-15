// ════════════════════════════════════════════════════════════════════════════
// 30+ PRODUCTION STRATEGY TEMPLATES
// Categories: Trend, Momentum, Mean Reversion, Breakout, Volatility,
//             Volume, Statistical, Multi-Factor, Advanced
// ════════════════════════════════════════════════════════════════════════════

export const STRATEGY_TEMPLATES = [

  // ── TREND FOLLOWING ─────────────────────────────────────────────────────
  {
    id: 'golden-cross',
    name: 'Golden / Death Cross',
    description: 'Classic trend strategy. Buy when MA50 crosses above MA200 (Golden Cross). Sell when MA50 crosses below MA200 (Death Cross). Highly reliable on daily timeframe.',
    category: 'Trend Following',
    difficulty: 'Beginner',
    icon: '✨',
    timeHorizon: 'Long-term',
    winRateExpected: '45–55%',
    config: {
      symbols: ['SPY'], positionSize: 95, maxOpenTrades: 1, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'MA', param:50, operator:'CROSSES_ABOVE', compareTo:'MA', compareParam:200 }] },
      sellRule: { logic: 'AND', conditions: [{ id:'2', indicator:'MA', param:50, operator:'CROSSES_BELOW', compareTo:'MA', compareParam:200 }] },
    },
  },
  {
    id: 'supertrend',
    name: 'Supertrend Rider',
    description: 'Uses the Supertrend indicator (ATR-based) to stay long above the line and short below. One of the most popular trend-following systems for swing traders.',
    category: 'Trend Following',
    difficulty: 'Beginner',
    icon: '🚀',
    timeHorizon: 'Swing (days–weeks)',
    winRateExpected: '40–50%',
    config: {
      symbols: ['AAPL'], positionSize: 80, stopLoss: 3, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'SUPERTREND' }] },
      sellRule: { logic: 'AND', conditions: [{ id:'2', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'SUPERTREND' }] },
    },
  },
  {
    id: 'ema-ribbon',
    name: 'EMA Ribbon Trend',
    description: 'Stacked EMA ribbon system. Enter long when EMA9 > EMA21 > EMA50, all trending upward. Filters out sideways markets using the ADX confirmation.',
    category: 'Trend Following',
    difficulty: 'Intermediate',
    icon: '🎀',
    timeHorizon: 'Swing',
    winRateExpected: '48–58%',
    config: {
      symbols: ['NVDA'], positionSize: 70, stopLoss: 6, takeProfit: 18, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'EMA', param:9,  operator:'GREATER_THAN', compareTo:'EMA', compareParam:21 },
        { id:'2', indicator:'EMA', param:21, operator:'GREATER_THAN', compareTo:'EMA', compareParam:50 },
        { id:'3', indicator:'ADX', param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:25 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'EMA', param:9, operator:'CROSSES_BELOW', compareTo:'EMA', compareParam:21 },
      ]},
    },
  },
  {
    id: 'ichimoku-cloud',
    name: 'Ichimoku Cloud Strategy',
    description: 'Full Ichimoku system: Enter when price breaks above the cloud, Tenkan > Kijun, and Chikou confirms. One of the most complete single-indicator systems.',
    category: 'Trend Following',
    difficulty: 'Advanced',
    icon: '☁️',
    timeHorizon: 'Swing–Position',
    winRateExpected: '52–62%',
    config: {
      symbols: ['MSFT'], positionSize: 75, stopLoss: 5, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'SENKOU_A' },
        { id:'2', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'SENKOU_B' },
        { id:'3', indicator:'TENKAN', operator:'GREATER_THAN', compareTo:'KIJUN' },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'PRICE', operator:'LESS_THAN', compareTo:'SENKOU_A' },
        { id:'5', indicator:'TENKAN', operator:'CROSSES_BELOW', compareTo:'KIJUN' },
      ]},
    },
  },
  {
    id: 'adx-trend',
    name: 'ADX Trend Filter',
    description: 'Uses ADX to confirm strong trends (ADX > 25), then +DI/-DI crossover for entry. Avoids trading in choppy/sideways markets entirely.',
    category: 'Trend Following',
    difficulty: 'Intermediate',
    icon: '📡',
    timeHorizon: 'Swing',
    winRateExpected: '50–60%',
    config: {
      symbols: ['QQQ'], positionSize: 80, stopLoss: 5, maxOpenTrades: 1, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'ADX',  param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:25 },
        { id:'2', indicator:'PDI',  param:14, operator:'GREATER_THAN', compareTo:'MDI', compareParam:14 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'MDI',  param:14, operator:'GREATER_THAN', compareTo:'PDI', compareParam:14 },
        { id:'4', indicator:'ADX',  param:14, operator:'LESS_THAN',    compareTo:'VALUE', value:20 },
      ]},
    },
  },
  {
    id: 'linear-reg-trend',
    name: 'Linear Regression Channel',
    description: 'Enters when price is above the linear regression trend line with positive slope. Exits on mean-reversion back to the regression line.',
    category: 'Trend Following',
    difficulty: 'Intermediate',
    icon: '📐',
    timeHorizon: 'Position',
    winRateExpected: '48–56%',
    config: {
      symbols: ['AAPL'], positionSize: 70, stopLoss: 4, takeProfit: 12, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'LINEAR_REG', compareParam:20 },
        { id:'2', indicator:'RSI',   param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:50 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE', operator:'LESS_THAN', compareTo:'LINEAR_REG', compareParam:20 },
      ]},
    },
  },

  // ── MOMENTUM ──────────────────────────────────────────────────────────────
  {
    id: 'macd-momentum',
    name: 'MACD Momentum Cross',
    description: 'Enters on MACD line crossing above signal with positive histogram. Momentum-based — works best on trending assets. Add RSI filter to reduce false signals.',
    category: 'Momentum',
    difficulty: 'Beginner',
    icon: '📈',
    timeHorizon: 'Swing',
    winRateExpected: '45–55%',
    config: {
      symbols: ['AAPL'], positionSize: 75, stopLoss: 7, takeProfit: 20, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'MACD', operator:'CROSSES_ABOVE', compareTo:'SIGNAL' },
        { id:'2', indicator:'MACD_HIST', operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'MACD', operator:'CROSSES_BELOW', compareTo:'SIGNAL' },
      ]},
    },
  },
  {
    id: 'roc-momentum',
    name: 'Rate of Change Momentum',
    description: 'Pure momentum strategy: buy when ROC(12) crosses above zero with rising volume. Momentum factor — one of the best-documented market anomalies.',
    category: 'Momentum',
    difficulty: 'Intermediate',
    icon: '⚡',
    timeHorizon: 'Swing',
    winRateExpected: '46–54%',
    config: {
      symbols: ['TSLA'], positionSize: 60, stopLoss: 8, takeProfit: 20, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'ROC',    param:12, operator:'CROSSES_ABOVE', compareTo:'VALUE', value:0 },
        { id:'2', indicator:'VOLUME', operator:'GREATER_THAN', compareTo:'VOL_MA', compareParam:20 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'ROC', param:12, operator:'CROSSES_BELOW', compareTo:'VALUE', value:0 },
      ]},
    },
  },
  {
    id: 'dual-momentum',
    name: 'Dual Momentum (Gary Antonacci)',
    description: 'Combines absolute & relative momentum. Long SPY when ROC(252) > 0. Switch to cash otherwise. One of the most backtested strategies in finance.',
    category: 'Momentum',
    difficulty: 'Intermediate',
    icon: '🔥',
    timeHorizon: 'Position (monthly)',
    winRateExpected: '55–65%',
    config: {
      symbols: ['SPY'], positionSize: 95, stopLoss: 12, maxOpenTrades: 1, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'ROC',  param:252, operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
        { id:'2', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'MA', compareParam:200 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'ROC',  param:252, operator:'LESS_THAN',    compareTo:'VALUE', value:0 },
        { id:'4', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'MA', compareParam:200 },
      ]},
    },
  },
  {
    id: 'stoch-momentum',
    name: 'Stochastic Momentum Strategy',
    description: 'Uses Stochastic %K/%D crossover with a moving average trend filter. Combines momentum and trend for high-quality swing trades.',
    category: 'Momentum',
    difficulty: 'Intermediate',
    icon: '🎲',
    timeHorizon: 'Swing',
    winRateExpected: '50–58%',
    config: {
      symbols: ['AMZN'], positionSize: 70, stopLoss: 5, takeProfit: 15, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'STOCH_K', param:14, operator:'CROSSES_ABOVE', compareTo:'STOCH_D', compareParam:3 },
        { id:'2', indicator:'STOCH_K', param:14, operator:'LESS_THAN',     compareTo:'VALUE', value:40 },
        { id:'3', indicator:'PRICE',   operator:'GREATER_THAN', compareTo:'MA', compareParam:50 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'STOCH_K', param:14, operator:'CROSSES_BELOW', compareTo:'STOCH_D', compareParam:3 },
        { id:'5', indicator:'STOCH_K', param:14, operator:'GREATER_THAN',  compareTo:'VALUE', value:80 },
      ]},
    },
  },

  // ── MEAN REVERSION ────────────────────────────────────────────────────────
  {
    id: 'rsi-reversal',
    name: 'RSI Mean Reversion',
    description: 'Classic contrarian strategy. Buy extreme oversold (RSI < 30), sell overbought (RSI > 70). High win rate in range-bound markets. Works best on indices and blue chips.',
    category: 'Mean Reversion',
    difficulty: 'Beginner',
    icon: '🔄',
    timeHorizon: 'Short swing',
    winRateExpected: '60–70%',
    config: {
      symbols: ['SPY'], positionSize: 80, stopLoss: 4, maxOpenTrades: 1, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'RSI', param:14, operator:'LESS_THAN',    compareTo:'VALUE', value:30 }] },
      sellRule: { logic: 'AND', conditions: [{ id:'2', indicator:'RSI', param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:70 }] },
    },
  },
  {
    id: 'bollinger-bounce',
    name: 'Bollinger Band Mean Reversion',
    description: 'Buy when price touches lower Bollinger Band AND RSI < 40. Sell at the upper band. High probability trade in normal volatility environments.',
    category: 'Mean Reversion',
    difficulty: 'Beginner',
    icon: '🎯',
    timeHorizon: 'Swing',
    winRateExpected: '62–72%',
    config: {
      symbols: ['AAPL'], positionSize: 70, stopLoss: 4, takeProfit: 8, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'BB_LOWER' },
        { id:'2', indicator:'RSI',   param:14, operator:'LESS_THAN', compareTo:'VALUE', value:40 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'BB_UPPER' },
        { id:'4', indicator:'RSI',   param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:65 },
      ]},
    },
  },
  {
    id: 'zscore-reversion',
    name: 'Z-Score Statistical Reversion',
    description: 'Quantitative approach: buy when Z-Score < -2 (price 2 std below mean), sell when Z-Score > +1. Professional-grade statistical arbitrage concept.',
    category: 'Mean Reversion',
    difficulty: 'Advanced',
    icon: '📊',
    timeHorizon: 'Short swing',
    winRateExpected: '63–73%',
    config: {
      symbols: ['QQQ'], positionSize: 75, stopLoss: 5, takeProfit: 8, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'ZSCORE', param:20, operator:'LESS_THAN',    compareTo:'VALUE', value:-2 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'ZSCORE', param:20, operator:'GREATER_THAN', compareTo:'VALUE', value:1  }] },
    },
  },
  {
    id: 'keltner-reversal',
    name: 'Keltner Channel Reversion',
    description: 'When price closes outside the Keltner Channel (ATR-based), enter a counter-trend position expecting reversion to the EMA. Tighter signals than Bollinger Bands.',
    category: 'Mean Reversion',
    difficulty: 'Intermediate',
    icon: '📦',
    timeHorizon: 'Swing',
    winRateExpected: '60–68%',
    config: {
      symbols: ['MSFT'], positionSize: 65, stopLoss: 4, takeProfit: 6, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'KELTNER_LOWER' }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'EMA', compareParam:20 }] },
    },
  },
  {
    id: 'cci-reversion',
    name: 'CCI Extreme Reversion',
    description: 'Commodity Channel Index extreme readings signal reversal points. Buy at CCI < -100, sell at CCI > +100. Particularly effective on commodities, ETFs and forex.',
    category: 'Mean Reversion',
    difficulty: 'Intermediate',
    icon: '🌀',
    timeHorizon: 'Swing',
    winRateExpected: '58–66%',
    config: {
      symbols: ['GLD'], positionSize: 70, stopLoss: 3, takeProfit: 6, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'CCI', param:20, operator:'LESS_THAN',    compareTo:'VALUE', value:-100 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'CCI', param:20, operator:'GREATER_THAN', compareTo:'VALUE', value:100  }] },
    },
  },
  {
    id: 'williams-r-reversion',
    name: "Williams %R Reversal",
    description: "Williams %R extreme readings (-80 oversold, -20 overbought) combined with price above MA200 for trend confirmation. Larry Williams' original momentum reversal system.",
    category: 'Mean Reversion',
    difficulty: 'Intermediate',
    icon: '🔁',
    timeHorizon: 'Short swing',
    winRateExpected: '58–65%',
    config: {
      symbols: ['AAPL'], positionSize: 65, stopLoss: 4, takeProfit: 8, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'WILLIAMS_R', param:14, operator:'LESS_THAN',    compareTo:'VALUE', value:-80 },
        { id:'2', indicator:'PRICE',      operator:'GREATER_THAN', compareTo:'MA', compareParam:200 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'WILLIAMS_R', param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:-20 },
      ]},
    },
  },

  // ── BREAKOUT ──────────────────────────────────────────────────────────────
  {
    id: 'donchian-breakout',
    name: 'Donchian Channel Breakout',
    description: "Richard Donchian's turtle trading system. Buy on 20-day high breakout, sell on 10-day low. Foundation of the legendary Turtle Traders strategy. Exceptional on trending markets.",
    category: 'Breakout',
    difficulty: 'Intermediate',
    icon: '🐢',
    timeHorizon: 'Swing–Position',
    winRateExpected: '40–48%',
    config: {
      symbols: ['NVDA'], positionSize: 70, stopLoss: 6, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'DONCHIAN_UPPER', compareParam:20 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'DONCHIAN_LOWER', compareParam:10 }] },
    },
  },
  {
    id: 'volume-breakout',
    name: 'Volume Surge Breakout',
    description: 'Enters when price breaks above MA20 with volume 2x above average. High-quality breakout filter — volume confirms institutional participation.',
    category: 'Breakout',
    difficulty: 'Intermediate',
    icon: '💥',
    timeHorizon: 'Swing',
    winRateExpected: '50–58%',
    config: {
      symbols: ['AMD','NVDA'], positionSize: 50, stopLoss: 6, takeProfit: 18, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE',  operator:'CROSSES_ABOVE', compareTo:'MA', compareParam:20 },
        { id:'2', indicator:'VOLUME', operator:'GREATER_THAN',  compareTo:'VOL_MA', compareParam:20 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE',  operator:'LESS_THAN',     compareTo:'MA', compareParam:20 },
        { id:'4', indicator:'RSI',    param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:75 },
      ]},
    },
  },
  {
    id: 'atr-breakout',
    name: 'ATR Volatility Breakout',
    description: 'Enters when price moves more than 1.5x ATR from the previous close in a single day — signaling a significant volatility expansion and potential trend start.',
    category: 'Breakout',
    difficulty: 'Intermediate',
    icon: '🌋',
    timeHorizon: 'Swing',
    winRateExpected: '48–56%',
    config: {
      symbols: ['TSLA'], positionSize: 60, stopLoss: 8, takeProfit: 24, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'MA', compareParam:50 },
        { id:'2', indicator:'ATR_EXPANSION', param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:1.5 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'ATR_CONTRACTION', param:14, operator:'LESS_THAN', compareTo:'VALUE', value:0.5 },
      ]},
    },
  },
  {
    id: 'opening-range-breakout',
    name: 'Opening Range Breakout (ORB)',
    description: "Buy when price breaks above the first hour's high with strong volume. One of the most traded intraday strategies by professional traders globally.",
    category: 'Breakout',
    difficulty: 'Advanced',
    icon: '🔔',
    timeHorizon: 'Intraday',
    winRateExpected: '52–60%',
    config: {
      symbols: ['SPY'], positionSize: 80, stopLoss: 1, takeProfit: 3, maxOpenTrades: 1, timeframe: '1H',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'OPEN_HIGH', compareParam:60 },
        { id:'2', indicator:'VOLUME', operator:'GREATER_THAN', compareTo:'VOL_MA', compareParam:5 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE', operator:'LESS_THAN', compareTo:'OPEN_LOW', compareParam:60 },
      ]},
    },
  },

  // ── VOLATILITY ────────────────────────────────────────────────────────────
  {
    id: 'bollinger-squeeze',
    name: 'Bollinger Band Squeeze',
    description: 'Trades the volatility contraction-expansion cycle. When bands narrow (squeeze), a big move is coming. Enter on the breakout direction after squeeze resolves.',
    category: 'Volatility',
    difficulty: 'Intermediate',
    icon: '🤏',
    timeHorizon: 'Swing',
    winRateExpected: '52–60%',
    config: {
      symbols: ['NVDA'], positionSize: 70, stopLoss: 5, takeProfit: 15, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'BB_WIDTH', param:20, operator:'LESS_THAN', compareTo:'VALUE', value:3 },
        { id:'2', indicator:'PRICE', operator:'CROSSES_ABOVE', compareTo:'BB_UPPER' },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'RSI', param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:70 },
      ]},
    },
  },
  {
    id: 'keltner-bollinger-squeeze',
    name: 'TTM Squeeze (Keltner + Bollinger)',
    description: 'John Carter\'s TTM Squeeze: squeeze fires when Bollinger Bands are inside Keltner Channels. Momentum histogram determines direction. One of the most powerful entry signals.',
    category: 'Volatility',
    difficulty: 'Advanced',
    icon: '💫',
    timeHorizon: 'Swing',
    winRateExpected: '55–65%',
    config: {
      symbols: ['AAPL','MSFT'], positionSize: 60, stopLoss: 5, takeProfit: 15, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'BB_LOWER',       operator:'GREATER_THAN', compareTo:'KELTNER_LOWER' },
        { id:'2', indicator:'MACD_HIST',      operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
        { id:'3', indicator:'MACD_HIST',      operator:'GREATER_THAN', compareTo:'PREV_MACD_HIST' },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'MACD_HIST', operator:'LESS_THAN', compareTo:'VALUE', value:0 },
      ]},
    },
  },
  {
    id: 'vix-timing',
    name: 'VIX Timing (Fear Index)',
    description: 'Uses VIX fear index as a contrarian signal. Buy SPY when VIX spikes above 25 (fear is high = buy opportunity). Sell when VIX falls below 15 (complacency).',
    category: 'Volatility',
    difficulty: 'Intermediate',
    icon: '😨',
    timeHorizon: 'Swing–Position',
    winRateExpected: '60–70%',
    config: {
      symbols: ['SPY'], positionSize: 90, stopLoss: 6, maxOpenTrades: 1, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'VIX', operator:'GREATER_THAN', compareTo:'VALUE', value:25 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'VIX', operator:'LESS_THAN',    compareTo:'VALUE', value:15 }] },
    },
  },

  // ── VOLUME-BASED ──────────────────────────────────────────────────────────
  {
    id: 'obv-divergence',
    name: 'OBV Divergence',
    description: 'On Balance Volume divergence: when price makes new lows but OBV rises, accumulation is happening — buy the divergence. Smart money detection.',
    category: 'Volume',
    difficulty: 'Advanced',
    icon: '📦',
    timeHorizon: 'Swing',
    winRateExpected: '58–65%',
    config: {
      symbols: ['AAPL'], positionSize: 70, stopLoss: 5, takeProfit: 15, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'OBV',   operator:'CROSSES_ABOVE', compareTo:'OBV_MA', compareParam:20 },
        { id:'2', indicator:'PRICE', operator:'GREATER_THAN',  compareTo:'MA', compareParam:50 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'OBV', operator:'CROSSES_BELOW', compareTo:'OBV_MA', compareParam:20 },
      ]},
    },
  },
  {
    id: 'mfi-volume-momentum',
    name: 'Money Flow Index Strategy',
    description: 'MFI combines price and volume — a "volume-weighted RSI." Buy when MFI crosses above 20 (oversold exit), sell when MFI drops below 80 (overbought exit).',
    category: 'Volume',
    difficulty: 'Intermediate',
    icon: '💸',
    timeHorizon: 'Swing',
    winRateExpected: '55–63%',
    config: {
      symbols: ['AMZN'], positionSize: 70, stopLoss: 5, takeProfit: 12, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'MFI', param:14, operator:'CROSSES_ABOVE', compareTo:'VALUE', value:20 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'MFI', param:14, operator:'CROSSES_BELOW', compareTo:'VALUE', value:80 }] },
    },
  },
  {
    id: 'vwap-institutional',
    name: 'VWAP Institutional Strategy',
    description: 'VWAP is the benchmark used by institutional traders. Buy when price pulls back to VWAP with rising volume. Sell when price extends 1.5% above VWAP.',
    category: 'Volume',
    difficulty: 'Intermediate',
    icon: '🏦',
    timeHorizon: 'Intraday–Swing',
    winRateExpected: '55–63%',
    config: {
      symbols: ['SPY'], positionSize: 80, stopLoss: 2, takeProfit: 4, maxOpenTrades: 1, timeframe: '1H',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE',  operator:'CROSSES_ABOVE', compareTo:'VWAP' },
        { id:'2', indicator:'VOLUME', operator:'GREATER_THAN',  compareTo:'VOL_MA', compareParam:20 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE', operator:'LESS_THAN', compareTo:'VWAP' },
      ]},
    },
  },
  {
    id: 'chaikin-flow',
    name: 'Chaikin Money Flow',
    description: 'CMF measures buying/selling pressure over time. Buy when CMF crosses above zero (money flowing in). Sell when CMF turns negative. Great for identifying accumulation phases.',
    category: 'Volume',
    difficulty: 'Intermediate',
    icon: '🌊',
    timeHorizon: 'Swing',
    winRateExpected: '52–60%',
    config: {
      symbols: ['MSFT'], positionSize: 70, stopLoss: 5, takeProfit: 12, maxOpenTrades: 2, timeframe: '1D',
      buyRule:  { logic: 'AND', conditions: [{ id:'1', indicator:'CMF', param:20, operator:'CROSSES_ABOVE', compareTo:'VALUE', value:0 }] },
      sellRule: { logic: 'OR',  conditions: [{ id:'2', indicator:'CMF', param:20, operator:'CROSSES_BELOW', compareTo:'VALUE', value:0 }] },
    },
  },

  // ── MULTI-FACTOR ──────────────────────────────────────────────────────────
  {
    id: 'triple-screen',
    name: 'Elder Triple Screen',
    description: 'Alexander Elder\'s masterpiece. Weekly trend (MACD), daily momentum (Stoch), hourly entry. Multi-timeframe confirmation reduces false signals dramatically.',
    category: 'Multi-Factor',
    difficulty: 'Advanced',
    icon: '🖥️',
    timeHorizon: 'Swing',
    winRateExpected: '58–68%',
    config: {
      symbols: ['AAPL'], positionSize: 70, stopLoss: 4, takeProfit: 12, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'MACD_HIST', operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
        { id:'2', indicator:'STOCH_K',   param:14, operator:'CROSSES_ABOVE', compareTo:'VALUE', value:20 },
        { id:'3', indicator:'PRICE',     operator:'GREATER_THAN', compareTo:'EMA', compareParam:13 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'MACD_HIST', operator:'LESS_THAN',    compareTo:'VALUE', value:0 },
        { id:'5', indicator:'STOCH_K',   param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:80 },
      ]},
    },
  },
  {
    id: 'four-week-rule',
    name: 'Four-Week Rule (Breakout+)',
    description: 'Richard Donchian\'s simplified rule: buy at 4-week high, sell at 4-week low. With RSI momentum filter for quality. Captures major trend changes.',
    category: 'Multi-Factor',
    difficulty: 'Intermediate',
    icon: '📅',
    timeHorizon: 'Position',
    winRateExpected: '45–52%',
    config: {
      symbols: ['SPY','QQQ'], positionSize: 50, stopLoss: 8, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'DONCHIAN_UPPER', compareParam:28 },
        { id:'2', indicator:'RSI',   param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:50 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'PRICE', operator:'LESS_THAN', compareTo:'DONCHIAN_LOWER', compareParam:14 },
      ]},
    },
  },
  {
    id: 'rsi-ma-combo',
    name: 'RSI + MA Confirmation',
    description: 'Dual confirmation: price above MA200 (bull market), RSI pulls back to 40–50 zone, then bounces. High quality entries during trend pullbacks.',
    category: 'Multi-Factor',
    difficulty: 'Beginner',
    icon: '🎪',
    timeHorizon: 'Swing',
    winRateExpected: '60–68%',
    config: {
      symbols: ['AAPL','MSFT','GOOGL'], positionSize: 33, stopLoss: 5, takeProfit: 15, maxOpenTrades: 3, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'PRICE', operator:'GREATER_THAN',  compareTo:'MA', compareParam:200 },
        { id:'2', indicator:'RSI',   param:14, operator:'LESS_THAN',     compareTo:'VALUE', value:45 },
        { id:'3', indicator:'RSI',   param:14, operator:'GREATER_THAN',  compareTo:'VALUE', value:30 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'4', indicator:'RSI',   param:14, operator:'GREATER_THAN',  compareTo:'VALUE', value:70 },
        { id:'5', indicator:'PRICE', operator:'LESS_THAN',    compareTo:'MA', compareParam:50 },
      ]},
    },
  },

  // ── STATISTICAL / QUANT ───────────────────────────────────────────────────
  {
    id: 'statistical-reversion',
    name: 'Statistical Mean Reversion (Quant)',
    description: 'Professional quantitative strategy using z-score and linear regression mean reversion. Buy at -2 sigma, take profit at mean, stop loss at -3 sigma.',
    category: 'Statistical',
    difficulty: 'Advanced',
    icon: '🔬',
    timeHorizon: 'Swing',
    winRateExpected: '65–75%',
    config: {
      symbols: ['SPY','QQQ'], positionSize: 50, stopLoss: 6, takeProfit: 4, maxOpenTrades: 2, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'ZSCORE', param:20, operator:'LESS_THAN',    compareTo:'VALUE', value:-2 },
        { id:'2', indicator:'LINEAR_REG', param:5, operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'ZSCORE', param:20, operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
      ]},
    },
  },
  {
    id: 'momentum-factor',
    name: 'Factor Momentum (12-1)',
    description: 'Academic momentum factor: 12-month return minus last month (avoids short-term reversal). Rebalance monthly. One of the most robust documented alpha sources.',
    category: 'Statistical',
    difficulty: 'Advanced',
    icon: '📚',
    timeHorizon: 'Position (monthly)',
    winRateExpected: '55–65%',
    config: {
      symbols: ['NVDA','AAPL','MSFT'], positionSize: 33, stopLoss: 15, maxOpenTrades: 3, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'ROC', param:252, operator:'GREATER_THAN', compareTo:'VALUE', value:10 },
        { id:'2', indicator:'ROC', param:21,  operator:'GREATER_THAN', compareTo:'VALUE', value:0 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'ROC', param:252, operator:'LESS_THAN',    compareTo:'VALUE', value:0 },
      ]},
    },
  },
  {
    id: 'pairs-rsi',
    name: 'Sector Rotation (RSI Relative)',
    description: 'Rotates between sector ETFs based on relative RSI strength. Hold the strongest sector (RSI highest), rotate when relative strength changes. Quantamental approach.',
    category: 'Statistical',
    difficulty: 'Advanced',
    icon: '🔃',
    timeHorizon: 'Position (monthly)',
    winRateExpected: '58–66%',
    config: {
      symbols: ['XLK','XLF','XLV','XLE'], positionSize: 25, stopLoss: 8, maxOpenTrades: 4, timeframe: '1D',
      buyRule: { logic: 'AND', conditions: [
        { id:'1', indicator:'RSI',   param:14, operator:'GREATER_THAN', compareTo:'VALUE', value:55 },
        { id:'2', indicator:'PRICE', operator:'GREATER_THAN', compareTo:'MA', compareParam:50 },
      ]},
      sellRule: { logic: 'OR', conditions: [
        { id:'3', indicator:'RSI',   param:14, operator:'LESS_THAN',    compareTo:'VALUE', value:45 },
      ]},
    },
  },
];

export const TEMPLATE_CATEGORIES = [...new Set(STRATEGY_TEMPLATES.map(t => t.category))];