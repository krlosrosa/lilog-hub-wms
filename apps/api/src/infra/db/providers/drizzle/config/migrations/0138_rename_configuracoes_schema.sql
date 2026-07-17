DROP TABLE IF EXISTS "operacional"."regras_processo" CASCADE;
--> statement-breakpoint
UPDATE "operacional"."configuracoes_operacionais"
SET dominio = 'configuracoes'
WHERE dominio = 'operacional';
--> statement-breakpoint
ALTER SCHEMA "operacional" RENAME TO "configuracoes";
