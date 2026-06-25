ALTER TABLE "op_wms"."demandas_separacao" ADD COLUMN "sessao_funcionario_id" uuid;--> statement-breakpoint
UPDATE "op_wms"."demandas_separacao" AS ds
SET "sessao_funcionario_id" = sf."id"
FROM "sessao_operacao"."sessao_funcionarios" AS sf
WHERE sf."sessao_id" = ds."sessao_id"
  AND sf."funcionario_id" = ds."funcionario_id"
  AND ds."sessao_funcionario_id" IS NULL;--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ALTER COLUMN "sessao_funcionario_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" DROP COLUMN "funcionario_id";--> statement-breakpoint
ALTER TABLE "op_wms"."demandas_separacao" ADD CONSTRAINT "demandas_separacao_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "demandas_separacao_sessao_funcionario_idx" ON "op_wms"."demandas_separacao" USING btree ("sessao_funcionario_id","sessao_id");--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD COLUMN "sessao_funcionario_id" uuid;--> statement-breakpoint
UPDATE "expedicao"."mapa_grupos" AS mg
SET "sessao_funcionario_id" = ds."sessao_funcionario_id"
FROM "op_wms"."demandas_separacao" AS ds
WHERE ds."mapa_grupo_id" = mg."id"
  AND mg."iniciado_em" IS NOT NULL
  AND mg."sessao_funcionario_id" IS NULL;--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" DROP CONSTRAINT IF EXISTS "mapa_grupos_funcionario_id_funcionarios_id_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "expedicao"."mapa_grupos_funcionario_id_idx";--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" DROP COLUMN IF EXISTS "funcionario_id";--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_sessao_funcionario_id_sessao_funcionarios_id_fk" FOREIGN KEY ("sessao_funcionario_id") REFERENCES "sessao_operacao"."sessao_funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mapa_grupos_sessao_funcionario_id_idx" ON "expedicao"."mapa_grupos" USING btree ("sessao_funcionario_id");
