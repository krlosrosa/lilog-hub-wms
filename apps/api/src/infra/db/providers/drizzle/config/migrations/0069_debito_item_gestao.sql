ALTER TYPE "public"."debito_item_status_type" ADD VALUE IF NOT EXISTS 'cobrar';
--> statement-breakpoint
ALTER TYPE "public"."debito_item_status_type" ADD VALUE IF NOT EXISTS 'nao_cobrar';
--> statement-breakpoint
ALTER TYPE "public"."debito_item_status_type" ADD VALUE IF NOT EXISTS 'sobra';
--> statement-breakpoint
ALTER TYPE "public"."debito_item_tipo_type" ADD VALUE IF NOT EXISTS 'sobra';
--> statement-breakpoint
UPDATE "cobranca_transportadora"."processo_debito_itens"
SET "status" = 'cobrar'
WHERE "status" = 'pendente';
--> statement-breakpoint
UPDATE "cobranca_transportadora"."processo_debito_itens"
SET "status" = 'cobrar'
WHERE "status" = 'aprovado';
--> statement-breakpoint
UPDATE "cobranca_transportadora"."processo_debito_itens"
SET "status" = 'nao_cobrar'
WHERE "status" = 'rejeitado';
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_itens"
ALTER COLUMN "status" SET DEFAULT 'cobrar';
