CREATE TYPE "public"."demanda_armazenagem_status" AS ENUM('aguardando_inicio', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."item_armazenagem_status" AS ENUM('pendente', 'em_andamento', 'armazenado', 'divergente');--> statement-breakpoint
CREATE TYPE "public"."unitizador_origem" AS ENUM('palete_virgem', 'gerado_sistema');--> statement-breakpoint
CREATE TYPE "public"."unitizador_status" AS ENUM('virgem', 'em_recebimento', 'aguardando_armazenagem', 'armazenado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."unitizador_tipo" AS ENUM('palete', 'volume', 'caixa');--> statement-breakpoint
CREATE TABLE "armazenagem"."demandas_armazenagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"modo_unitizacao" varchar(50) NOT NULL,
	"status" "demanda_armazenagem_status" DEFAULT 'aguardando_inicio' NOT NULL,
	"responsavel_id" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demandas_armazenagem_recebimento_id_unique" UNIQUE("recebimento_id")
);
--> statement-breakpoint
CREATE TABLE "armazenagem"."itens_armazenagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"unitizador_id" uuid,
	"produto_id" uuid NOT NULL,
	"quantidade" numeric(18, 4) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"lote" varchar(100),
	"validade" timestamp with time zone,
	"numero_serie" varchar(100),
	"endereco_sugerido_id" uuid,
	"endereco_confirmado_id" uuid,
	"status" "item_armazenagem_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "armazenagem"."unitizadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(100) NOT NULL,
	"tipo" "unitizador_tipo" DEFAULT 'palete' NOT NULL,
	"origem" "unitizador_origem" NOT NULL,
	"status" "unitizador_status" DEFAULT 'virgem' NOT NULL,
	"recebimento_id" uuid,
	"endereco_atual_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unitizadores_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);
--> statement-breakpoint
ALTER TABLE "cadastro"."unidades" ADD COLUMN "modo_unitizacao_recebimento" varchar(50) DEFAULT 'gerar_etiqueta_na_armazenagem' NOT NULL;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN "unitizador_id" uuid;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" ADD COLUMN "modo_unitizacao" varchar(50) DEFAULT 'gerar_etiqueta_na_armazenagem' NOT NULL;--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD CONSTRAINT "demandas_armazenagem_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD CONSTRAINT "demandas_armazenagem_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_demanda_id_demandas_armazenagem_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "armazenagem"."demandas_armazenagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_unitizador_id_unitizadores_id_fk" FOREIGN KEY ("unitizador_id") REFERENCES "armazenagem"."unitizadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_endereco_sugerido_id_enderecos_id_fk" FOREIGN KEY ("endereco_sugerido_id") REFERENCES "armazenagem"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_endereco_confirmado_id_enderecos_id_fk" FOREIGN KEY ("endereco_confirmado_id") REFERENCES "armazenagem"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."unitizadores" ADD CONSTRAINT "unitizadores_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."unitizadores" ADD CONSTRAINT "unitizadores_endereco_atual_id_enderecos_id_fk" FOREIGN KEY ("endereco_atual_id") REFERENCES "armazenagem"."enderecos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_unitizador_id_unitizadores_id_fk" FOREIGN KEY ("unitizador_id") REFERENCES "armazenagem"."unitizadores"("id") ON DELETE set null ON UPDATE no action;