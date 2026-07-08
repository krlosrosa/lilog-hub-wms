-- Restore unique constraints/indexes on estoque.produto_enderecos.
-- Lost when migration 0050 replaced produto_id (uuid -> varchar) without recreating them.

--> statement-breakpoint
DELETE FROM "estoque"."produto_enderecos" pe
WHERE pe."id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "produto_id", "endereco_id"
        ORDER BY "updated_at" DESC, "id" DESC
      ) AS rn
    FROM "estoque"."produto_enderecos"
  ) ranked
  WHERE ranked.rn > 1
);

--> statement-breakpoint
DELETE FROM "estoque"."produto_enderecos" pe
WHERE pe."id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "centro_id", "produto_id", "ordem"
        ORDER BY "updated_at" DESC, "id" DESC
      ) AS rn
    FROM "estoque"."produto_enderecos"
  ) ranked
  WHERE ranked.rn > 1
);

--> statement-breakpoint
DELETE FROM "estoque"."produto_enderecos" pe
WHERE pe."id" IN (
  SELECT "id"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (
        PARTITION BY "centro_id", "produto_id"
        ORDER BY "updated_at" DESC, "id" DESC
      ) AS rn
    FROM "estoque"."produto_enderecos"
    WHERE "papel" = 'picking_primario'
  ) ranked
  WHERE ranked.rn > 1
);

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'produto_enderecos_produto_endereco_unique'
      AND conrelid = 'estoque.produto_enderecos'::regclass
  ) THEN
    ALTER TABLE "estoque"."produto_enderecos"
      ADD CONSTRAINT "produto_enderecos_produto_endereco_unique"
      UNIQUE ("produto_id", "endereco_id");
  END IF;
END $$;

--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'produto_enderecos_centro_produto_ordem_unique'
      AND conrelid = 'estoque.produto_enderecos'::regclass
  ) THEN
    ALTER TABLE "estoque"."produto_enderecos"
      ADD CONSTRAINT "produto_enderecos_centro_produto_ordem_unique"
      UNIQUE ("centro_id", "produto_id", "ordem");
  END IF;
END $$;

--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "produto_enderecos_centro_produto_picking_primario_unique"
  ON "estoque"."produto_enderecos" USING btree ("centro_id", "produto_id")
  WHERE "papel" = 'picking_primario';
