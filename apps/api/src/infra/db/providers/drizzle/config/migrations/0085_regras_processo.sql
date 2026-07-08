CREATE TABLE "operacional"."regras_processo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"gatilho" varchar(50) NOT NULL,
	"prioridade" integer DEFAULT 10 NOT NULL,
	"modo_avaliacao" varchar(50) DEFAULT 'parar_no_primeiro_match' NOT NULL,
	"arvore_condicoes" jsonb NOT NULL,
	"acoes" jsonb NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "regras_processo_unidade_gatilho_nome_unique" UNIQUE("unidade_id","gatilho","nome")
);--> statement-breakpoint
ALTER TABLE "operacional"."regras_processo" ADD CONSTRAINT "regras_processo_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE cascade ON UPDATE no action;
