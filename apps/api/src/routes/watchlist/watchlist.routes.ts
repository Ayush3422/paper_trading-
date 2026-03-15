import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate } from '../../plugins/auth.plugin';
import { prisma } from '../../lib/prisma';

export async function watchlistRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  app.get('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const lists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: { symbols: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    return reply.send({ data: lists });
  });

  app.post('/', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { name, color } = z.object({ name: z.string().min(1).max(50), color: z.string().optional() }).parse(req.body);
    const list = await prisma.watchlist.create({ data: { userId: user.id, name, color }, include: { symbols: true } });
    return reply.status(201).send({ data: list });
  });

  app.delete('/:id', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id } = req.params as { id: string };
    await prisma.watchlist.deleteMany({ where: { id, userId: user.id } });
    return reply.send({ data: { message: 'Watchlist deleted' } });
  });

  app.post('/:id/symbols', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id } = req.params as { id: string };
    const { symbol, companyName } = z.object({ symbol: z.string().min(1).max(10), companyName: z.string().optional() }).parse(req.body);

    const list = await prisma.watchlist.findFirst({ where: { id, userId: user.id } });
    if (!list) return reply.status(404).send({ error: 'Watchlist not found' });

    const entry = await prisma.watchlistSymbol.upsert({
      where: { watchlistId_symbol: { watchlistId: id, symbol: symbol.toUpperCase() } },
      update: {},
      create: { watchlistId: id, symbol: symbol.toUpperCase(), companyName },
    });
    return reply.status(201).send({ data: entry });
  });

  app.delete('/:id/symbols/:symbol', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id, symbol } = req.params as { id: string; symbol: string };
    const list = await prisma.watchlist.findFirst({ where: { id, userId: user.id } });
    if (!list) return reply.status(404).send({ error: 'Watchlist not found' });
    await prisma.watchlistSymbol.deleteMany({ where: { watchlistId: id, symbol: symbol.toUpperCase() } });
    return reply.send({ data: { message: 'Symbol removed' } });
  });
}
