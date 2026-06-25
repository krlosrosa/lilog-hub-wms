CREATE TYPE "public"."tipo_carga_type" AS ENUM('seco', 'refrigerado');--> statement-breakpoint
CREATE TABLE "transporte"."perfis_tarifas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"id_ravex" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" varchar(500),
	"peso" numeric(12, 2) NOT NULL,
	"cubagem" numeric(12, 2),
	"tipo_carga" "tipo_carga_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfis_tarifas_unidade_ravex_unique" UNIQUE("unidade_id","id_ravex")
);
--> statement-breakpoint
CREATE TABLE "transporte"."perfis_tarifas_faixas_km" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"perfil_tarifa_id" uuid NOT NULL,
	"km_inicial" numeric(10, 2) NOT NULL,
	"km_final" numeric(10, 2),
	"valor" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "perfis_tarifas_faixas_km_perfil_km_inicial_unique" UNIQUE("perfil_tarifa_id","km_inicial")
);
--> statement-breakpoint
ALTER TABLE "transporte"."perfis_tarifas" ADD CONSTRAINT "perfis_tarifas_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transporte"."perfis_tarifas_faixas_km" ADD CONSTRAINT "perfis_tarifas_faixas_km_perfil_tarifa_id_perfis_tarifas_id_fk" FOREIGN KEY ("perfil_tarifa_id") REFERENCES "transporte"."perfis_tarifas"("id") ON DELETE cascade ON UPDATE no action;