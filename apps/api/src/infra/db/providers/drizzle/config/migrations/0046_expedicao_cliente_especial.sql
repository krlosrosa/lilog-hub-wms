CREATE TABLE "expedicao"."clientes_especiais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"cod_cliente" varchar(50) NOT NULL,
	"nome_cliente" varchar(255) NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"exige_segregacao_mapa" boolean DEFAULT false NOT NULL,
	"exige_separacao_especial" boolean DEFAULT false NOT NULL,
	"exige_carregamento_especial" boolean DEFAULT false NOT NULL,
	"observacao_separacao" text,
	"observacao_carregamento" text,
	"observacao_geral" text,
	"criado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_especiais_unidade_cod_unique" UNIQUE("unidade_id","cod_cliente")
);
--> statement-breakpoint
ALTER TABLE "expedicao"."clientes_especiais" ADD CONSTRAINT "clientes_especiais_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."clientes_especiais" ADD CONSTRAINT "clientes_especiais_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clientes_especiais_unidade_id_idx" ON "expedicao"."clientes_especiais" USING btree ("unidade_id");
