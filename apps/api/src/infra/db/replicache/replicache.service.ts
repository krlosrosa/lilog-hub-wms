import { Inject, Injectable } from '@nestjs/common';

import {
  appendReplicacheChangesDb,
  bumpSpaceVersionOnlyDb,
  getClientLastMutationIdDb,
  getSpaceVersionDb,
  listChangesSinceVersionDb,
  listClientGroupMutationIdsDb,
  upsertClientMutationIdDb,
} from './replicache-store.drizzle.js';
import { DRIZZLE_PROVIDER, type DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import type { IReplicacheRepository } from '../../../domain/repositories/replicache/replicache.repository.js';

@Injectable()
export class ReplicacheService implements IReplicacheRepository {
  constructor(@Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient) {}

  getSpaceVersion(spaceId: string) {
    return getSpaceVersionDb(this.db, spaceId);
  }

  getClientLastMutationId(clientId: string) {
    return getClientLastMutationIdDb(this.db, clientId);
  }

  listClientGroupMutationIds(clientGroupId: string) {
    return listClientGroupMutationIdsDb(this.db, clientGroupId);
  }

  appendChanges(
    spaceId: string,
    changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }>,
  ) {
    return appendReplicacheChangesDb(this.db, { spaceId, changes });
  }

  upsertClientMutationId(input: {
    clientId: string;
    clientGroupId: string;
    lastMutationId: number;
  }) {
    return upsertClientMutationIdDb(this.db, input);
  }

  listChangesSinceVersion(spaceId: string, sinceVersion: number) {
    return listChangesSinceVersionDb(this.db, spaceId, sinceVersion);
  }

  bumpSpaceVersion(spaceId: string) {
    return bumpSpaceVersionOnlyDb(this.db, spaceId);
  }
}
