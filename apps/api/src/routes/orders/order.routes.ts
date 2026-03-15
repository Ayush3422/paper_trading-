import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth.plugin';
import { orderService } from '../../services/order.service';
import { prisma } from '../../lib/prisma';

const PlaceOrderSchema = z.object({
  symbol:      z.string().min(1).max(10).transform(s => s.toUpperCase()),
  side:        z.enum(['BUY','SELL']),
  orderType:   z.enum(['MARKET','LIMIT','STOP','STOP_LIMIT']),
  quantity:    z.number().positive().max(100000),
  limitPrice:  z.number().positive().optional(),
  stopPrice:   z.number().positive().optional(),
  timeInForce: z.enum(['DAY','GTC','IOC']).default('DAY'),
}).refine(d => d.orderType !== 'LIMIT' || d.limitPrice, { message: 'Limit orders require limitPrice' })
  .refine(d => !['STOP','STOP_LIMIT'].includes(d.orderType) || d.stopPrice, { message: 'Stop orders require stopPrice' });

export async function orderRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  // POST /api/v1/orders
  app.post('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const body = PlaceOrderSchema.parse(req.body);

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

  // GET /api/v1/orders/:id
  app.get('/:id', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id } = req.params as { id: string };
    const order = await prisma.order.findFirst({ where: { id, userId: user.id } });
    if (!order) return reply.status(404).send({ error: 'Order not found' });
    return reply.send({ data: order });
  });

  // DELETE /api/v1/orders/:id
  app.delete('/:id', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id } = req.params as { id: string };
    try {
      const order = await orderService.cancelOrder(user.id, id);
      return reply.send({ data: order });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Cancel Failed', message: err.message });
    }
  });
}
