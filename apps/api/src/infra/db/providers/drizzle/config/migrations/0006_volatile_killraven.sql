CREATE SCHEMA "expedicao";
--> statement-breakpoint
CREATE TYPE "public"."origem_remessa_type" AS ENUM('upload', 'reentrega');--> statement-breakpoint
CREATE TYPE "public"."status_transporte_type" AS ENUM('pendente', 'alocado', 'parcial');--> statement-breakpoint
CREATE TYPE "public"."tipo_veiculo_type" AS ENUM('VUC', 'Toco', 'Truck_3_4', 'Carreta', 'Bitrem');--> statement-breakpoint
CREATE TABLE "expedicao"."remessas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"upload_lote_id" uuid NOT NULL,
	"remessa" varchar(100) NOT NULL,
	"empresa" varchar(100) NOT NULL,
	"cod_cliente" varchar(50) NOT NULL,
	"cliente" varchar(255) NOT NULL,
	"cidade" varchar(100) NOT NULL,
	"peso" numeric(10, 3) NOT NULL,
	"volume" numeric(10, 3) NOT NULL,
	"origem" "origem_remessa_type" DEFAULT 'upload' NOT NULL,
	"motivo_reentrega" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedicao"."transporte_remessas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transporte_id" uuid NOT NULL,
	"remessa_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transporte_remessas_transporte_remessa_unique" UNIQUE("transporte_id","remessa_id")
);
--> statement-breakpoint
CREATE TABLE "expedicao"."transportes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"upload_lote_id" uuid NOT NULL,
	"rota" varchar(100) NOT NULL,
	"regiao" varchar(100) NOT NULL,
	"cidade" varchar(100) NOT NULL,
	"bairro" varchar(100),
	"data_transporte" date NOT NULL,
	"horario_expectativa_saida" timestamp with time zone,
	"peso_total" numeric(10, 3) DEFAULT '0' NOT NULL,
	"volume_total" numeric(10, 3) DEFAULT '0' NOT NULL,
	"distancia_km" numeric(8, 2),
	"dias_alocacao" integer DEFAULT 1 NOT NULL,
	"perfil_esperado" "tipo_veiculo_type",
	"status" "status_transporte_type" DEFAULT 'pendente' NOT NULL,
	"placa" varchar(20),
	"motorista" varchar(255),
	"transportadora" varchar(255),
	"custo_previsto" numeric(10, 2),
	"frete_sem_custo" boolean DEFAULT false NOT NULL,
	"reentrega_exclusiva" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expedicao"."upload_lotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"data_referencia" date NOT NULL,
	"horario_expectativa_saida" timestamp with time zone NOT NULL,
	"nome_arquivo" varchar(255),
	"total_remessas" integer DEFAULT 0 NOT NULL,
	"criado_por" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expedicao"."remessas" ADD CONSTRAINT "remessas_upload_lote_id_upload_lotes_id_fk" FOREIGN KEY ("upload_lote_id") REFERENCES "expedicao"."upload_lotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" ADD CONSTRAINT "transporte_remessas_transporte_id_transportes_id_fk" FOREIGN KEY ("transporte_id") REFERENCES "expedicao"."transportes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transporte_remessas" ADD CONSTRAINT "transporte_remessas_remessa_id_remessas_id_fk" FOREIGN KEY ("remessa_id") REFERENCES "expedicao"."remessas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD CONSTRAINT "transportes_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."transportes" ADD CONSTRAINT "transportes_upload_lote_id_upload_lotes_id_fk" FOREIGN KEY ("upload_lote_id") REFERENCES "expedicao"."upload_lotes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."upload_lotes" ADD CONSTRAINT "upload_lotes_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expedicao"."upload_lotes" ADD CONSTRAINT "upload_lotes_criado_por_users_id_fk" FOREIGN KEY ("criado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;