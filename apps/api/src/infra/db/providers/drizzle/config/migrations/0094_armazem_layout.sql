CREATE TYPE "public"."armazem_layout_elemento_tipo" AS ENUM('estante', 'corredor', 'doca', 'staging', 'saida');--> statement-breakpoint
CREATE TABLE "estoque"."armazem_layouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"grid_cols" integer NOT NULL,
	"grid_rows" integer NOT NULL,
	"versao" integer DEFAULT 1 NOT NULL,
	"publicado_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "armazem_layouts_unidade_unique" UNIQUE("unidade_id")
);--> statement-breakpoint
CREATE TABLE "estoque"."armazem_layout_elementos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"layout_id" uuid NOT NULL,
	"client_key" varchar(64) NOT NULL,
	"type" "public"."armazem_layout_elemento_tipo" NOT NULL,
	"gx" integer NOT NULL,
	"gy" integer NOT NULL,
	"gw" integer NOT NULL,
	"gh" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"levels" integer,
	"zona" varchar(2),
	"ordem" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "armazem_layout_elementos_layout_client_key_unique" UNIQUE("layout_id","client_key")
);--> statement-breakpoint
CREATE TABLE "estoque"."armazem_layout_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"elemento_id" uuid NOT NULL,
	"slot_index" integer DEFAULT 0 NOT NULL,
	"nivel" integer NOT NULL,
	"endereco_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "armazem_layout_slots_elemento_slot_nivel_unique" UNIQUE("elemento_id","slot_index","nivel")
);--> statement-breakpoint
ALTER TABLE "estoque"."armazem_layouts" ADD CONSTRAINT "armazem_layouts_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."armazem_layout_elementos" ADD CONSTRAINT "armazem_layout_elementos_layout_id_armazem_layouts_id_fk" FOREIGN KEY ("layout_id") REFERENCES "estoque"."armazem_layouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."armazem_layout_slots" ADD CONSTRAINT "armazem_layout_slots_elemento_id_armazem_layout_elementos_id_fk" FOREIGN KEY ("elemento_id") REFERENCES "estoque"."armazem_layout_elementos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."armazem_layout_slots" ADD CONSTRAINT "armazem_layout_slots_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "estoque"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "armazem_layouts_unidade_id_idx" ON "estoque"."armazem_layouts" USING btree ("unidade_id");--> statement-breakpoint
CREATE INDEX "armazem_layout_elementos_layout_id_idx" ON "estoque"."armazem_layout_elementos" USING btree ("layout_id");--> statement-breakpoint
CREATE INDEX "armazem_layout_slots_elemento_id_idx" ON "estoque"."armazem_layout_slots" USING btree ("elemento_id");--> statement-breakpoint
CREATE INDEX "armazem_layout_slots_endereco_id_idx" ON "estoque"."armazem_layout_slots" USING btree ("endereco_id");
