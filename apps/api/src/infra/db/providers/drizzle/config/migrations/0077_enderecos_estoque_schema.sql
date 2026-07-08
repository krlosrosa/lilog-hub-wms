-- Move WMS address tables from master_data to estoque (domain alignment).
-- PostgreSQL updates FK references automatically when SET SCHEMA is used.
-- Order: parent table (enderecos) first, then dependent produto_enderecos.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'master_data'
      AND table_name = 'enderecos'
  ) THEN
    ALTER TABLE "master_data"."enderecos" SET SCHEMA "estoque";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'master_data'
      AND table_name = 'produto_enderecos'
  ) THEN
    ALTER TABLE "master_data"."produto_enderecos" SET SCHEMA "estoque";
  END IF;
END $$;
