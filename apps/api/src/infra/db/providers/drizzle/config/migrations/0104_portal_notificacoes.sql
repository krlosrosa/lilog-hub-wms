CREATE TYPE "public"."portal_notificacao_tipo_type" AS ENUM('novo_debito', 'status_atualizado', 'nova_interacao');
--> statement-breakpoint
CREATE TABLE "cobranca_transportadora"."portal_notificacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transportadora_id" uuid NOT NULL,
	"processo_debito_id" uuid,
	"tipo" "portal_notificacao_tipo_type" NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"mensagem" varchar(500) NOT NULL,
	"rota_destino" varchar(300) NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"lida_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."portal_notificacoes" ADD CONSTRAINT "portal_notificacoes_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "cobranca_transportadora"."portal_notificacoes" ADD CONSTRAINT "portal_notificacoes_processo_debito_id_processos_debito_id_fk" FOREIGN KEY ("processo_debito_id") REFERENCES "cobranca_transportadora"."processos_debito"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "portal_notificacoes_transportadora_idx" ON "cobranca_transportadora"."portal_notificacoes" USING btree ("transportadora_id", "lida", "created_at" DESC);
