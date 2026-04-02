// ── Inline PlaceOrderInput (replaces @paper-trading/types import) ────────────
export interface PlaceOrderInput {
  symbol:      string;
  side:        'BUY' | 'SELL';
  orderType:   'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  quantity:    number;
  limitPrice?: number;
  stopPrice?:  number;
  timeInForce?: 'DAY' | 'GTC' | 'IOC';
}

import { PrismaClient } from '@prisma/client';
import { marketDataService } from './market-data.service';

const prisma = new PrismaClient();

export class OrderService {
  async placeOrder(userId: string, portfolioId: string, input: PlaceOrderInput) {
    const { symbol, side, orderType, quantity, limitPrice, stopPrice, timeInForce = 'DAY' } = input;

    // Get current price
    const quote = await marketDataService.getQuote(symbol);
    const marketPrice = quote?.price || 0;
    if (!marketPrice) throw new Error(`Could not get price for ${symbol}`);

    // Determine fill price
    let fillPrice = marketPrice;
    if (orderType === 'LIMIT' && limitPrice) fillPrice = limitPrice;
    if (orderType === 'STOP'  && stopPrice)  fillPrice = stopPrice;

    const total = fillPrice * quantity;

    // Get portfolio
    const portfolio = await prisma.portfolio.findFirst({ where: { id: portfolioId, userId } });
    if (!portfolio) throw new Error('Portfolio not found');

    if (side === 'BUY') {
      if (Number(portfolio.cashBalance) < total) throw new Error('Insufficient balance');

      // Create order
      const order = await prisma.order.create({
        data: {
          portfolioId, userId, symbol, side, orderType: orderType, status: 'FILLED',
          quantity, limitPrice, stopPrice, executedPrice: fillPrice,
          filledQuantity: quantity, commission: 0,
          timeInForce: timeInForce as any, executedAt: new Date()
        },
      });

      // Deduct balance
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data:  { cashBalance: { decrement: total } },
      });

      // Update position
      const existing = await prisma.position.findFirst({ where: { portfolioId, symbol, side: 'LONG' } });
      if (existing) {
        const newQty  = Number(existing.quantity) + quantity;
        const newCost = Number(existing.totalCost) + total;
        await prisma.position.update({
          where: { id: existing.id },
          data:  { quantity: newQty, totalCost: newCost, averageCost: newCost / newQty, currentPrice: fillPrice, updatedAt: new Date() },
        });
      } else {
        await prisma.position.create({
          data: { portfolioId, symbol, quantity, averageCost: fillPrice, totalCost: total, currentPrice: fillPrice, side: 'LONG', openedAt: new Date() },
        });
      }

      return order;

    } else {
      // SELL
      const position = await prisma.position.findFirst({ where: { portfolioId, symbol, side: 'LONG' } });
      if (!position || Number(position.quantity) < quantity) throw new Error('Insufficient position');

      const proceeds = fillPrice * quantity;
      const costBasis = Number(position.averageCost) * quantity;
      const pnl = proceeds - costBasis;

      const order = await prisma.order.create({
        data: {
          portfolioId, userId, symbol, side, orderType: orderType, status: 'FILLED',
          quantity, limitPrice, stopPrice, executedPrice: fillPrice,
          filledQuantity: quantity, commission: 0,
          timeInForce: timeInForce as any, executedAt: new Date()
        },
      });

      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data:  { cashBalance: { increment: proceeds } },
      });

      const newQty = Number(position.quantity) - quantity;
      if (newQty === 0) {
        await prisma.position.delete({
          where: { id: position.id }
        });
      } else {
        const newTotalCost = Number(position.averageCost) * newQty;
        await prisma.position.update({
          where: { id: position.id },
          data:  { quantity: newQty, totalCost: newTotalCost, currentPrice: fillPrice, updatedAt: new Date() },
        });
      }

      return order;
    }
  }

  async getUserOrders(userId: string, portfolioId: string, status?: string, page = 1, limit = 20) {
    const where: any = { portfolioId, userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new Error('Order not found');
    if (order.status === 'FILLED') throw new Error('Cannot cancel filled order');
    return prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
  }
}

export const orderService = new OrderService();
