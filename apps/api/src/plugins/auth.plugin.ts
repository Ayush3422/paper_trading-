import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    const payload = req.user as { id: string; email: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, username: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid token' });
    }
    (req as any).currentUser = user;
  } catch {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Token required' });
  }
}
