CREATE TYPE "public"."interacao_autor_type" AS ENUM('transportadora', 'cd');
--> statement-breakpoint
CREATE TYPE "public"."interacao_tipo_type" AS ENUM('erro_conferencia', 'nf_incorreta', 'avaria_nao_procedente', 'envio_documento', 'esclarecimento', 'outros', 'solicitacao_prova', 'parecer', 'observacao_cd');
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."processo_debito_interacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_debito_id" uuid NOT NULL,
	"autor" "interacao_autor_type" NOT NULL,
	"tipo" "interacao_tipo_type" NOT NULL,
	"descricao" text NOT NULL,
	"anexo_chaves" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"transportadora_id" uuid,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_interacoes" ADD CONSTRAINT "processo_debito_interacoes_processo_debito_id_processos_debito_id_fk" FOREIGN KEY ("processo_debito_id") REFERENCES "cobranca_transportadora"."processos_debito"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_interacoes" ADD CONSTRAINT "processo_debito_interacoes_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_interacoes" ADD CONSTRAINT "processo_debito_interacoes_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "processo_debito_interacoes_processo_id_idx" ON "cobranca_transportadora"."processo_debito_interacoes" USING btree ("processo_debito_id");
--> statement-breakpoint
INSERT INTO "cobranca_transportadora"."processo_debito_interacoes"
  ("processo_debito_id", "autor", "tipo", "descricao", "anexo_chaves", "transportadora_id", "created_at")
SELECT
  "processo_debito_id",
  'transportadora'::"interacao_autor_type",
  "tipo_contestacao"::text::"interacao_tipo_type",
  "descricao",
  "anexo_chaves",
  "transportadora_id",
  "created_at"
FROM "cobranca_transportadora"."processo_debito_replicas";
