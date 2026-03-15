import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { Server } from 'socket.io';
import http from 'http';
import { authRoutes } from './routes/auth/auth.routes';
import { marketRoutes } from './routes/market/market.routes';
import { orderRoutes } from './routes/orders/order.routes';
import { portfolioRoutes } from './routes/portfolio/portfolio.routes';
import { watchlistRoutes } from './routes/watchlist/watchlist.routes';
import { socialRoutes } from './routes/social/social.routes';
import { algoRoutes } from './routes/algo/algo.routes';
import { algoPositionsRoutes } from './routes/algo-positions.routes';
import { setupWebSocket } from './websocket/gateway';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { startAlgoWorker } from './workers/algo.worker';

const app = Fastify({
  logger: {
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

async function bootstrap() {
  // Security
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  });
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  // Auth
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  });
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'fallback-cookie-secret-change-in-production',
    hook: 'onRequest',
  });
  
  // Docs
  await app.register(swagger, {
    openapi: {
      info: { title: 'Paper Trading API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Routes
  await app.register(authRoutes,      { prefix: '/api/v1/auth' });
  await app.register(marketRoutes,    { prefix: '/api/v1/market' });
  await app.register(orderRoutes,     { prefix: '/api/v1/orders' });
  await app.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
  await app.register(watchlistRoutes, { prefix: '/api/v1/watchlists' });
  await app.register(socialRoutes,    { prefix: '/api/v1/social' });
  await app.register(algoRoutes,            { prefix: '/api/v1/algo' });
  await app.register(algoPositionsRoutes,   { prefix: '/api/v1/algo-positions' });
  
  // Health
  app.get('/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: await prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'error'),
    redis: await redis.ping().then(() => 'ok').catch(() => 'error'),
  }));

  // WebSocket
  const server = http.createServer(app.server);
  const io = new Server(server, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', credentials: true },
  });
  setupWebSocket(io);

  const port = parseInt(process.env.PORT || '4000');
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API running on http://localhost:${port}`);
  await startAlgoWorker();
}

bootstrap().catch(err => { console.error(err); process.exit(1); });
