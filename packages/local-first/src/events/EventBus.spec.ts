import { describe, expect, it, vi } from 'vitest';
import { EventBus } from '../events/EventBus.js';
import { SyncSession, recordSessionMetrics } from '../core/SyncSession.js';
import { InMemoryMetricsPort } from '../ports/MetricsPort.js';
import { createOperation } from '../operations/Operation.js';

describe('EventBus', () => {
  it('isolates subscriber failures', async () => {
    const bus = new EventBus();
    const ok = vi.fn();
    bus.on('SyncStarted', () => {
      throw new Error('boom');
    });
    bus.on('SyncStarted', ok);

    const op = createOperation(
      {
        aggregateId: 'agg',
        aggregateType: 'Test',
        operationType: 'update',
        payload: {},
        sequence: 1,
      },
      'op-1',
      1,
    );

    await bus.emit('OperationStarted', { operation: op, sessionId: 's1' });
    await bus.emit('SyncStarted', { sessionId: 's1' });
    expect(ok).toHaveBeenCalledOnce();
  });
});

describe('SyncSession metrics', () => {
  it('records session metrics', () => {
    const session = new SyncSession('s1', 100);
    session.operationsSucceeded = 2;
    session.bytesSent = 500;
    const metrics = new InMemoryMetricsPort();
    recordSessionMetrics(session, metrics);
    expect(metrics.counters.get('sync.session.completed')).toBe(1);
    expect(metrics.histograms.get('sync.session.bytes_sent')).toEqual([500]);
  });
});
