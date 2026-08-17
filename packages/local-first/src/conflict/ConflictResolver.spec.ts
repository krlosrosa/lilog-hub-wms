import { describe, expect, it } from 'vitest';
import {
  ClientWinsConflictResolver,
  LastWriteWinsConflictResolver,
  MergeStrategyConflictResolver,
  ServerWinsConflictResolver,
} from '../conflict/ConflictResolver.js';
import { createOperation } from '../operations/Operation.js';

const operation = createOperation(
  {
    aggregateId: 'agg',
    aggregateType: 'Test',
    operationType: 'update',
    payload: { value: 'client' },
    sequence: 1,
  },
  'op-1',
  100,
);

describe('ConflictResolver strategies', () => {
  it('server wins accepts server state', () => {
    const resolver = new ServerWinsConflictResolver();
    expect(resolver.resolve(operation, { value: 'server' }).action).toBe('acceptServer');
  });

  it('client wins keeps client state', () => {
    const resolver = new ClientWinsConflictResolver();
    expect(resolver.resolve(operation, { value: 'server' }).action).toBe('keepClient');
  });

  it('last write wins compares timestamps', () => {
    const resolver = new LastWriteWinsConflictResolver(() => 50);
    expect(resolver.resolve(operation, { updatedAt: 100 }).action).toBe('acceptServer');
    expect(resolver.resolve(operation, { updatedAt: 10 }).action).toBe('keepClient');
  });

  it('merge strategy merges payloads', () => {
    const resolver = new MergeStrategyConflictResolver();
    const decision = resolver.resolve(operation, { value: 'server', extra: true });
    expect(decision.action).toBe('merge');
    expect(decision.mergedPayload).toEqual({ value: 'client', extra: true });
  });
});
