import { AbortCancellationToken } from '../ports/CancellationToken.js';
import type { CancellationToken } from '../ports/CancellationToken.js';
import { SystemClock, SystemTimer } from '../ports/Clock.js';
import { UuidIdGenerator } from '../ports/IdGenerator.js';
import { NoOpLogger } from '../ports/Logger.js';
import { NoOpMetricsPort } from '../ports/MetricsPort.js';
import { JsonSerializer } from '../ports/Serializer.js';
import { DefaultSyncStrategy } from '../strategy/SyncStrategy.js';
import type { SyncStrategy } from '../strategy/SyncStrategy.js';
import { RetryPolicy } from '../retry/RetryPolicy.js';
import { BatchOptimizer } from './BatchOptimizer.js';
import { AggregateExecutionLock, InMemoryLockPort, ParallelismSemaphore } from './AggregateExecutionLock.js';
import { PushExecutor } from './PushExecutor.js';
import { PullExecutor } from './PullExecutor.js';
import type { PullExecutorDeps } from './PullExecutor.js';
import { SyncScheduler } from './SyncScheduler.js';
import { SyncSessionFactory, recordSessionMetrics } from './SyncSession.js';
import { EventBus } from '../events/EventBus.js';
import { OperationQueue } from '../queue/OperationQueue.js';
import { StorageQueueRepository } from '../queue/QueueRepository.js';
import { OperationRegistry } from '../operations/OperationRegistry.js';
import type { CreateOperationInput } from '../operations/Operation.js';
import type { OperationHandler } from '../operations/OperationHandler.js';
import type { StorageAdapter } from '../storage/StorageAdapter.js';
import type { HttpAdapter } from '../network/HttpAdapter.js';
import type { ConnectivityAdapter } from '../network/ConnectivityAdapter.js';
import type { CheckpointRepository } from '../storage/CheckpointRepository.js';
import type { SnapshotStore } from '../storage/SnapshotStore.js';

export interface SyncEngineConfig {
  deviceId: string;
  pullScope?: string;
  pullUrl?: string;
  strategy?: SyncStrategy;
}

export interface SyncEngineDeps {
  storage: StorageAdapter;
  http: HttpAdapter;
  connectivity: ConnectivityAdapter;
  checkpoints: CheckpointRepository;
  snapshots: SnapshotStore;
  config: SyncEngineConfig;
}

export class SyncEngine {
  readonly events = new EventBus();
  readonly registry = new OperationRegistry();
  private readonly clock = new SystemClock();
  private readonly timer = new SystemTimer();
  private readonly idGenerator = new UuidIdGenerator();
  private readonly logger = new NoOpLogger();
  private readonly metrics = new NoOpMetricsPort();
  private readonly serializer = new JsonSerializer();
  private readonly strategy: SyncStrategy;
  private readonly queue: OperationQueue;
  private readonly sessionFactory: SyncSessionFactory;
  private readonly pushExecutor: PushExecutor;
  private readonly pullExecutor: PullExecutor | null;
  private readonly scheduler: SyncScheduler;
  private readonly aggregateLock: AggregateExecutionLock;
  private readonly cancellation = new AbortCancellationToken();
  private started = false;

  constructor(private readonly deps: SyncEngineDeps) {
    this.strategy = deps.config.strategy ?? new DefaultSyncStrategy();
    const repository = new StorageQueueRepository(deps.storage);
    this.queue = new OperationQueue(repository, this.clock, this.idGenerator);
    this.sessionFactory = new SyncSessionFactory(this.idGenerator, this.clock);

    const batchOptimizer = new BatchOptimizer(
      {
        batchSize: this.strategy.batchSize,
        maxBatchBytes: this.strategy.maxBatchBytes,
      },
      this.serializer,
    );

    this.aggregateLock = new AggregateExecutionLock(
      new InMemoryLockPort(),
      deps.config.deviceId,
    );

    this.pushExecutor = new PushExecutor({
      queue: this.queue,
      registry: this.registry,
      http: deps.http,
      batchOptimizer,
      aggregateLock: this.aggregateLock,
      semaphore: new ParallelismSemaphore(this.strategy.parallelism),
      retryPolicy: new RetryPolicy(undefined, this.clock),
      strategy: this.strategy,
      events: this.events,
      logger: this.logger,
      metrics: this.metrics,
    });

    this.pullExecutor =
      deps.config.pullUrl !== undefined
        ? new PullExecutor({
            checkpoints: deps.checkpoints,
            snapshots: deps.snapshots,
            storage: deps.storage,
            http: deps.http,
            events: this.events,
            metrics: this.metrics,
            pullUrl: deps.config.pullUrl,
          })
        : null;

    this.scheduler = new SyncScheduler({
      clock: this.clock,
      timer: this.timer,
      connectivity: deps.connectivity,
      queue: this.queue,
      debounceMs: this.strategy.debounceMs,
      onTrigger: () => this.sync(this.cancellation),
    });
  }

  register(operationType: string, handler: OperationHandler): void {
    this.registry.register(operationType, handler);
  }

  async dispatch(input: CreateOperationInput): Promise<void> {
    await this.queue.enqueue(input);
    this.scheduler.notifyEnqueued();
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.queue.recoverOrphanedRunning();
    await this.aggregateLock.releaseStaleLeases(this.clock.now());
    this.scheduler.start();
  }

  stop(): void {
    this.started = false;
    this.scheduler.stop();
  }

  cancel(): void {
    this.cancellation.cancel();
  }

  async sync(token: CancellationToken = this.cancellation): Promise<void> {
    token.throwIfCancelled();

    const online = await this.deps.connectivity.isOnline();
    const pending = await this.queue.getPending();
    const ctx = {
      now: this.clock.now(),
      online,
      pendingCount: pending.length,
      sessionId: '',
    };

    const session = this.sessionFactory.create();
    ctx.sessionId = session.sessionId;
    await this.deps.storage.saveSession(session.toRecord(this.clock.now()));
    await this.events.emit('SyncStarted', { sessionId: session.sessionId });
    await this.events.emit('SessionOpened', { session: session.toRecord(this.clock.now()) });

    try {
      if (this.strategy.shouldPull(ctx) && this.pullExecutor) {
        await this.pullExecutor.execute(
          this.deps.config.pullScope ?? 'default',
          session,
          token,
        );
      }

      if (this.strategy.shouldPush(ctx)) {
        await this.pushExecutor.execute(session, token);
      }

      const record = session.complete(this.clock.now());
      await this.deps.storage.updateSession(session.sessionId, record);
      recordSessionMetrics(session, this.metrics);
      await this.events.emit('SyncFinished', { session: record });
      await this.events.emit('SessionClosed', { session: record });
    } catch {
      const record = session.abort(this.clock.now());
      await this.deps.storage.updateSession(session.sessionId, record);
      await this.events.emit('SyncFinished', { session: record });
      await this.events.emit('SessionClosed', { session: record });
    }
  }
}

export type { PullExecutorDeps };
