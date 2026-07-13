-- Migration 0116: Generic sync schema
-- Creates the sync PostgreSQL schema with tables for batch processing,
-- operation tracking, aggregate revision management and change feed.

CREATE SCHEMA IF NOT EXISTS sync;

-- sync.sync_batches: tracks each synchronization batch submitted by a client
CREATE TABLE sync.sync_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id varchar(64) NOT NULL,
  adapter varchar(50) NOT NULL,
  protocol_version smallint NOT NULL DEFAULT 2,
  aggregate_type varchar(50) NOT NULL,
  aggregate_id varchar(100) NOT NULL,
  unidade_id varchar(50) NOT NULL,
  base_revision integer NOT NULL DEFAULT 0,
  final_revision integer,
  status varchar(20) NOT NULL DEFAULT 'processing',
  applied_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  user_id integer,
  device_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX sync_batches_batch_adapter_uidx
  ON sync.sync_batches (batch_id, adapter);

CREATE INDEX sync_batches_aggregate_idx
  ON sync.sync_batches (aggregate_type, aggregate_id);

CREATE INDEX sync_batches_unidade_idx
  ON sync.sync_batches (unidade_id);

CREATE INDEX sync_batches_created_at_idx
  ON sync.sync_batches (created_at);

-- sync.sync_operations: individual operations within a batch
CREATE TABLE sync.sync_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES sync.sync_batches(id) ON DELETE CASCADE,
  op_id varchar(128) NOT NULL,
  op_type varchar(100) NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  status varchar(20) NOT NULL,
  error_message text,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sync_operations_batch_op_uidx
  ON sync.sync_operations (batch_id, op_id);

CREATE INDEX sync_operations_batch_idx
  ON sync.sync_operations (batch_id);

-- sync.sync_aggregate_revisions: monotonic revision counter per adapter+aggregate
CREATE TABLE sync.sync_aggregate_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter varchar(50) NOT NULL,
  aggregate_id varchar(100) NOT NULL,
  unidade_id varchar(50) NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX sync_aggregate_revisions_adapter_aggregate_uidx
  ON sync.sync_aggregate_revisions (adapter, aggregate_id);

CREATE INDEX sync_aggregate_revisions_unidade_idx
  ON sync.sync_aggregate_revisions (unidade_id);

-- sync.sync_changes: incremental change feed for pull-based sync
CREATE TABLE sync.sync_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adapter varchar(50) NOT NULL,
  unidade_id varchar(50) NOT NULL,
  entity_type varchar(50) NOT NULL,
  entity_id varchar(100) NOT NULL,
  operation varchar(10) NOT NULL,
  revision integer NOT NULL,
  payload text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sync_changes_adapter_unidade_revision_idx
  ON sync.sync_changes (adapter, unidade_id, revision);

CREATE INDEX sync_changes_entity_idx
  ON sync.sync_changes (entity_type, entity_id);
