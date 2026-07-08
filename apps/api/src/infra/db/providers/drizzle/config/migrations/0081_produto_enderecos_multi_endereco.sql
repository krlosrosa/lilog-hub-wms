-- Allow the same product in multiple addresses (slotting).
-- Keep only (produto_id, endereco_id) as unique — one row per product per address.

--> statement-breakpoint
DROP INDEX IF EXISTS "estoque"."produto_enderecos_centro_produto_picking_primario_unique";

--> statement-breakpoint
ALTER TABLE "estoque"."produto_enderecos"
  DROP CONSTRAINT IF EXISTS "produto_enderecos_centro_produto_ordem_unique";
