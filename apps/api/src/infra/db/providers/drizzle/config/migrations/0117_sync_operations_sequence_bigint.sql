-- Migration 0117: sync_operations.sequence must store millisecond timestamps (bigint)

ALTER TABLE sync.sync_operations
  ALTER COLUMN sequence TYPE bigint;
