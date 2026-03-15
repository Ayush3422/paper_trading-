import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth.plugin';
import { prisma } from '../../lib/prisma';
import { marketDataService } from '../../services/market-data.service';
import { getCache, setCache, CACHE_TTL } from '../../lib/redis';

export async function portfolioRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  // GET /api/v1/portfolio
  app.get('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const cacheKey = `portfolio:user:${user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return reply.send({ data: cached });

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id, isDefault: true },
      include: { positions: true },
    });
    if (!portfolio) return reply.status(404).send({ error: 'Portfolio not found' });

    // Fetch live prices for all positions
    const positions = portfolio.positions;
    let positionsValue = 0;
    const enriched = await Promise.all(
      positions.map(async (pos) => {
        const quote = await marketDataService.getQuote(pos.symbol);
        const qty = parseFloat(pos.quantity.toString());
        const avgCost = parseFloat(pos.averageCost.toString());
        const marketValue = qty * quote.price;
        const unrealizedPnL = (quote.price - avgCost) * qty;
        const unrealizedPnLPct = ((quote.price - avgCost) / avgCost) * 100;
        positionsValue += marketValue;
        return {
          ...pos,
          quantity: qty,
          averageCost: avgCost,
          totalCost: parseFloat(pos.totalCost.toString()),
          currentPrice: quote.price,
          marketValue,
          unrealizedPnL,
          unrealizedPnLPct,
          change: quote.change,
          changePercent: quote.changePercent,
        };
      })
    );

    const cashBalance = parseFloat(portfolio.cashBalance.toString());
    const startingCapital = parseFloat(portfolio.startingCapital.toString());
    const totalValue = cashBalance + positionsValue;
    const totalPnL = totalValue - startingCapital;
    const totalPnLPct = (totalPnL / startingCapital) * 100;

    const result = {
      id: portfolio.id,
      name: portfolio.name,
      cashBalance,
      startingCapital,
      totalValue,
      positionsValue,
      totalPnL,
      totalPnLPct,
      dayPnL: 0,
      dayPnLPct: 0,
      positions: enriched,
    };

    await setCache(cacheKey, result, CACHE_TTL.PORTFOLIO);
    return reply.send({ data: result });
  });

  // GET /api/v1/portfolio/trades
  app.get('/trades', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { page = '1', limit = '20', symbol } = req.query as any;
    const where: any = { userId: user.id };
    if (symbol) where.symbol = symbol.toUpperCase();

    const [trades, total] = await Promise.all([
      prisma.trade.findMany({ where, orderBy: { executedAt: 'desc' }, skip: (parseInt(page) - 1) * parseInt(limit), take: parseInt(limit) }),
      prisma.trade.count({ where }),
    ]);

    return reply.send({ data: trades, meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
  });

  // GET /api/v1/portfolio/analytics
  app.get('/analytics', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const trades = await prisma.trade.findMany({
      where: { userId: user.id, side: 'SELL', realizedPnL: { not: null } },
    });

    const winning = trades.filter(t => parseFloat(t.realizedPnL?.toString() || '0') > 0);
    const losing  = trades.filter(t => parseFloat(t.realizedPnL?.toString() || '0') < 0);
    const winRate  = trades.length ? (winning.length / trades.length) * 100 : 0;
    const avgWin   = winning.length ? winning.reduce((s, t) => s + parseFloat(t.realizedPnL?.toString() || '0'), 0) / winning.length : 0;
    const avgLoss  = losing.length  ? losing.reduce((s, t)  => s + parseFloat(t.realizedPnL?.toString() || '0'), 0) / losing.length  : 0;

    return reply.send({
      data: {
        tradeCount: trades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        avgWin:  parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        totalRealizedPnL: trades.reduce((s, t) => s + parseFloat(t.realizedPnL?.toString() || '0'), 0),
        profitFactor: Math.abs(avgLoss) > 0 ? Math.abs(avgWin / avgLoss) : 0,
      },
    });
  });

  // GET /api/v1/portfolio/history
  app.get('/history', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const portfolio = await prisma.portfolio.findFirst({ where: { userId: user.id, isDefault: true } });
    if (!portfolio) return reply.status(404).send({ error: 'Portfolio not found' });

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { snapshotDate: 'asc' },
    });

    return reply.send({ data: snapshots });
  });

  // POST /api/v1/portfolio/reset
  app.post('/reset', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const capital = parseFloat(process.env.STARTING_CAPITAL || '100000');

    await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findFirst({ where: { userId: user.id, isDefault: true } });
      if (!portfolio) throw new Error('Portfolio not found');
      await tx.position.deleteMany({ where: { portfolioId: portfolio.id } });
      await tx.order.updateMany({ where: { portfolioId: portfolio.id, status: { in: ['OPEN','PENDING'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: { cashBalance: capital, totalValue: capital, totalPnL: 0, realizedPnL: 0, unrealizedPnL: 0, resetCount: { increment: 1 } },
      });
    });

    return reply.send({ data: { message: 'Portfolio reset successfully', newBalance: capital } });
  });
}
