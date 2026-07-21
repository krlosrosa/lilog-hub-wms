import { CancelledSyncError } from '../errors/index.js';
import type { BlobTransportAdapter } from '../network/BlobTransportAdapter.js';
import type { HttpAdapter } from '../network/HttpAdapter.js';
import type { CancellationToken } from '../ports/CancellationToken.js';
import type { MetricsPort } from '../ports/MetricsPort.js';
import type { EventBus } from '../events/EventBus.js';
import type { SyncSession } from '../core/SyncSession.js';
import type { Operation } from '../operations/Operation.js';
import type { UploadOperationHandler } from '../operations/OperationHandler.js';

export interface UploadManagerDeps {
  http: HttpAdapter;
  blobTransport: BlobTransportAdapter;
  events: EventBus;
  metrics: MetricsPort;
}

export class UploadManager {
  constructor(private readonly deps: UploadManagerDeps) {}

  async uploadOperation(
    operation: Operation,
    handler: UploadOperationHandler,
    session: SyncSession,
    token: CancellationToken,
  ): Promise<void> {
    token.throwIfCancelled();
    await this.deps.events.emit('UploadStarted', {
      operationId: operation.id,
      sessionId: session.sessionId,
    });

    const ctx = {
      sessionId: session.sessionId,
      correlationId: operation.correlationId ?? operation.id,
      aggregateId: operation.aggregateId,
      aggregateType: operation.aggregateType,
      now: Date.now(),
    };

    if (!handler.requestSignedUrl || !handler.confirmUpload) {
      throw new Error('Upload handler missing signed URL methods');
    }

    const payload = operation.payload as { bytes?: Uint8Array; contentType?: string };
    const bytes = payload.bytes ?? new Uint8Array();
    const contentType = payload.contentType ?? 'application/octet-stream';

    let signed = await handler.requestSignedUrl(operation, ctx);
    token.throwIfCancelled();

    try {
      const uploadResult = await this.deps.blobTransport.upload(
        signed.signedUrl,
        bytes,
        contentType,
      );
      token.throwIfCancelled();
      await handler.confirmUpload(operation, signed.uploadId, ctx);
      session.bytesSent += uploadResult.bytesSent;
      await this.deps.events.emit('UploadFinished', {
        operationId: operation.id,
        sessionId: session.sessionId,
        bytesSent: uploadResult.bytesSent,
      });
      this.deps.metrics.histogram('sync.upload.bytes_sent', uploadResult.bytesSent);
    } catch (error) {
      if (error instanceof CancelledSyncError) throw error;
      signed = await handler.requestSignedUrl(operation, ctx);
      const uploadResult = await this.deps.blobTransport.upload(
        signed.signedUrl,
        bytes,
        contentType,
      );
      await handler.confirmUpload(operation, signed.uploadId, ctx);
      session.bytesSent += uploadResult.bytesSent;
      await this.deps.events.emit('UploadFinished', {
        operationId: operation.id,
        sessionId: session.sessionId,
        bytesSent: uploadResult.bytesSent,
      });
    }
  }
}
