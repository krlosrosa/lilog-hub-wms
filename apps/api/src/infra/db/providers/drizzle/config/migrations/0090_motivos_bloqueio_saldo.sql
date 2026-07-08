CREATE TYPE "public"."origem_motivo_bloqueio_saldo_type" AS ENUM('recebimento', 'inventario', 'manual', 'qualidade', 'devolucao', 'sistema');--> statement-breakpoint
CREATE TABLE "estoque"."motivos_bloqueio_saldo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" varchar(255),
	"origem" "public"."origem_motivo_bloqueio_saldo_type" DEFAULT 'manual' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"sistema" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "motivos_bloqueio_saldo_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);
--> statement-breakpoint
ALTER TABLE "estoque"."motivos_bloqueio_saldo" ADD CONSTRAINT "motivos_bloqueio_saldo_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD COLUMN "motivo_bloqueio_id" uuid;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD COLUMN "observacao_bloqueio" varchar(255);--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD COLUMN "bloqueado_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD COLUMN "bloqueado_por" integer;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_motivo_bloqueio_id_motivos_bloqueio_saldo_id_fk" FOREIGN KEY ("motivo_bloqueio_id") REFERENCES "estoque"."motivos_bloqueio_saldo"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."saldos_endereco" ADD CONSTRAINT "saldos_endereco_bloqueado_por_users_id_fk" FOREIGN KEY ("bloqueado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
