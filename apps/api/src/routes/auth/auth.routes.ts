import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../plugins/auth.plugin';

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/register
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '1h' } },
  }, async (req, reply) => {
    const body = RegisterSchema.parse(req.body);

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { username: body.username }] },
    });
    if (exists) {
      const field = exists.email === body.email ? 'email' : 'username';
      return reply.status(409).send({ error: 'Conflict', message: `${field} already taken` });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const capital = parseFloat(process.env.STARTING_CAPITAL || '100000');

    const user = await prisma.user.create({
      data: {
        email: body.email,
        username: body.username,
        displayName: body.displayName || body.username,
        passwordHash,
        preferences: { create: {} },
        portfolios: {
          create: {
            name: 'My Portfolio',
            cashBalance: capital,
            startingCapital: capital,
            totalValue: capital,
          },
        },
      },
      select: { id: true, email: true, username: true, displayName: true, role: true },
    });

    const accessToken = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ id: user.id, type: 'refresh' }, { expiresIn: '7d' });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    reply.setCookie?.('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth', maxAge: 7 * 24 * 60 * 60 });

    return reply.status(201).send({ data: { user, accessToken, expiresIn: 900 } });
  });

  // POST /api/v1/auth/login
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '15m' } },
  }, async (req, reply) => {
    const body = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const accessToken = app.jwt.sign({ id: user.id, email: user.email }, { expiresIn: '15m' });
    const refreshToken = app.jwt.sign({ id: user.id, type: 'refresh' }, { expiresIn: '7d' });

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    if (reply.setCookie) {
      reply.setCookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth', maxAge: 7 * 24 * 60 * 60 });
    }

    return reply.send({
      data: {
        user: { id: user.id, email: user.email, username: user.username, displayName: user.displayName, role: user.role },
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    });
  });

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken: string };
    if (!refreshToken) return reply.status(400).send({ error: 'Bad Request', message: 'Refresh token required' });

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid refresh token' });
    }

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

    const newAccessToken = app.jwt.sign({ id: stored.user.id, email: stored.user.email }, { expiresIn: '15m' });
    const newRefreshToken = app.jwt.sign({ id: stored.user.id, type: 'refresh' }, { expiresIn: '7d' });

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: stored.user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    return reply.send({ data: { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresIn: 900 } });
  });

  // GET /api/v1/auth/me
  app.get('/me', { preHandler: authenticate }, async (req, reply) => {
    const user = (req as any).currentUser;
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, username: true, displayName: true, avatarUrl: true, role: true, createdAt: true, preferences: true },
    });
    return reply.send({ data: full });
  });

  // POST /api/v1/auth/logout
  app.post('/logout', { preHandler: authenticate }, async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.refreshToken.updateMany({ where: { token: refreshToken }, data: { revokedAt: new Date() } });
    }
    return reply.send({ data: { message: 'Logged out successfully' } });
  });
}
