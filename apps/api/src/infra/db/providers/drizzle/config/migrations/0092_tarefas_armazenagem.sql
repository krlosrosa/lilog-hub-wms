CREATE TYPE "public"."tarefa_armazenagem_status" AS ENUM('pendente', 'em_andamento', 'armazenada', 'divergente', 'cancelada');--> statement-breakpoint
CREATE TABLE "armazenagem"."tarefas_armazenagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"unitizador_id" uuid,
	"sequencia" integer NOT NULL,
	"status" "public"."tarefa_armazenagem_status" DEFAULT 'pendente' NOT NULL,
	"endereco_sugerido_id" uuid,
	"endereco_confirmado_id" uuid,
	"responsavel_id" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tarefas_armazenagem_demanda_sequencia_unique" UNIQUE("demanda_id","sequencia")
);--> statement-breakpoint
ALTER TABLE "armazenagem"."tarefas_armazenagem" ADD CONSTRAINT "tarefas_armazenagem_demanda_id_demandas_armazenagem_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "armazenagem"."demandas_armazenagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."tarefas_armazenagem" ADD CONSTRAINT "tarefas_armazenagem_unitizador_id_unitizadores_id_fk" FOREIGN KEY ("unitizador_id") REFERENCES "armazenagem"."unitizadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."tarefas_armazenagem" ADD CONSTRAINT "tarefas_armazenagem_endereco_sugerido_id_enderecos_id_fk" FOREIGN KEY ("endereco_sugerido_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."tarefas_armazenagem" ADD CONSTRAINT "tarefas_armazenagem_endereco_confirmado_id_enderecos_id_fk" FOREIGN KEY ("endereco_confirmado_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."tarefas_armazenagem" ADD CONSTRAINT "tarefas_armazenagem_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD COLUMN "tarefa_id" uuid;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_tarefa_id_tarefas_armazenagem_id_fk" FOREIGN KEY ("tarefa_id") REFERENCES "armazenagem"."tarefas_armazenagem"("id") ON DELETE cascade ON UPDATE no action;
