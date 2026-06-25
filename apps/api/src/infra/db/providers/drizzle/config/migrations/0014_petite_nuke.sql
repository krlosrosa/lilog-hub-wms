CREATE TABLE "expedicao"."configuracoes_impressao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"nome" varchar(120) NOT NULL,
	"configuracao" jsonb NOT NULL,
	"templates_html" jsonb NOT NULL,
	"is_padrao" boolean DEFAULT false NOT NULL,
	"criado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expedicao"."configuracoes_impressao" ADD CONSTRAINT "configuracoes_impressao_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."configuracoes_impressao" ADD CONSTRAINT "configuracoes_impressao_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;