// ── USER ────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'TRADER' | 'ADMIN';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

// ── PORTFOLIO ───────────────────────────────────────────────
export interface Portfolio {
  id: string;
  name: string;
  cashBalance: number;
  startingCapital: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPct: number;
  dayPnL: number;
  dayPnLPct: number;
  positions: Position[];
  createdAt: string;
}

export interface Position {
  id: string;
  symbol: string;
  companyName?: string;
  quantity: number;
  averageCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  side: 'LONG' | 'SHORT';
  openedAt: string;
}

// ── ORDERS ──────────────────────────────────────────────────
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderStatus = 'PENDING' | 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
export type TimeInForce = 'DAY' | 'GTC' | 'IOC';

export interface Order {
  id: string;
  portfolioId: string;
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  filledQuantity: number;
  limitPrice?: number;
  stopPrice?: number;
  executedPrice?: number;
  status: OrderStatus;
  timeInForce: TimeInForce;
  commission: number;
  rejectionReason?: string;
  createdAt: string;
  executedAt?: string;
  cancelledAt?: string;
}

export interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  orderType: OrderType;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: TimeInForce;
}

// ── MARKET DATA ─────────────────────────────────────────────
export interface Quote {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  previousClose: number;
  timestamp: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface MarketStatus {
  open: boolean;
  session: 'pre-market' | 'regular' | 'after-hours' | 'closed';
  nextOpen?: string;
  nextClose?: string;
}

// ── WATCHLIST ───────────────────────────────────────────────
export interface Watchlist {
  id: string;
  name: string;
  color?: string;
  symbols: WatchlistSymbol[];
  createdAt: string;
}

export interface WatchlistSymbol {
  symbol: string;
  companyName?: string;
  addedAt: string;
}

// ── ALERTS ──────────────────────────────────────────────────
export interface PriceAlert {
  id: string;
  symbol: string;
  alertType: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE';
  targetPrice: number;
  note?: string;
  isActive: boolean;
  triggeredAt?: string;
  createdAt: string;
}

// ── TRADES ──────────────────────────────────────────────────
export interface Trade {
  id: string;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  totalValue: number;
  realizedPnL?: number;
  realizedPnLPct?: number;
  executedAt: string;
}

// ── LEADERBOARD ─────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  totalReturnPct: number;
  totalValue: number;
  tradeCount: number;
  winRate?: number;
}

// ── WEBSOCKET EVENTS ────────────────────────────────────────
export interface PriceTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface PortfolioUpdate {
  totalValue: number;
  cashBalance: number;
  dayPnL: number;
  dayPnLPct: number;
  positions: Position[];
}

// ── API RESPONSES ───────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
