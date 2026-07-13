DO $$ BEGIN
 CREATE TYPE "public"."sessao_vinculo_tipo_type" AS ENUM('titular', 'apoio');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "tipo_vinculo" "sessao_vinculo_tipo_type" DEFAULT 'titular' NOT NULL;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "equipe_origem_id" uuid;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "sessao_origem_id" uuid;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "apoio_inicio" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "apoio_fim" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD COLUMN IF NOT EXISTS "apoio_registrado_por_user_id" integer;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_equipe_origem_id_equipes_id_fk" FOREIGN KEY ("equipe_origem_id") REFERENCES "sessao_operacao"."equipes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_sessao_origem_id_sessoes_trabalho_id_fk" FOREIGN KEY ("sessao_origem_id") REFERENCES "sessao_operacao"."sessoes_trabalho"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessao_operacao"."sessao_funcionarios" ADD CONSTRAINT "sessao_funcionarios_apoio_registrado_por_user_id_users_id_fk" FOREIGN KEY ("apoio_registrado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessao_funcionarios_apoio_ativo_idx" ON "sessao_operacao"."sessao_funcionarios" USING btree ("sessao_id") WHERE "tipo_vinculo" = 'apoio' AND "apoio_fim" IS NULL;
