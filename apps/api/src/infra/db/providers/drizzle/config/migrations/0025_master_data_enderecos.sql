ALTER SCHEMA "cadastro" RENAME TO "master_data";
--> statement-breakpoint
ALTER TABLE "armazenagem"."enderecos" SET SCHEMA "master_data";
