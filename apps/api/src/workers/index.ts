import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../lib/prisma';
import { marketDataService } from '../services/market-data.service';
import { getMarketStatus } from '../lib/market-hours';

const connection = new IORedis(process.env.REDIS_URL || 'redis://:redispass@localhost:6379', {
  maxRetriesPerRequest: null,
});

// ── Order Processor ──────────────────────────────────────
export const orderQueue = new Queue('orders', { connection: connection as any });

const orderWorker = new Worker('orders', async (job) => {
  if (job.name !== 'check-pending') return;

  const market = getMarketStatus();
  if (!market.open) return;

  const openOrders = await prisma.order.findMany({
    where: { status: 'OPEN', orderType: { in: ['LIMIT','STOP','STOP_LIMIT'] } },
    include: { portfolio: true },
  });

  for (const order of openOrders) {
    try {
      const quote = await marketDataService.getQuote(order.symbol);
      const price = quote.price;
      const limit = order.limitPrice ? parseFloat(order.limitPrice.toString()) : null;
      const stop  = order.stopPrice  ? parseFloat(order.stopPrice.toString())  : null;
      const qty   = parseFloat(order.quantity.toString());

      let shouldExecute = false;
      if (order.orderType === 'LIMIT') {
        shouldExecute = order.side === 'BUY' ? price <= (limit!) : price >= (limit!);
      } else if (order.orderType === 'STOP') {
        shouldExecute = order.side === 'BUY' ? price >= (stop!) : price <= (stop!);
      }

      if (shouldExecute) {
        const total = price * qty;
        await prisma.$transaction(async (tx) => {
          await tx.order.update({ where: { id: order.id }, data: { status: 'FILLED', executedPrice: price, executedAt: new Date(), filledQuantity: qty } });
          if (order.side === 'BUY') {
            await tx.portfolio.update({ where: { id: order.portfolioId }, data: { cashBalance: { decrement: total } } });
            await tx.position.upsert({
              where: { portfolioId_symbol: { portfolioId: order.portfolioId, symbol: order.symbol } },
              create: { portfolioId: order.portfolioId, symbol: order.symbol, quantity: qty, averageCost: price, totalCost: total, currentPrice: price, marketValue: total },
              update: { quantity: { increment: qty }, totalCost: { increment: total }, currentPrice: price, marketValue: { increment: total } },
            });
          } else {
            await tx.portfolio.update({ where: { id: order.portfolioId }, data: { cashBalance: { increment: total } } });
          }
          await tx.trade.create({ data: { orderId: order.id, portfolioId: order.portfolioId, userId: order.userId, symbol: order.symbol, side: order.side, quantity: qty, price, totalValue: total } });
          await tx.notification.create({ data: { userId: order.userId, type: 'ORDER_FILLED', title: 'Order Filled', body: `Your ${order.side} order for ${qty} ${order.symbol} @ $${price.toFixed(2)} was filled.` } });
        });
        console.log(`✅ Limit order filled: ${order.symbol} ${order.side} ${qty}@${price}`);
      }
    } catch (err: any) {
      console.error(`Order check failed for ${order.id}:`, err.message);
    }
  }
}, { connection: connection as any });

// Schedule order checks every 2 seconds
setInterval(async () => {
  await orderQueue.add('check-pending', {}, { removeOnComplete: true, removeOnFail: 50 });
}, 2000);

// ── EOD Snapshot Worker ──────────────────────────────────
import cron from 'node-cron';

cron.schedule('0 16 * * 1-5', async () => {
  console.log('📸 Taking daily portfolio snapshots...');
  const portfolios = await prisma.portfolio.findMany({ include: { positions: true } });

  for (const portfolio of portfolios) {
    const cash = parseFloat(portfolio.cashBalance.toString());
    const starting = parseFloat(portfolio.startingCapital.toString());
    let positionsValue = 0;

    for (const pos of portfolio.positions) {
      const quote = await marketDataService.getQuote(pos.symbol).catch(() => null);
      if (quote) positionsValue += parseFloat(pos.quantity.toString()) * quote.price;
    }

    const totalValue = cash + positionsValue;
    const totalReturn = totalValue - starting;
    const today = new Date(); today.setHours(0,0,0,0);

    await prisma.portfolioSnapshot.upsert({
      where: { portfolioId_snapshotDate: { portfolioId: portfolio.id, snapshotDate: today } },
      create: { portfolioId: portfolio.id, snapshotDate: today, cashBalance: cash, positionsValue, totalValue, dayReturn: 0, dayReturnPct: 0, totalReturn, totalReturnPct: (totalReturn / starting) * 100 },
      update: { totalValue, positionsValue, totalReturn, totalReturnPct: (totalReturn / starting) * 100 },
    });
  }
  console.log('✅ Portfolio snapshots done');
}, { timezone: 'America/New_York' });

orderWorker.on('completed', job => console.log(`Worker job ${job.id} done`));
orderWorker.on('failed', (job, err) => console.error(`Worker job ${job?.id} failed:`, err.message));

console.log('🔧 Background workers started');
