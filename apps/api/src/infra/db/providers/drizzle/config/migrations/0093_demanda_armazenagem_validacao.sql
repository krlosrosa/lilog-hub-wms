CREATE TYPE "public"."demanda_armazenagem_status_new" AS ENUM(
  'aguardando_validacao',
  'aguardando_inicio',
  'em_andamento',
  'concluida',
  'cancelada'
);--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem"
  ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem"
  ALTER COLUMN "status" TYPE "public"."demanda_armazenagem_status_new"
  USING "status"::text::"public"."demanda_armazenagem_status_new";--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem"
  ALTER COLUMN "status" SET DEFAULT 'aguardando_inicio';--> statement-breakpoint
DROP TYPE "public"."demanda_armazenagem_status";--> statement-breakpoint
ALTER TYPE "public"."demanda_armazenagem_status_new" RENAME TO "demanda_armazenagem_status";--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD COLUMN "validado_por" integer;--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD COLUMN "validado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD CONSTRAINT "demandas_armazenagem_validado_por_users_id_fk" FOREIGN KEY ("validado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
