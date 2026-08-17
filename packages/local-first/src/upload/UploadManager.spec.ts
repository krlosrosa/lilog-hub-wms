import { describe, expect, it, vi } from 'vitest';
import { UploadManager } from '../upload/UploadManager.js';
import { SyncSession } from '../core/SyncSession.js';
import { EventBus } from '../events/EventBus.js';
import { NoOpMetricsPort } from '../ports/MetricsPort.js';
import { neverCancelled } from '../ports/CancellationToken.js';
import { createOperation } from '../operations/Operation.js';
import type { UploadOperationHandler } from '../operations/OperationHandler.js';
import type { BlobTransportAdapter } from '../network/BlobTransportAdapter.js';
import { FakeHttpAdapter } from '../testing/FakeHttpAdapter.js';

describe('UploadManager', () => {
  it('uploads bytes and confirms idempotently', async () => {
    const blobTransport: BlobTransportAdapter = {
      upload: vi.fn(async () => ({ bytesSent: 10 })),
    };
    const manager = new UploadManager({
      http: new FakeHttpAdapter(),
      blobTransport,
      events: new EventBus(),
      metrics: new NoOpMetricsPort(),
    });

    const handler: UploadOperationHandler = {
      buildRequest: () => ({ method: 'POST', url: '/x' }),
      applyResult: async () => {},
      onConflict: () => ({ action: 'acceptServer' }),
      requestSignedUrl: async () => ({
        signedUrl: 'https://upload',
        confirmUrl: 'https://confirm',
        uploadId: 'upload-1',
      }),
      confirmUpload: vi.fn(async () => {}),
    };

    const operation = createOperation(
      {
        aggregateId: 'agg',
        aggregateType: 'Test',
        operationType: 'uploadPhoto',
        payload: { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/jpeg' },
        sequence: 1,
      },
      'op-upload',
      1,
    );

    const session = new SyncSession('session-1', Date.now());
    await manager.uploadOperation(operation, handler, session, neverCancelled());
    expect(blobTransport.upload).toHaveBeenCalledOnce();
    expect(handler.confirmUpload).toHaveBeenCalledOnce();
  });
});
