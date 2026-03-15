import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth.plugin';
import { prisma } from '../../lib/prisma';

export async function socialRoutes(app: FastifyInstance) {
  const preHandler = [authenticate];

  app.get('/leaderboard', { preHandler }, async (req, reply) => {
    const { limit = '50' } = req.query as { limit?: string };

    const portfolios = await prisma.portfolio.findMany({
      where: { isDefault: true },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { totalValue: 'desc' },
      take: parseInt(limit),
    });

    const entries = portfolios.map((p, i) => {
      const totalValue = parseFloat(p.totalValue.toString());
      const startingCapital = parseFloat(p.startingCapital.toString());
      const returnPct = ((totalValue - startingCapital) / startingCapital) * 100;
      return {
        rank: i + 1,
        userId: p.user.id,
        username: p.user.username,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        totalValue,
        totalReturnPct: parseFloat(returnPct.toFixed(2)),
        startingCapital,
      };
    }).sort((a, b) => b.totalReturnPct - a.totalReturnPct)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return reply.send({ data: entries });
  });

  app.get('/notifications', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return reply.send({ data: notifications });
  });

  app.patch('/notifications/:id/read', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    const { id } = req.params as { id: string };
    await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true, readAt: new Date() } });
    return reply.send({ data: { message: 'Marked as read' } });
  });

  app.patch('/notifications/read-all', { preHandler }, async (req, reply) => {
    const user = (req as any).currentUser;
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return reply.send({ data: { message: 'All notifications marked as read' } });
  });
}
