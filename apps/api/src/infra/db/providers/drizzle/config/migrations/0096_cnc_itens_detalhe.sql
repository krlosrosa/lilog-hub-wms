CREATE TYPE "public"."cnc_subtipo_ocorrencia_type" AS ENUM(
  'falta',
  'sobra',
  'avaria',
  'lote_divergente',
  'peso_divergente',
  'validade_divergente',
  'produto_nao_previsto'
);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "produto_id" varchar(50);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "sku" varchar(100);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "descricao_produto" text;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "subtipo_ocorrencia" "public"."cnc_subtipo_ocorrencia_type";
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "quantidade_esperada" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "quantidade_recebida" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "quantidade_divergente" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "quantidade_caixas" integer;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "quantidade_unidades" integer;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "unidade_medida" varchar(20);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "lote_esperado" varchar(100);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "lote_recebido" varchar(100);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "validade_esperada" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "validade_recebida" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "peso_esperado" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "peso_recebido" numeric(12, 3);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "natureza_avaria" varchar(50);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "causa_avaria" varchar(50);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "tipo_avaria" varchar(50);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "descricao_detalhe" text;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD COLUMN IF NOT EXISTS "responsavel_sugerido" "public"."cnc_responsavel_type";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "nao_conformidades_origem_origem_id_unique_idx"
  ON "cnc"."nao_conformidades" ("origem", "origem_id");
