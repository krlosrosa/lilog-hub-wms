import type { CreateMovementRecordInput } from '../../model/movement-record/movement-record.model.js';

export const MOVEMENT_RECORD_REPOSITORY = 'IMovementRecordRepository';

export type MovementRecordRecord = CreateMovementRecordInput & {
  id: string;
  createdAt: Date;
};

export type ListItemMovementsFilter = {
  itemId: string;
  page?: number;
  limit?: number;
  movementType?: CreateMovementRecordInput['movementType'];
  lotNumber?: string;
};

export type ListItemMovementsResult = {
  items: MovementRecordRecord[];
  total: number;
  page: number;
  limit: number;
};

export interface IMovementRecordRepository {
  create(data: CreateMovementRecordInput): Promise<MovementRecordRecord>;
  listByItem(filter: ListItemMovementsFilter): Promise<ListItemMovementsResult>;
}
