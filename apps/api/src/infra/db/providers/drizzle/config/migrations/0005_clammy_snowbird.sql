CREATE TABLE IF NOT EXISTS "armazenagem"."politica_armazenagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"endereco_divergente" varchar(30) DEFAULT 'bloquear' NOT NULL,
	"quantidade_parcial" varchar(30) DEFAULT 'permitir_com_motivo' NOT NULL,
	"exigir_bipagem_produto" boolean DEFAULT true NOT NULL,
	"exigir_bipagem_endereco" boolean DEFAULT true NOT NULL,
	"permitir_offline" boolean DEFAULT true NOT NULL,
	"concluir_automaticamente" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "politica_armazenagem_unidade_id_unique" UNIQUE("unidade_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "armazenagem"."politica_armazenagem" ADD CONSTRAINT "politica_armazenagem_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
