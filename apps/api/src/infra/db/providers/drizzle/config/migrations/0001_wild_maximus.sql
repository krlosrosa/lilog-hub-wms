CREATE SCHEMA "cnc";
--> statement-breakpoint
CREATE TYPE "public"."cnc_item_tipo_type" AS ENUM('divergencia', 'avaria');--> statement-breakpoint
CREATE TYPE "public"."cnc_origem_type" AS ENUM('recebimento');--> statement-breakpoint
CREATE TYPE "public"."cnc_responsavel_type" AS ENUM('transportadora', 'fornecedor', 'operacao', 'indeterminado');--> statement-breakpoint
CREATE TYPE "public"."cnc_situacao_type" AS ENUM('pendente', 'em_analise', 'aprovado', 'rejeitado', 'encerrado');--> statement-breakpoint
CREATE TABLE "cnc"."cnc_itens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnc_id" uuid NOT NULL,
	"tipo" "cnc_item_tipo_type" NOT NULL,
	"referencia_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cnc"."nao_conformidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero" varchar(30) NOT NULL,
	"origem" "cnc_origem_type" NOT NULL,
	"origem_id" uuid NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"responsavel" "cnc_responsavel_type" DEFAULT 'indeterminado' NOT NULL,
	"responsavel_id" varchar(50),
	"descricao" text,
	"acao_imediata" text,
	"acao_corretiva" text,
	"situacao" "cnc_situacao_type" DEFAULT 'pendente' NOT NULL,
	"solicitante_id" integer NOT NULL,
	"aprovador_id" integer,
	"data_aprovacao" timestamp with time zone,
	"observacao_aprovador" text,
	"valor_debito" numeric(12, 2),
	"debito_confirmado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nao_conformidades_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
ALTER TABLE "cnc"."cnc_itens" ADD CONSTRAINT "cnc_itens_cnc_id_nao_conformidades_id_fk" FOREIGN KEY ("cnc_id") REFERENCES "cnc"."nao_conformidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD CONSTRAINT "nao_conformidades_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD CONSTRAINT "nao_conformidades_solicitante_id_funcionarios_id_fk" FOREIGN KEY ("solicitante_id") REFERENCES "auth"."funcionarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cnc"."nao_conformidades" ADD CONSTRAINT "nao_conformidades_aprovador_id_funcionarios_id_fk" FOREIGN KEY ("aprovador_id") REFERENCES "auth"."funcionarios"("id") ON DELETE set null ON UPDATE no action;