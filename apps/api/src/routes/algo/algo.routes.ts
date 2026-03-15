import { FastifyInstance } from 'fastify';
import { authenticate } from '../../plugins/auth.plugin';
import { algoService } from '../../services/algo.service';
import { getSignalLogs } from '../../services/live-execution.service';
import { triggerManualRun, getWorkerStats } from '../../workers/algo.worker';

export async function algoRoutes(app: FastifyInstance) {
  const pre = [authenticate];

  // ── Strategy CRUD ─────────────────────────────────────────────────────────
  app.get('/strategies', { preHandler: pre }, async (req, reply) => {
    const data = await algoService.getStrategies((req as any).user.id);
    return reply.send({ data });
  });

  app.get('/strategies/:id', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as any;
    const data   = await algoService.getStrategy(id, (req as any).user.id);
    if (!data) return reply.status(404).send({ message: 'Not found' });
    return reply.send({ data });
  });

  app.post('/strategies', { preHandler: pre }, async (req, reply) => {
    const body = req.body as any;
    const data = await algoService.createStrategy((req as any).user.id, {
      name: body.name, description: body.description, config: body.config,
    });
    return reply.status(201).send({ data });
  });

  app.put('/strategies/:id', { preHandler: pre }, async (req, reply) => {
    const { id } = req.params as any;
    const data   = await algoService.updateStrategy(id, (req as any).user.id, req.body as any);
    return reply.send({ data });
  });

  app.delete('/strategies/:id', { preHandler: pre }, async (req, reply) => {
    await algoService.deleteStrategy((req as any).params?.id || (req.params as any).id, (req as any).user.id);
    return reply.send({ message: 'Deleted' });
  });

  // ── Backtest ──────────────────────────────────────────────────────────────
  app.post('/strategies/:id/backtest', { preHandler: pre }, async (req, reply) => {
    const { id }       = req.params as any;
    const { days = 365 } = req.body as any || {};
    try {
      const results = await algoService.runBacktest(id, (req as any).user.id, days);
      return reply.send({ data: results });
    } catch (e: any) {
      return reply.status(400).send({ message: e.message });
    }
  });

  // ── Toggle live ───────────────────────────────────────────────────────────
  app.post('/strategies/:id/toggle', { preHandler: pre }, async (req, reply) => {
    const data = await algoService.toggleStatus((req.params as any).id, (req as any).user.id);
    return reply.send({ data });
  });

  // ── Templates ─────────────────────────────────────────────────────────────
  app.get('/templates', { preHandler: pre }, async (_req, reply) => {
    return reply.send({ data: algoService.getTemplates() });
  });

  // ── Live signal logs ──────────────────────────────────────────────────────
  // GET /api/v1/algo/signals?limit=50
  app.get('/signals', { preHandler: pre }, async (req, reply) => {
    const { limit = 50 } = req.query as any;
    const data = await getSignalLogs(undefined, parseInt(limit));
    return reply.send({ data });
  });

  // GET /api/v1/algo/strategies/:id/signals
  app.get('/strategies/:id/signals', { preHandler: pre }, async (req, reply) => {
    const { id }       = req.params as any;
    const { limit = 50 } = req.query as any;
    const data = await getSignalLogs(id, parseInt(limit));
    return reply.send({ data });
  });

  // ── Manual trigger (force run now, bypasses market-hours gate) ──────────────
  // POST /api/v1/algo/run-now
  app.post('/run-now', { preHandler: pre }, async (req, reply) => {
    try {
      const { runActiveStrategies } = await import('../../services/live-execution.service');
      const signals = await runActiveStrategies();
      return reply.send({
        data: {
          ran:   signals.length,
          buys:  signals.filter(s => s.signal === 'BUY').length,
          sells: signals.filter(s => s.signal === 'SELL').length,
          holds: signals.filter(s => s.signal === 'HOLD').length,
          signals,
        },
      });
    } catch(e: any) {
      return reply.status(500).send({ message: e.message });
    }
  });

  // ── Worker health ─────────────────────────────────────────────────────────
  app.get('/worker-status', { preHandler: pre }, async (_req, reply) => {
    try {
      const stats = await getWorkerStats();
      return reply.send({ data: stats });
    } catch(e: any) {
      return reply.status(500).send({ message: e.message });
    }
  });
}
