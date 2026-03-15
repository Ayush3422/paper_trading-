// ════════════════════════════════════════════════════════════════════════════
// ALGO STRATEGY WORKER
// BullMQ repeatable job — runs every 60 seconds during market hours.
// Evaluates all ACTIVE strategies against real Polygon.io data.
// ════════════════════════════════════════════════════════════════════════════

import { Worker, Queue, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runActiveStrategies } from '../services/live-execution.service';
import { isMarketOpen } from '../services/live-data.service';

const QUEUE_NAME = 'algo-live-execution';

// ── Connection options (plain object — avoids BullMQ v5 vendored ioredis mismatch) ─
function parseRedisUrl(url: string) {
  const parsed = new URL(url);
  return {
    host:     parsed.hostname || 'localhost',
    port:     parsed.port ? parseInt(parsed.port) : 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null as null,
    enableReadyCheck: false,
  };
}
const connectionOpts = parseRedisUrl(
  process.env.REDIS_URL || 'redis://:redispass@localhost:6379'
);

// ── Queue + Scheduler ─────────────────────────────────────────────────────────
export const algoQueue = new Queue(QUEUE_NAME, { connection: connectionOpts });

export async function startAlgoWorker() {
  // Remove any existing repeatable jobs then re-register
  const repeatables = await algoQueue.getRepeatableJobs();
  for (const job of repeatables) {
    await algoQueue.removeRepeatableByKey(job.key);
  }

  // Schedule: every 60 seconds
  await algoQueue.add(
    'run-strategies',
    { triggeredAt: new Date().toISOString() },
    {
      repeat:  { every: 60_000 },  // every 60 seconds
      jobId:   'algo-live-runner',
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 },
    }
  );

  // Worker
  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      console.log(`[AlgoWorker] Job triggered at ${new Date().toISOString()}`);

      if (!isMarketOpen()) {
        console.log('[AlgoWorker] Market closed — skipping');
        return { skipped: true, reason: 'market_closed' };
      }

      const signals = await runActiveStrategies();

      const summary = {
        ran:       signals.length,
        buys:      signals.filter(s => s.signal === 'BUY').length,
        sells:     signals.filter(s => s.signal === 'SELL').length,
        holds:     signals.filter(s => s.signal === 'HOLD').length,
        errors:    signals.filter(s => s.signal === 'ERROR').length,
        timestamp: new Date().toISOString(),
      };

      console.log(`[AlgoWorker] Completed:`, summary);
      return summary;
    },
    {
      connection: connectionOpts,
      concurrency: 1,
      limiter: { max: 1, duration: 55_000 },  // max 1 job per 55s
    }
  );

  worker.on('completed', (job, result) => {
    if (result && 'skipped' in result && result.skipped) return;
    console.log(`[AlgoWorker] ✅ Job ${job.id} done — ${(result as any)?.buys} buys, ${(result as any)?.sells} sells`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[AlgoWorker] ❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[AlgoWorker] Worker error:', err.message);
  });

  console.log('[AlgoWorker] 🚀 Started — checking strategies every 60 seconds');
  return { worker };
}

// ── Manual trigger (for testing / API endpoint) ───────────────────────────────
export async function triggerManualRun(): Promise<any> {
  const job = await algoQueue.add(
    'manual-run',
    { triggeredAt: new Date().toISOString(), manual: true },
    { attempts: 1, removeOnComplete: 5 }
  );
  return job;
}

// ── Get worker queue stats ────────────────────────────────────────────────────
export async function getWorkerStats() {
  const [waiting, active, completed, failed] = await Promise.all([
    algoQueue.getWaitingCount(),
    algoQueue.getActiveCount(),
    algoQueue.getCompletedCount(),
    algoQueue.getFailedCount(),
  ]);
  const repeatables = await algoQueue.getRepeatableJobs();
  return {
    waiting, active, completed, failed,
    repeatableJobs: repeatables.length,
    nextRun: repeatables[0]?.next ? new Date(repeatables[0].next).toISOString() : null,
  };
}
