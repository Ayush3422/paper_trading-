import { FastifyInstance } from 'fastify';
import { authenticate } from '../plugins/auth.plugin';
import { prisma } from '../lib/prisma';
import { fetchLiveQuotes } from '../services/live-data.service';

export async function algoPositionsRoutes(app: FastifyInstance) {
  const pre = [authenticate];

  // GET /api/v1/algo-positions
  // Returns all open positions placed by algo strategies, enriched with live prices
  app.get('/', { preHandler: pre }, async (req, reply) => {
    const userId = (req as any).user.id;

    try {
      // Get all open algo positions (notes contain [ALGO])
      const algoOrders = await prisma.order.findMany({
        where: {
          userId,
          side:   'BUY',
          status: 'FILLED',
          notes:  { contains: '[ALGO]' },
        },
        orderBy: { executedAt: 'desc' },
      });

      // Get all open positions via user's portfolios
      const userPortfolios = await prisma.portfolio.findMany({
        where: { userId },
        select: { id: true },
      });
      const portfolioIds = userPortfolios.map(p => p.id);

      const openPositions = await prisma.position.findMany({
        where: { portfolioId: { in: portfolioIds } },
      });

      // Match open positions to algo orders
      const algoSymbols = [...new Set(algoOrders.map(o => o.symbol))];
      const algoOpenPositions = openPositions.filter(p => algoSymbols.includes(p.symbol));

      if (!algoOpenPositions.length) {
        return reply.send({ data: { positions: [], summary: emptySummary() } });
      }

      // Fetch live prices for all symbols
      const symbols  = algoOpenPositions.map(p => p.symbol);
      const quotes   = await fetchLiveQuotes(symbols);

      // Enrich each position
      const enriched = algoOpenPositions.map(pos => {
        const quote      = quotes[pos.symbol];
        const livePrice  = quote?.price ?? parseFloat((pos.currentPrice as any).toString());
        const avgCost    = parseFloat((pos.averageCost as any).toString());
        const costBasis  = parseFloat((pos.totalCost as any).toString());
        const qty        = parseFloat((pos.quantity as any).toString());
        const marketVal  = qty * livePrice;
        const pnl        = marketVal - costBasis;
        const pnlPct     = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

        // Find the strategy that placed this order (from signal logs)
        const matchingOrder = algoOrders.find(o => o.symbol === pos.symbol);
        const strategyNote  = matchingOrder?.notes || '';
        const strategyName  = strategyNote.replace('[ALGO]', '').trim().split('—')[0]?.trim() || 'Algo Strategy';

        // Days held
        const openedAt  = pos.openedAt ? new Date(pos.openedAt) : new Date();
        const daysHeld  = Math.floor((Date.now() - openedAt.getTime()) / 86400000);

        // Risk/reward if stop/take profit known (not stored on Order in current schema)
        const stopLoss:   number | null = null;
        const takeProfit: number | null = null;

        return {
          id:           pos.id,
          symbol:       pos.symbol,
          quantity:     qty,
          avgCost:      parseFloat(avgCost.toFixed(2)),
          costBasis:    parseFloat(costBasis.toFixed(2)),
          livePrice:    parseFloat(livePrice.toFixed(2)),
          marketValue:  parseFloat(marketVal.toFixed(2)),
          pnl:          parseFloat(pnl.toFixed(2)),
          pnlPct:       parseFloat(pnlPct.toFixed(2)),
          change1d:     quote?.changePct || 0,
          change1dAmt:  quote ? parseFloat((quote.change * qty).toFixed(2)) : 0,
          volume:       quote?.volume || 0,
          dayHigh:      quote?.high || livePrice,
          dayLow:       quote?.low  || livePrice,
          openPrice:    quote?.open || avgCost,
          daysHeld,
          openedAt:     pos.openedAt,
          strategyName,
          orderId:      matchingOrder?.id,
          stopLoss,
          takeProfit,
          weight:       0, // calculated below
        };
      });

      // Calculate portfolio weights
      const totalMV = enriched.reduce((s, p) => s + p.marketValue, 0);
      enriched.forEach(p => { p.weight = totalMV > 0 ? parseFloat(((p.marketValue / totalMV) * 100).toFixed(1)) : 0; });

      // Sort by market value desc
      enriched.sort((a, b) => b.marketValue - a.marketValue);

      // Summary stats
      const totalPnL    = enriched.reduce((s, p) => s + p.pnl, 0);
      const totalCost   = enriched.reduce((s, p) => s + p.costBasis, 0);
      const totalMktVal = enriched.reduce((s, p) => s + p.marketValue, 0);
      const winners     = enriched.filter(p => p.pnl > 0).length;
      const losers      = enriched.filter(p => p.pnl < 0).length;
      const best        = enriched.reduce((b, p) => p.pnlPct > b.pnlPct ? p : b, enriched[0]);
      const worst       = enriched.reduce((w, p) => p.pnlPct < w.pnlPct ? p : w, enriched[0]);
      const todayPnL    = enriched.reduce((s, p) => s + p.change1dAmt, 0);

      // Recent algo signals (last 10)
      let recentSignals: any[] = [];
      try {
        const strategyIds = await prisma.strategy.findMany({
          where:  { userId },
          select: { id: true },
        });
        const ids = strategyIds.map(s => s.id);
        if (ids.length) {
          recentSignals = await prisma.strategySignalLog.findMany({
            where:   { strategyId: { in: ids }, signal: { in: ['BUY', 'SELL'] } },
            orderBy: { timestamp: 'desc' },
            take:    10,
          });
        }
      } catch { /* table may not exist yet */ }

      return reply.send({
        data: {
          positions: enriched,
          summary: {
            totalPositions: enriched.length,
            totalCostBasis: parseFloat(totalCost.toFixed(2)),
            totalMarketValue: parseFloat(totalMktVal.toFixed(2)),
            totalPnL:      parseFloat(totalPnL.toFixed(2)),
            totalPnLPct:   totalCost > 0 ? parseFloat(((totalPnL / totalCost) * 100).toFixed(2)) : 0,
            todayPnL:      parseFloat(todayPnL.toFixed(2)),
            winners, losers,
            winRate:       enriched.length > 0 ? parseFloat(((winners / enriched.length) * 100).toFixed(1)) : 0,
            bestPosition:  best  ? { symbol: best.symbol,  pnlPct: best.pnlPct   } : null,
            worstPosition: worst ? { symbol: worst.symbol, pnlPct: worst.pnlPct  } : null,
            avgHoldDays:   parseFloat((enriched.reduce((s, p) => s + p.daysHeld, 0) / (enriched.length || 1)).toFixed(1)),
          },
          recentSignals,
        },
      });
    } catch (e: any) {
      console.error('[AlgoPositions]', e.message);
      return reply.status(500).send({ message: e.message });
    }
  });
}

function emptySummary() {
  return {
    totalPositions:0, totalCostBasis:0, totalMarketValue:0,
    totalPnL:0, totalPnLPct:0, todayPnL:0,
    winners:0, losers:0, winRate:0,
    bestPosition:null, worstPosition:null, avgHoldDays:0,
  };
}