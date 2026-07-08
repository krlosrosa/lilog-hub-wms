CREATE TYPE "public"."pre_recebimento_situacao_type_new" AS ENUM(
  'agendado',
  'liberado_para_conferencia',
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado'
);--> statement-breakpoint
CREATE TYPE "public"."recebimento_situacao_type_new" AS ENUM(
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado'
);--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos"
  ALTER COLUMN "situacao" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos"
  ALTER COLUMN "situacao" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos"
  ALTER COLUMN "situacao" TYPE "public"."pre_recebimento_situacao_type_new"
  USING (
    CASE "situacao"::text
      WHEN 'veiculo_chegou' THEN 'liberado_para_conferencia'
      WHEN 'em_recebimento' THEN 'em_conferencia'
      WHEN 'aguardando_aprovacao' THEN 'conferido'
      WHEN 'aprovado' THEN 'conferido'
      ELSE "situacao"::text
    END
  )::"public"."pre_recebimento_situacao_type_new";--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos"
  ALTER COLUMN "situacao" TYPE "public"."recebimento_situacao_type_new"
  USING (
    CASE "situacao"::text
      WHEN 'em_recebimento' THEN 'em_conferencia'
      WHEN 'aguardando_aprovacao' THEN 'conferido'
      WHEN 'aprovado' THEN 'conferido'
      ELSE "situacao"::text
    END
  )::"public"."recebimento_situacao_type_new";--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos"
  ALTER COLUMN "situacao" SET DEFAULT 'agendado';--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos"
  ALTER COLUMN "situacao" SET DEFAULT 'em_conferencia';--> statement-breakpoint
DROP TYPE "public"."pre_recebimento_situacao_type";--> statement-breakpoint
DROP TYPE "public"."recebimento_situacao_type";--> statement-breakpoint
ALTER TYPE "public"."pre_recebimento_situacao_type_new" RENAME TO "pre_recebimento_situacao_type";--> statement-breakpoint
ALTER TYPE "public"."recebimento_situacao_type_new" RENAME TO "recebimento_situacao_type";
