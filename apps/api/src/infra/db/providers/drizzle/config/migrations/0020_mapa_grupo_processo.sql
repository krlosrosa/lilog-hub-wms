CREATE TYPE "public"."mapa_grupo_processo_type" AS ENUM('separacao', 'carregamento', 'conferencia');--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "processo" "mapa_grupo_processo_type";--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "iniciado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "finalizado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "tempo_esperado" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "expedicao"."mapa_grupos" g
SET
  "processo" = e."etapa"::text::"mapa_grupo_processo_type",
  "iniciado_em" = e."iniciado_em",
  "finalizado_em" = e."finalizado_em"
FROM "expedicao"."mapa_grupo_etapas" e
WHERE e."mapa_grupo_id" = g."id";--> statement-breakpoint
UPDATE "expedicao"."mapa_grupos"
SET "micro_uuid" = REPLACE("micro_uuid", '-conferencia', '')
WHERE "processo" = 'conferencia'
  AND "micro_uuid" LIKE '%-conferencia';--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ALTER COLUMN "processo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" DROP CONSTRAINT "mapa_grupos_micro_uuid_unique";--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_micro_uuid_processo_unique" UNIQUE("micro_uuid","processo");--> statement-breakpoint
DROP TABLE "expedicao"."mapa_grupo_etapas";--> statement-breakpoint
DROP TYPE "public"."mapa_grupo_etapa_status_type";--> statement-breakpoint
DROP TYPE "public"."mapa_grupo_etapa_type";
