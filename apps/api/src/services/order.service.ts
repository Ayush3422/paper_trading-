import { prisma } from '../lib/prisma';
import { marketDataService } from './market-data.service';
import { delCache } from '../lib/redis';
import type { PlaceOrderInput } from '@paper-trading/types';

export class OrderService {
  async placeOrder(userId: string, portfolioId: string, input: PlaceOrderInput) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });
    if (!portfolio) throw new Error('Portfolio not found');

    const symbolInfo = await prisma.symbol.findUnique({ where: { ticker: input.symbol } });

    // For market orders: execute immediately
    if (input.orderType === 'MARKET') {
      return this.executeMarketOrder(userId, portfolio, input, symbolInfo?.companyName);
    }

    // For limit/stop: create pending order
    const order = await prisma.order.create({
      data: {
        portfolioId,
        userId,
        symbol: input.symbol,
        side: input.side,
        orderType: input.orderType,
        quantity: input.quantity,
        limitPrice: input.limitPrice,
        stopPrice: input.stopPrice,
        status: 'OPEN',
        timeInForce: input.timeInForce || 'DAY',
      },
    });
    return order;
  }

  private async executeMarketOrder(userId: string, portfolio: any, input: PlaceOrderInput, companyName?: string | null) {
    const quote = await marketDataService.getQuote(input.symbol);
    const price = quote.price;
    const total = price * input.quantity;

    if (input.side === 'BUY') {
      const cash = parseFloat(portfolio.cashBalance.toString());
      if (cash < total) throw new Error(`Insufficient buying power. Need $${total.toFixed(2)}, have $${cash.toFixed(2)}`);
    } else {
      const pos = await prisma.position.findUnique({
        where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol: input.symbol } },
      });
      const held = parseFloat(pos?.quantity?.toString() || '0');
      if (held < input.quantity) throw new Error(`Insufficient shares. Have ${held}, need ${input.quantity}`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create order record
      const order = await tx.order.create({
        data: {
          portfolioId: portfolio.id, userId,
          symbol: input.symbol, side: input.side,
          orderType: 'MARKET', quantity: input.quantity,
          filledQuantity: input.quantity, executedPrice: price,
          status: 'FILLED', timeInForce: input.timeInForce || 'DAY',
          executedAt: new Date(),
        },
      });

      // 2. Update cash
      if (input.side === 'BUY') {
        await tx.portfolio.update({ where: { id: portfolio.id }, data: { cashBalance: { decrement: total } } });
      } else {
        await tx.portfolio.update({ where: { id: portfolio.id }, data: { cashBalance: { increment: total } } });
      }

      // 3. Upsert position
      let realizedPnL: number | undefined;
      const existingPos = await tx.position.findUnique({
        where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol: input.symbol } },
      });

      if (input.side === 'BUY') {
        if (existingPos) {
          const prevQty  = parseFloat(existingPos.quantity.toString());
          const prevCost = parseFloat(existingPos.totalCost.toString());
          const newQty   = prevQty + input.quantity;
          const newCost  = prevCost + total;
          await tx.position.update({
            where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol: input.symbol } },
            data: { quantity: newQty, averageCost: newCost / newQty, totalCost: newCost, currentPrice: price, marketValue: newQty * price, updatedAt: new Date() },
          });
        } else {
          await tx.position.create({
            data: {
              portfolioId: portfolio.id, symbol: input.symbol,
              companyName: companyName || input.symbol,
              quantity: input.quantity, averageCost: price, totalCost: total,
              currentPrice: price, marketValue: total,
            },
          });
        }
      } else {
        if (existingPos) {
          const prevQty  = parseFloat(existingPos.quantity.toString());
          const avgCost  = parseFloat(existingPos.averageCost.toString());
          const prevCost = parseFloat(existingPos.totalCost.toString());
          const newQty   = prevQty - input.quantity;
          realizedPnL    = (price - avgCost) * input.quantity;

          if (newQty <= 0) {
            await tx.position.delete({ where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol: input.symbol } } });
          } else {
            const costReduced = avgCost * input.quantity;
            await tx.position.update({
              where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol: input.symbol } },
              data: { quantity: newQty, totalCost: prevCost - costReduced, currentPrice: price, marketValue: newQty * price },
            });
          }
        }
      }

      // 4. Create trade record
      const costBasis = input.side === 'SELL' && existingPos
        ? parseFloat(existingPos.averageCost.toString())
        : undefined;

      await tx.trade.create({
        data: {
          orderId: order.id, portfolioId: portfolio.id, userId,
          symbol: input.symbol, side: input.side,
          quantity: input.quantity, price, totalValue: total,
          costBasis, realizedPnL,
          realizedPnLPct: costBasis ? ((price - costBasis) / costBasis) * 100 : undefined,
        },
      });

      // 5. Invalidate portfolio cache
      await delCache(`portfolio:${portfolio.id}`);

      return order;
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new Error('Order not found');
    if (!['PENDING', 'OPEN'].includes(order.status)) throw new Error('Order cannot be cancelled');

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  async getUserOrders(userId: string, portfolioId: string, status?: string, page = 1, limit = 20) {
    const where: any = { userId, portfolioId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.order.count({ where }),
    ]);

    return { orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}

export const orderService = new OrderService();
