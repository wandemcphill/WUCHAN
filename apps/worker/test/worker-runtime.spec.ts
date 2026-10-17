import { shouldKeepWorkerAlive, workerPollIntervalMs } from '../src/index';

describe('Render worker runtime', () => {
  it('stays alive only when Render sets RENDER=true', () => {
    expect(shouldKeepWorkerAlive({})).toBe(false);
    expect(shouldKeepWorkerAlive({ RENDER: 'false' })).toBe(false);
    expect(shouldKeepWorkerAlive({ RENDER: 'true' })).toBe(true);
  });

  it('uses a 15s poll unless WORKER_POLL_MS is a safe interval', () => {
    expect(workerPollIntervalMs({})).toBe(15000);
    expect(workerPollIntervalMs({ WORKER_POLL_MS: '0' })).toBe(15000);
    expect(workerPollIntervalMs({ WORKER_POLL_MS: 'nope' })).toBe(15000);
    expect(workerPollIntervalMs({ WORKER_POLL_MS: '5000' })).toBe(5000);
  });
});
