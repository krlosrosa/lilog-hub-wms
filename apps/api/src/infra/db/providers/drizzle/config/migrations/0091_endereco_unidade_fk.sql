-- Migrate enderecos FK from centro_id to unidade_id (domain alignment).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'estoque'
      AND table_name = 'enderecos'
      AND column_name = 'unidade_id'
  ) THEN
    ALTER TABLE "estoque"."enderecos" ADD COLUMN "unidade_id" varchar(50);
  END IF;
END $$;--> statement-breakpoint

UPDATE "estoque"."enderecos" e
SET "unidade_id" = c."unidade_id"
FROM "master_data"."centros" c
WHERE c."id" = e."centro_id"
  AND e."unidade_id" IS NULL;--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'estoque'
      AND table_name = 'enderecos'
      AND column_name = 'centro_id'
  ) THEN
    ALTER TABLE "estoque"."enderecos" ALTER COLUMN "unidade_id" SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'estoque'
        AND table_name = 'enderecos'
        AND constraint_name = 'enderecos_unidade_id_unidades_id_fk'
    ) THEN
      ALTER TABLE "estoque"."enderecos"
        ADD CONSTRAINT "enderecos_unidade_id_unidades_id_fk"
        FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id")
        ON DELETE restrict ON UPDATE no action;
    END IF;

    ALTER TABLE "estoque"."enderecos"
      DROP CONSTRAINT IF EXISTS "enderecos_centro_endereco_mascarado_unique";

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'estoque'
        AND table_name = 'enderecos'
        AND constraint_name = 'enderecos_unidade_endereco_mascarado_unique'
    ) THEN
      ALTER TABLE "estoque"."enderecos"
        ADD CONSTRAINT "enderecos_unidade_endereco_mascarado_unique"
        UNIQUE ("unidade_id", "endereco_mascarado");
    END IF;

    ALTER TABLE "estoque"."enderecos"
      DROP CONSTRAINT IF EXISTS "enderecos_centro_id_centros_id_fk";

    ALTER TABLE "estoque"."enderecos" DROP COLUMN "centro_id";
  END IF;
END $$;
