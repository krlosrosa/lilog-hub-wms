ALTER TYPE "public"."cnc_responsavel_type" ADD VALUE IF NOT EXISTS 'fabrica';
--> statement-breakpoint
CREATE TYPE "public"."cnc_situacao_type_new" AS ENUM('pendente', 'em_analise', 'encerrada', 'cancelada');
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ALTER COLUMN "situacao" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades"
  ALTER COLUMN "situacao" TYPE "public"."cnc_situacao_type_new"
  USING (
    CASE "situacao"::text
      WHEN 'aprovado' THEN 'encerrada'
      WHEN 'rejeitado' THEN 'cancelada'
      WHEN 'encerrado' THEN 'encerrada'
      ELSE "situacao"::text
    END
  )::"public"."cnc_situacao_type_new";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ALTER COLUMN "situacao" SET DEFAULT 'pendente';
--> statement-breakpoint
DROP TYPE "public"."cnc_situacao_type";
--> statement-breakpoint
ALTER TYPE "public"."cnc_situacao_type_new" RENAME TO "cnc_situacao_type";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" DROP CONSTRAINT IF EXISTS "nao_conformidades_aprovador_id_funcionarios_id_fk";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" DROP COLUMN IF EXISTS "aprovador_id";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" DROP COLUMN IF EXISTS "data_aprovacao";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" DROP COLUMN IF EXISTS "observacao_aprovador";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" DROP COLUMN IF EXISTS "debito_confirmado";
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD COLUMN IF NOT EXISTS "analista_id" integer;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD COLUMN IF NOT EXISTS "iniciado_em" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD COLUMN IF NOT EXISTS "encerrado_em" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD COLUMN IF NOT EXISTS "encerrado_por_user_id" integer;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD CONSTRAINT "nao_conformidades_analista_id_users_id_fk" FOREIGN KEY ("analista_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD CONSTRAINT "nao_conformidades_encerrado_por_user_id_users_id_fk" FOREIGN KEY ("encerrado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "cnc"."cnc_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnc_id" uuid NOT NULL,
	"tipo_evento" varchar(80) NOT NULL,
	"situacao_anterior" varchar(50),
	"situacao_nova" varchar(50),
	"descricao" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_eventos" ADD CONSTRAINT "cnc_eventos_cnc_id_nao_conformidades_id_fk" FOREIGN KEY ("cnc_id") REFERENCES "cnc"."nao_conformidades"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_eventos" ADD CONSTRAINT "cnc_eventos_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cnc_eventos_cnc_id_idx" ON "cnc"."cnc_eventos" USING btree ("cnc_id");
--> statement-breakpoint
CREATE TABLE "cnc"."cnc_tratativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnc_id" uuid NOT NULL,
	"tipo" varchar(50) NOT NULL,
	"descricao" text NOT NULL,
	"responsavel_tipo" varchar(50) NOT NULL,
	"prazo" timestamp with time zone,
	"concluida_em" timestamp with time zone,
	"concluida_por_user_id" integer,
	"status" varchar(30) DEFAULT 'pendente' NOT NULL,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_tratativas" ADD CONSTRAINT "cnc_tratativas_cnc_id_nao_conformidades_id_fk" FOREIGN KEY ("cnc_id") REFERENCES "cnc"."nao_conformidades"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_tratativas" ADD CONSTRAINT "cnc_tratativas_concluida_por_user_id_users_id_fk" FOREIGN KEY ("concluida_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_tratativas" ADD CONSTRAINT "cnc_tratativas_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cnc_tratativas_cnc_id_idx" ON "cnc"."cnc_tratativas" USING btree ("cnc_id");
