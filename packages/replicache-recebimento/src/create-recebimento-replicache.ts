import { REPLICACHE_SCHEMA_VERSION } from '@lilog/contracts';
import {
  Replicache,
  type Puller,
  type PullerResult,
  type PullRequest,
  type Pusher,
} from 'replicache';

import { recebimentoMutators, type RecebimentoMutators } from './mutators.js';

export type CreateRecebimentoReplicacheOptions = {
  userId: number;
  unidadeId: string;
  pushURL: string;
  pullURL: string;
  pushObserver?: RecebimentoReplicachePushObserver;
};

export type RecebimentoReplicachePushObserver = {
  onPushStart?: (requestBody: unknown) => void;
  onPushSuccess?: (requestBody: unknown, httpStatusCode: number) => void;
  onPushError?: (requestBody: unknown, errorMessage: string, httpStatusCode: number) => void;
};

function createCredentialPuller(pullURL: string): Puller {
  return async (requestBody: PullRequest): Promise<PullerResult> => {
    const response = await fetch(pullURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    const httpStatusCode = response.status === 201 ? 200 : response.status;

    const httpRequestInfo = {
      httpStatusCode,
      errorMessage: response.ok ? '' : await response.text(),
    };

    if (!response.ok) {
      return { httpRequestInfo };
    }

    return {
      httpRequestInfo,
      response: (await response.json()) as PullerResult['response'],
    } as PullerResult;
  };
}

function createCredentialPusher(
  pushURL: string,
  observer?: RecebimentoReplicachePushObserver,
): Pusher {
  return async (requestBody) => {
    try {
      observer?.onPushStart?.(requestBody);
    } catch {
      // Observability must never block sync.
    }

    const response = await fetch(pushURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    const httpStatusCode = response.status === 201 ? 200 : response.status;
    const errorMessage = response.ok ? '' : await response.text();

    try {
      if (response.ok) {
        observer?.onPushSuccess?.(requestBody, httpStatusCode);
      } else {
        observer?.onPushError?.(requestBody, errorMessage, httpStatusCode);
      }
    } catch {
      // Observability must never block sync.
    }

    return {
      httpRequestInfo: {
        httpStatusCode,
        errorMessage,
      },
    };
  };
}

export function createRecebimentoReplicache(
  options: CreateRecebimentoReplicacheOptions,
): Replicache<RecebimentoMutators> {
  const name = `recebimento-rc-${options.userId}-${options.unidadeId}`;

  return new Replicache({
    name,
    schemaVersion: REPLICACHE_SCHEMA_VERSION,
    pushURL: options.pushURL,
    pullURL: options.pullURL,
    puller: createCredentialPuller(options.pullURL),
    pusher: createCredentialPusher(options.pushURL, options.pushObserver),
    mutators: recebimentoMutators,
    pullInterval: 30_000,
    pushDelay: 400,
  });
}

export type RecebimentoReplicache = Replicache<RecebimentoMutators>;
