CREATE SCHEMA "transporte";
--> statement-breakpoint
CREATE TYPE "public"."transportadora_status_type" AS ENUM('ativa', 'inativa');--> statement-breakpoint
CREATE TABLE "transporte"."transportadora_placas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transportadora_id" uuid NOT NULL,
	"id_ravex_veiculo" integer NOT NULL,
	"placa" varchar(10) NOT NULL,
	"tipo_veiculo_id_ravex" integer,
	"tipo_veiculo_nome" varchar(100),
	"peso" numeric(12, 2),
	"cubagem" numeric(12, 2),
	"tara" numeric(12, 2),
	"estrangeiro" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transportadora_placas_transportadora_placa_unique" UNIQUE("transportadora_id","placa"),
	CONSTRAINT "transportadora_placas_transportadora_ravex_veiculo_unique" UNIQUE("transportadora_id","id_ravex_veiculo")
);
--> statement-breakpoint
CREATE TABLE "transporte"."transportadoras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"id_ravex_transportadora" integer NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cnpj" varchar(14) NOT NULL,
	"status" "transportadora_status_type" DEFAULT 'ativa' NOT NULL,
	"quantidade_veiculos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transportadoras_unidade_ravex_unique" UNIQUE("unidade_id","id_ravex_transportadora")
);
--> statement-breakpoint
ALTER TABLE "transporte"."transportadora_placas" ADD CONSTRAINT "transportadora_placas_transportadora_id_transportadoras_id_fk" FOREIGN KEY ("transportadora_id") REFERENCES "transporte"."transportadoras"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transporte"."transportadoras" ADD CONSTRAINT "transportadoras_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;