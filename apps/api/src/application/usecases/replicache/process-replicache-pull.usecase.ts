import { Inject, Injectable } from '@nestjs/common';

import type {
  ReplicachePullRequest,
  ReplicachePullResponse,
} from '@lilog/contracts';

import { BuildRecebimentoReplicacheSnapshotService } from '../../services/replicache/build-recebimento-replicache-snapshot.service.js';
import {
  REPLICACHE_REPOSITORY,
  type IReplicacheRepository,
} from '../../../domain/repositories/replicache/replicache.repository.js';

export type ProcessReplicachePullInput = {
  request: ReplicachePullRequest;
  unidadeId: string;
  userId: number;
};

const REPLICACHE_COOKIE_PAD = 12;
const REPLICACHE_COOKIE_PREFIX = 'z';

/** Zero-padded cookie so lexicographic order matches numeric order (999 < 1000). */
export function formatReplicacheCookie(version: number): string {
  return `${REPLICACHE_COOKIE_PREFIX}${String(version).padStart(REPLICACHE_COOKIE_PAD, '0')}`;
}

/** Parses leading numeric space version from Replicache cookies (e.g. "113" or "113:hash"). */
export function parseReplicacheCookieVersion(cookie: unknown): number {
  if (cookie == null) {
    return -1;
  }

  const raw = String(cookie).split(':')[0]?.trim() ?? '';
  const head = raw.startsWith(REPLICACHE_COOKIE_PREFIX)
    ? raw.slice(REPLICACHE_COOKIE_PREFIX.length)
    : raw;
  const parsed = Number(head);
  return Number.isFinite(parsed) ? parsed : -1;
}

@Injectable()
export class ProcessReplicachePullUseCase {
  constructor(
    @Inject(REPLICACHE_REPOSITORY)
    private readonly replicacheRepository: IReplicacheRepository,
    private readonly snapshotService: BuildRecebimentoReplicacheSnapshotService,
  ) {}

  async execute(input: ProcessReplicachePullInput): Promise<ReplicachePullResponse> {
    const snapshotPatch = await this.snapshotService.buildSnapshot({
      unidadeId: input.unidadeId,
      userId: input.userId,
    });
    const patch = [{ op: 'clear' as const }, ...snapshotPatch];

    const newVersion = await this.replicacheRepository.bumpSpaceVersion(
      input.unidadeId,
    );
    const cookie = formatReplicacheCookie(newVersion);

    const lastMutationIDChanges =
      await this.replicacheRepository.listClientGroupMutationIds(
        input.request.clientGroupID,
      );

    return {
      cookie,
      lastMutationIDChanges,
      patch,
    };
  }
}
