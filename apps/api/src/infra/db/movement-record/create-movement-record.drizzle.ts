import { and, desc, eq, sql, type SQL } from 'drizzle-orm';

import type { CreateMovementRecordInput } from '../../../domain/model/movement-record/movement-record.model.js';
import type {
  ListItemMovementsFilter,
  MovementRecordRecord,
} from '../../../domain/repositories/movement-record/movement-record.repository.js';
import type { DrizzleClient } from '../providers/drizzle/drizzle.provider.js';
import { movementRecords } from '../providers/drizzle/config/migrations/schema.js';

function mapMovementRecordRow(
  row: typeof movementRecords.$inferSelect,
): MovementRecordRecord {
  return {
    id: row.id,
    itemId: row.itemId,
    lotNumber: row.lotNumber,
    serialNumber: row.serialNumber,
    fromLocation: row.fromLocation,
    toLocation: row.toLocation,
    movementType: row.movementType,
    quantity: row.quantity,
    unit: row.unit,
    operatorId: row.operatorId,
    documentRef: row.documentRef,
    notes: row.notes,
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

export async function createMovementRecordDb(
  db: DrizzleClient,
  data: CreateMovementRecordInput,
): Promise<MovementRecordRecord> {
  const [record] = await db
    .insert(movementRecords)
    .values({
      itemId: data.itemId,
      lotNumber: data.lotNumber,
      serialNumber: data.serialNumber,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      movementType: data.movementType,
      quantity: data.quantity,
      unit: data.unit,
      operatorId: data.operatorId,
      documentRef: data.documentRef,
      notes: data.notes,
      occurredAt: data.occurredAt,
    })
    .returning();

  if (!record) {
    throw new Error('Failed to create movement record');
  }

  return mapMovementRecordRow(record);
}

export async function listItemMovementsDb(
  db: DrizzleClient,
  filter: ListItemMovementsFilter,
) {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(movementRecords.itemId, filter.itemId)];

  if (filter.movementType) {
    conditions.push(eq(movementRecords.movementType, filter.movementType));
  }

  if (filter.lotNumber) {
    conditions.push(eq(movementRecords.lotNumber, filter.lotNumber));
  }

  const whereClause = and(...conditions);

  const items = await db
    .select()
    .from(movementRecords)
    .where(whereClause)
    .orderBy(desc(movementRecords.occurredAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(movementRecords)
    .where(whereClause);

  const count = countResult[0]?.count ?? 0;

  return {
    items: items.map(mapMovementRecordRow),
    total: count,
    page,
    limit,
  };
}
