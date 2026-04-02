import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../plugins/auth.plugin';
import { orderService } from '../../services/order.service';
import type { PlaceOrderInput } from '@paper-trading/types';

const prisma = new PrismaClient();

const PlaceOrderSchema = z.object({
  symbol:      z.string().min(1).max(10).toUpperCase(),
  side:        z.enum(['BUY', 'SELL']),
  orderType:   z.enum(['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT']).default('MARKET'),
  quantity:    z.number().int().positive(),
  limitPrice:  z.number().positive().optional(),
  stopPrice:   z.number().positive().optional(),
  timeInForce: z.enum(['DAY', 'GTC', 'IOC']).default('DAY'),
}).refine(d => !['LIMIT','STOP_LIMIT'].includes(d.orderType) || d.limitPrice, { message: 'Limit orders require limitPrice' })
  .refine(d => !['STOP','STOP_LIMIT'].includes(d.orderType) || d.stopPrice,  { message: 'Stop orders require stopPrice'  });

export async function orderRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  // POST /api/v1/orders
  app.post('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const body = PlaceOrderSchema.parse(req.body) as PlaceOrderInput;

    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: user.id, isDefault: true },
    });
    if (!portfolio) return reply.status(404).send({ error: 'Portfolio not found' });

    try {
      const order = await orderService.placeOrder(user.id, portfolio.id, body);
      return reply.status(201).send({ data: order });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Order Failed', message: err.message });
    }
  });

  // GET /api/v1/orders
  app.get('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { status, page = '1', limit = '20' } = req.query as any;

    const portfolio = await prisma.portfolio.findFirst({ where: { userId: user.id, isDefault: true } });
    if (!portfolio) return reply.status(404).send({ error: 'Portfolio not found' });

    const result = await orderService.getUserOrders(user.id, portfolio.id, status, parseInt(page), parseInt(limit));
    return reply.send({ data: result.orders, meta: result.meta });
  });

  // DELETE /api/v1/orders/:id
  app.delete('/:id', { preHandler }, async (req, reply) => {
    const { id } = req.params as any;
    const user   = (req as any).currentUser;
    try {
      const order = await orderService.cancelOrder(id, user.id);
      return reply.send({ data: order });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
