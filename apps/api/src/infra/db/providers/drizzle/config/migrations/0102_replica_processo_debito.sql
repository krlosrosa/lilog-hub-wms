CREATE TYPE "public"."tipo_contestacao_type" AS ENUM('erro_conferencia', 'nf_incorreta', 'avaria_nao_procedente', 'outros');
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."processo_debito_replicas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"processo_debito_id" uuid NOT NULL,
	"transportadora_id" uuid NOT NULL,
	"tipo_contestacao" "tipo_contestacao_type" NOT NULL,
	"descricao" text NOT NULL,
	"anexo_chaves" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_replicas" ADD CONSTRAINT "processo_debito_replicas_processo_debito_id_processos_debito_id_fk" FOREIGN KEY ("processo_debito_id") REFERENCES "cobranca_transportadora"."processos_debito"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."processo_debito_replicas" ADD CONSTRAINT "processo_debito_replicas_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "processo_debito_replicas_processo_id_idx" ON "cobranca_transportadora"."processo_debito_replicas" USING btree ("processo_debito_id");
--> statement-breakpoint
CREATE INDEX "processo_debito_replicas_transportadora_id_idx" ON "cobranca_transportadora"."processo_debito_replicas" USING btree ("transportadora_id");
