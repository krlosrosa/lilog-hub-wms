import type { ReplicachePatchOperation } from '@lilog/contracts';

export const REPLICACHE_REPOSITORY = Symbol('REPLICACHE_REPOSITORY');

export interface IReplicacheRepository {
  getSpaceVersion(spaceId: string): Promise<number>;
  getClientLastMutationId(clientId: string): Promise<number>;
  listClientGroupMutationIds(clientGroupId: string): Promise<Record<string, number>>;
  appendChanges(
    spaceId: string,
    changes: Array<{ key: string; op: 'put' | 'del'; value?: unknown }>,
  ): Promise<number>;
  upsertClientMutationId(input: {
    clientId: string;
    clientGroupId: string;
    lastMutationId: number;
  }): Promise<void>;
  listChangesSinceVersion(
    spaceId: string,
    sinceVersion: number,
  ): Promise<ReplicachePatchOperation[]>;
  bumpSpaceVersion(spaceId: string): Promise<number>;
}
