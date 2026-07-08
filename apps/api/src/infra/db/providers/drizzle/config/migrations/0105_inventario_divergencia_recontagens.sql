CREATE TABLE "estoque"."inventario_divergencia_recontagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventario_id" uuid NOT NULL,
	"divergencia_id" uuid NOT NULL,
	"demanda_id" uuid NOT NULL,
	"solicitada_por" integer,
	"responsavel_id" integer NOT NULL,
	"motivo" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventario_divergencia_recontagens_demanda_id_unique" UNIQUE("demanda_id")
);--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencia_recontagens" ADD CONSTRAINT "inventario_divergencia_recontagens_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "estoque"."inventarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencia_recontagens" ADD CONSTRAINT "inventario_divergencia_recontagens_divergencia_id_inventario_divergencias_id_fk" FOREIGN KEY ("divergencia_id") REFERENCES "estoque"."inventario_divergencias"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencia_recontagens" ADD CONSTRAINT "inventario_divergencia_recontagens_demanda_id_demandas_contagem_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "estoque"."demandas_contagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencia_recontagens" ADD CONSTRAINT "inventario_divergencia_recontagens_solicitada_por_users_id_fk" FOREIGN KEY ("solicitada_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventario_divergencia_recontagens" ADD CONSTRAINT "inventario_divergencia_recontagens_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inventario_divergencia_recontagens_inventario_id_idx" ON "estoque"."inventario_divergencia_recontagens" USING btree ("inventario_id");--> statement-breakpoint
CREATE INDEX "inventario_divergencia_recontagens_divergencia_id_idx" ON "estoque"."inventario_divergencia_recontagens" USING btree ("divergencia_id");--> statement-breakpoint
CREATE INDEX "inventario_divergencia_recontagens_demanda_id_idx" ON "estoque"."inventario_divergencia_recontagens" USING btree ("demanda_id");
