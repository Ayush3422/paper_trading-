import { FastifyInstance } from 'fastify';
import { marketDataService } from '../../services/market-data.service';
import { authenticate } from '../../plugins/auth.plugin';

export async function marketRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  // GET /api/v1/market/status
  app.get('/status', async () => {
    return { data: marketDataService.getMarketStatus() };
  });

  // GET /api/v1/market/sectors
  app.get('/sectors', async () => {
    return { data: marketDataService.getSectors() };
  });

  // GET /api/v1/market/indices
  app.get('/indices', { preHandler }, async (_req, reply) => {
    const data = await marketDataService.getIndices();
    return reply.send({ data });
  });

  // GET /api/v1/market/movers
  app.get('/movers', { preHandler }, async (_req, reply) => {
    const data = await marketDataService.getMovers();
    return reply.send({ data });
  });

  // GET /api/v1/market/screener
  app.get('/screener', { preHandler }, async (req, reply) => {
    const {
      sector, minPrice, maxPrice, minChangePct, maxChangePct,
      sortBy, sortOrder, search,
    } = req.query as any;

    const data = await marketDataService.getScreener({
      sector,
      minPrice:     minPrice     !== undefined ? parseFloat(minPrice)     : undefined,
      maxPrice:     maxPrice     !== undefined ? parseFloat(maxPrice)     : undefined,
      minChangePct: minChangePct !== undefined ? parseFloat(minChangePct) : undefined,
      maxChangePct: maxChangePct !== undefined ? parseFloat(maxChangePct) : undefined,
      sortBy:       sortBy    || 'mktCap',
      sortOrder:    sortOrder || 'desc',
      search,
    });
    return reply.send({ data });
  });

  // GET /api/v1/market/news
  app.get('/news', { preHandler }, async (req, reply) => {
    const { symbol } = req.query as { symbol?: string };
    const data = await marketDataService.getNews(symbol);
    return reply.send({ data });
  });

  // GET /api/v1/market/quote/:symbol
  app.get('/quote/:symbol', { preHandler }, async (req, reply) => {
    const { symbol } = req.params as { symbol: string };
    const data = await marketDataService.getQuote(symbol.toUpperCase());
    return reply.send({ data });
  });

  // GET /api/v1/market/quotes  (bulk)
  app.get('/quotes', { preHandler }, async (req, reply) => {
    const { symbols } = req.query as { symbols: string };
    const list  = (symbols || '').split(',').filter(Boolean).slice(0, 20);
    const data  = await Promise.all(list.map(s => marketDataService.getQuote(s.toUpperCase())));
    return reply.send({ data });
  });

  // GET /api/v1/market/ohlcv/:symbol
  app.get('/ohlcv/:symbol', { preHandler }, async (req, reply) => {
    const { symbol }              = req.params as { symbol: string };
    const { interval = '1D', from, to } = req.query as any;
    const toDate   = to   || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
    const data = await marketDataService.getOHLCV(symbol.toUpperCase(), interval, fromDate, toDate);
    return reply.send({ data });
  });

  // GET /api/v1/market/search
  app.get('/search', { preHandler }, async (req, reply) => {
    const { q } = req.query as { q: string };
    if (!q || q.length < 1) return reply.send({ data: [] });
    const data = await marketDataService.searchSymbols(q);
    return reply.send({ data });
  });
}