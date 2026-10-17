import { NotificationPayload, AuditEventPayload } from '@wuchan/contracts';

export class OutboxProcessor {
  async processPendingOutboxEvents(): Promise<number> {
    console.log('[Worker] Outbox event processor poll cycle complete.');
    return 0;
  }
}

export class NotificationWorker {
  async dispatchNotification(payload: NotificationPayload): Promise<boolean> {
    console.log(`[Worker Notification] Dispatching notification to user ${payload.recipientUserId}: ${payload.title}`);
    return true;
  }
}

export class AuditLogWorker {
  async recordAuditEvent(event: AuditEventPayload): Promise<boolean> {
    console.log(`[Worker Audit] Persisting audit event ${event.eventId} for domain ${event.domain}`);
    return true;
  }
}

export function shouldKeepWorkerAlive(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.RENDER === 'true';
}

export function workerPollIntervalMs(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.WORKER_POLL_MS || 15000);
  if (!Number.isFinite(parsed) || parsed < 1000) return 15000;
  return parsed;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startWorker() {
  console.log('[Worker] WUCHAN Async Background Worker Service Started.');
  const outbox = new OutboxProcessor();
  const stayAlive = shouldKeepWorkerAlive();
  let stopping = false;
  if (stayAlive) {
    const stop = () => {
      stopping = true;
    };
    process.once('SIGTERM', stop);
    process.once('SIGINT', stop);
  }

  do {
    await outbox.processPendingOutboxEvents();
    if (!stayAlive || stopping) break;
    await sleep(workerPollIntervalMs());
  } while (!stopping);
}

if (require.main === module) {
  startWorker().catch((err) => {
    console.error('[Worker] Fatal error running worker:', err);
    process.exit(1);
  });
}
