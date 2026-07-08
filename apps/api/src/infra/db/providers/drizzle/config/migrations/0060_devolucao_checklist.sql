CREATE TABLE "devolucao"."devolucao_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"dock" varchar(100) NOT NULL,
	"paletes_recebidos" integer NOT NULL,
	"temp_bau" numeric(5, 1),
	"temp_produto" numeric(5, 1),
	"condicao_limpeza" boolean DEFAULT false NOT NULL,
	"condicao_odor" boolean DEFAULT false NOT NULL,
	"condicao_estrutura" boolean DEFAULT false NOT NULL,
	"condicao_vedacao" boolean DEFAULT false NOT NULL,
	"observacoes" text,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"criado_por_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devolucao_checklist_demanda_id_unique" UNIQUE("demanda_id")
);
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_checklist" ADD CONSTRAINT "devolucao_checklist_demanda_id_demandas_devolucao_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "devolucao"."demandas_devolucao"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_checklist" ADD CONSTRAINT "devolucao_checklist_criado_por_user_id_users_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "devolucao_checklist_demanda_id_idx" ON "devolucao"."devolucao_checklist" USING btree ("demanda_id");
