import { and, eq, gt, sql } from 'drizzle-orm';

import type { ReplicachePatchOperation } from '@lilog/contracts';

import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import {
  replicacheChanges,
  replicacheClients,
  replicacheSpaces,
} from '../providers/drizzle/config/schemas/replicache.schema.js';

export async function getSpaceVersionDb(
  db: DrizzleClient,
  spaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ version: replicacheSpaces.version })
    .from(replicacheSpaces)
    .where(eq(replicacheSpaces.spaceId, spaceId))
    .limit(1);

  return row?.version ?? 0;
}

export async function getClientLastMutationIdDb(
  db: DrizzleClient,
  clientId: string,
): Promise<number> {
  const [row] = await db
    .select({ lastMutationId: replicacheClients.lastMutationId })
    .from(replicacheClients)
    .where(eq(replicacheClients.clientId, clientId))
    .limit(1);

  return row?.lastMutationId ?? 0;
}

export async function listClientGroupMutationIdsDb(
  db: DrizzleClient,
  clientGroupId: string,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      clientId: replicacheClients.clientId,
      lastMutationId: replicacheClients.lastMutationId,
    })
    .from(replicacheClients)
    .where(eq(replicacheClients.clientGroupId, clientGroupId));

  return Object.fromEntries(
    rows.map((row) => [row.clientId, row.lastMutationId]),
  );
}

export async function appendReplicacheChangesDb(
  db: DrizzleClient,
  input: {
    spaceId: string;
    changes: Array<{
      key: string;
      op: 'put' | 'del';
      value?: unknown;
    }>;
  },
): Promise<number> {
  if (input.changes.length === 0) {
    return getSpaceVersionDb(db, input.spaceId);
  }

  return db.transaction(async (tx) => {
    const [spaceRow] = await tx
      .insert(replicacheSpaces)
      .values({ spaceId: input.spaceId, version: 0 })
      .onConflictDoNothing()
      .returning({ version: replicacheSpaces.version });

    const currentVersion =
      spaceRow?.version ??
      (
        await tx
          .select({ version: replicacheSpaces.version })
          .from(replicacheSpaces)
          .where(eq(replicacheSpaces.spaceId, input.spaceId))
          .limit(1)
      )[0]?.version ??
      0;

    let nextVersion = currentVersion;

    for (const change of input.changes) {
      nextVersion += 1;
      await tx.insert(replicacheChanges).values({
        spaceId: input.spaceId,
        version: nextVersion,
        key: change.key,
        op: change.op,
        value: change.op === 'put' ? change.value : null,
      });
    }

    await tx
      .update(replicacheSpaces)
      .set({
        version: nextVersion,
        updatedAt: new Date(),
      })
      .where(eq(replicacheSpaces.spaceId, input.spaceId));

    return nextVersion;
  });
}

export async function upsertClientMutationIdDb(
  db: DrizzleClient,
  input: {
    clientId: string;
    clientGroupId: string;
    lastMutationId: number;
  },
): Promise<void> {
  await db
    .insert(replicacheClients)
    .values({
      clientId: input.clientId,
      clientGroupId: input.clientGroupId,
      lastMutationId: input.lastMutationId,
    })
    .onConflictDoUpdate({
      target: replicacheClients.clientId,
      set: {
        clientGroupId: input.clientGroupId,
        lastMutationId: input.lastMutationId,
        updatedAt: new Date(),
      },
    });
}

export async function listChangesSinceVersionDb(
  db: DrizzleClient,
  spaceId: string,
  sinceVersion: number,
): Promise<ReplicachePatchOperation[]> {
  const rows = await db
    .select({
      key: replicacheChanges.key,
      op: replicacheChanges.op,
      value: replicacheChanges.value,
    })
    .from(replicacheChanges)
    .where(
      and(
        eq(replicacheChanges.spaceId, spaceId),
        gt(replicacheChanges.version, sinceVersion),
      ),
    )
    .orderBy(replicacheChanges.version);

  return rows.map((row) => {
    if (row.op === 'del') {
      return { op: 'del' as const, key: row.key };
    }

    return {
      op: 'put' as const,
      key: row.key,
      value: row.value ?? null,
    };
  });
}

export async function ensureSpaceDb(
  db: DrizzleClient,
  spaceId: string,
): Promise<void> {
  await db
    .insert(replicacheSpaces)
    .values({ spaceId, version: 0 })
    .onConflictDoNothing();
}

export async function bumpSpaceVersionOnlyDb(
  db: DrizzleClient,
  spaceId: string,
): Promise<number> {
  await ensureSpaceDb(db, spaceId);

  const [row] = await db
    .update(replicacheSpaces)
    .set({
      version: sql`${replicacheSpaces.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(replicacheSpaces.spaceId, spaceId))
    .returning({ version: replicacheSpaces.version });

  return row?.version ?? 0;
}
