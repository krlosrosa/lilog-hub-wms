CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "auth";
--> statement-breakpoint
CREATE SCHEMA "cadastro";
--> statement-breakpoint
CREATE SCHEMA "armazenagem";
--> statement-breakpoint
CREATE SCHEMA "doca";
--> statement-breakpoint
CREATE SCHEMA "recebimento";
--> statement-breakpoint
CREATE SCHEMA "estoque";
--> statement-breakpoint
CREATE SCHEMA "documento";
--> statement-breakpoint
CREATE TYPE "public"."cluster_type" AS ENUM('Cross', 'CD-Fabrica', 'Distribuicao');--> statement-breakpoint
CREATE TYPE "public"."empresa_type" AS ENUM('LDB', 'ITB', 'DPA');--> statement-breakpoint
CREATE TYPE "public"."curva_abc_type" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."endereco_status_type" AS ENUM('disponivel', 'ocupado', 'bloqueado', 'inventario', 'inativo');--> statement-breakpoint
CREATE TYPE "public"."endereco_tipo_type" AS ENUM('picking', 'pulmao', 'recebimento', 'expedicao', 'avaria', 'inventario', 'cross_docking', 'doca');--> statement-breakpoint
CREATE TYPE "public"."endereco_tipo_estrutura_type" AS ENUM('porta-palete', 'drive-in', 'estante-dinamica', 'flow-rack');--> statement-breakpoint
CREATE TYPE "public"."doca_situacao_type" AS ENUM('disponivel', 'ocupada', 'reservada', 'bloqueada', 'manutencao');--> statement-breakpoint
CREATE TYPE "public"."doca_tipo_type" AS ENUM('recebimento', 'expedicao', 'compartilhada');--> statement-breakpoint
CREATE TYPE "public"."operacao_doca_prioridade_type" AS ENUM('urgente', 'prioritaria', 'normal', 'baixa');--> statement-breakpoint
CREATE TYPE "public"."operacao_doca_situacao_type" AS ENUM('agendada', 'aguardando_veiculo', 'em_execucao', 'finalizada', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."operacao_doca_tipo_type" AS ENUM('recebimento', 'expedicao', 'transferencia', 'cross_docking', 'devolucao');--> statement-breakpoint
CREATE TYPE "public"."pre_recebimento_situacao_type" AS ENUM('agendado', 'veiculo_chegou', 'em_recebimento', 'aguardando_aprovacao', 'aprovado', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."recebimento_situacao_type" AS ENUM('em_recebimento', 'aguardando_aprovacao', 'aprovado', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."tipo_divergencia_type" AS ENUM('quantidade_maior', 'quantidade_menor', 'produto_nao_esperado', 'produto_ausente', 'divergencia_lote', 'divergencia_peso', 'divergencia_validade');--> statement-breakpoint
CREATE TYPE "public"."contagem_tipo" AS ENUM('cega', 'validacao');--> statement-breakpoint
CREATE TYPE "public"."demanda_contagem_prioridade" AS ENUM('baixa', 'media', 'alta', 'critica');--> statement-breakpoint
CREATE TYPE "public"."demanda_contagem_status" AS ENUM('aguardando_inicio', 'em_andamento', 'concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."demanda_contagem_tipo" AS ENUM('cega', 'validacao');--> statement-breakpoint
CREATE TYPE "public"."demanda_endereco_status" AS ENUM('pendente', 'em_andamento', 'conferido');--> statement-breakpoint
CREATE TYPE "public"."inventario_status" AS ENUM('agendado', 'em_progresso', 'pausado', 'concluido');--> statement-breakpoint
CREATE TYPE "public"."inventario_tipo" AS ENUM('ciclo', 'geral');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE', 'DEVOLUCAO');--> statement-breakpoint
CREATE TYPE "public"."documento_status" AS ENUM('pending', 'ativo', 'deletado');--> statement-breakpoint
CREATE TABLE "audit"."audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer,
	"user_email" varchar(255),
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" varchar(255),
	"http_method" varchar(10) NOT NULL,
	"http_path" varchar(500) NOT NULL,
	"http_status" integer NOT NULL,
	"payload" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."funcionarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"matricula" varchar(50) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"cargo" varchar(50) NOT NULL,
	"situacao" varchar(20) DEFAULT 'ativo' NOT NULL,
	"data_admissao" date NOT NULL,
	"telefone" varchar(20),
	"email" varchar(200),
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "funcionarios_unidade_matricula_unique" UNIQUE("unidade_id","matricula")
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'operator' NOT NULL,
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"funcionario_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cadastro"."centros" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"centro" char(4) NOT NULL,
	"empresa" "empresa_type" NOT NULL,
	"nome" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cadastro"."produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" varchar(50) NOT NULL,
	"sku" varchar(50) NOT NULL,
	"descricao" text NOT NULL,
	"empresa" varchar(30) NOT NULL,
	"categoria" varchar(30) NOT NULL,
	"tipo" varchar(10) NOT NULL,
	"ean" varchar(20),
	"dum" varchar(20),
	"shelf_life" integer,
	"peso_bruto_unidade" numeric(10, 3),
	"peso_bruto_caixa" numeric(10, 3),
	"peso_bruto_palete" numeric(10, 3),
	"unidades_por_caixa" integer,
	"caixas_por_palete" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_produto_id_unique" UNIQUE("produto_id"),
	CONSTRAINT "produtos_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "cadastro"."unidades" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cluster" "cluster_type" NOT NULL,
	"nome_filial" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "armazenagem"."enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endereco_mascarado" varchar(100) NOT NULL,
	"centro_id" uuid NOT NULL,
	"zona" varchar(100) NOT NULL,
	"rua" varchar(10) DEFAULT '0000' NOT NULL,
	"posicao" varchar(10) DEFAULT '000' NOT NULL,
	"nivel" varchar(10) DEFAULT '00' NOT NULL,
	"tipo" "endereco_tipo_type" NOT NULL,
	"status" "endereco_status_type" DEFAULT 'disponivel' NOT NULL,
	"tipo_estrutura" "endereco_tipo_estrutura_type" NOT NULL,
	"largura_mm" integer NOT NULL,
	"altura_mm" integer NOT NULL,
	"profundidade_mm" integer NOT NULL,
	"carga_max_kg" numeric(10, 2) NOT NULL,
	"capacidade_volume" numeric(10, 2),
	"prioridade_picking" integer,
	"coordenada_x" numeric(10, 2),
	"coordenada_y" numeric(10, 2),
	"coordenada_z" numeric(10, 2),
	"observacao" text,
	"vinculo_sku_fixo" boolean DEFAULT false NOT NULL,
	"regra_lote_unico" boolean DEFAULT false NOT NULL,
	"permite_mistura_validade" boolean DEFAULT false NOT NULL,
	"permite_fracionado" boolean DEFAULT false NOT NULL,
	"curva_abc" "curva_abc_type" DEFAULT 'B' NOT NULL,
	"ocupacao_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enderecos_centro_endereco_mascarado_unique" UNIQUE("centro_id","endereco_mascarado")
);
--> statement-breakpoint
CREATE TABLE "doca"."docas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"tipo" "doca_tipo_type" NOT NULL,
	"situacao" "doca_situacao_type" DEFAULT 'disponivel' NOT NULL,
	"capacidade_veiculos" integer,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "docas_unidade_codigo_unique" UNIQUE("unidade_id","codigo")
);
--> statement-breakpoint
CREATE TABLE "doca"."operacoes_doca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doca_id" uuid NOT NULL,
	"tipo_operacao" "operacao_doca_tipo_type" NOT NULL,
	"veiculo_id" uuid NOT NULL,
	"transportadora_id" uuid NOT NULL,
	"motorista" text,
	"data_prevista" timestamp with time zone,
	"data_inicio" timestamp with time zone,
	"data_fim" timestamp with time zone,
	"situacao" "operacao_doca_situacao_type" DEFAULT 'agendada' NOT NULL,
	"prioridade" "operacao_doca_prioridade_type" DEFAULT 'normal' NOT NULL,
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."checklist_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"lacre" varchar(100),
	"temp_bau" numeric(5, 1),
	"temp_produto" numeric(5, 1),
	"condicao_limpeza" boolean DEFAULT false NOT NULL,
	"condicao_odor" boolean DEFAULT false NOT NULL,
	"condicao_estrutura" boolean DEFAULT false NOT NULL,
	"condicao_vedacao" boolean DEFAULT false NOT NULL,
	"observacoes" text,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checklist_recebimento_recebimento_id_unique" UNIQUE("recebimento_id")
);
--> statement-breakpoint
CREATE TABLE "recebimento"."divergencias_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"produto_id" uuid,
	"tipo_divergencia" "tipo_divergencia_type" NOT NULL,
	"quantidade_esperada" numeric(12, 3),
	"quantidade_recebida" numeric(12, 3),
	"descricao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."itens_pre_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pre_recebimento_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade_esperada" numeric(12, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"lote_esperado" varchar(100),
	"peso_esperado" numeric(12, 3),
	"validade_esperada" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."itens_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"produto_id" uuid NOT NULL,
	"quantidade_recebida" numeric(12, 3) NOT NULL,
	"unidade_medida" varchar(20) NOT NULL,
	"lote_recebido" varchar(100),
	"peso_recebido" numeric(12, 3),
	"validade" timestamp with time zone,
	"numero_serie" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."pre_recebimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unidade_id" varchar(50) NOT NULL,
	"transportadora_id" varchar(50) NOT NULL,
	"placa" varchar(20) NOT NULL,
	"horario_previsto" timestamp with time zone NOT NULL,
	"observacao" text,
	"situacao" "pre_recebimento_situacao_type" DEFAULT 'agendado' NOT NULL,
	"data_chegada" timestamp with time zone,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."recebimento_avarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recebimento_id" uuid NOT NULL,
	"produto_id" uuid,
	"tipo" varchar(50) NOT NULL,
	"natureza" varchar(50) NOT NULL,
	"causa" varchar(50) NOT NULL,
	"quantidade_caixas" integer DEFAULT 0 NOT NULL,
	"quantidade_unidades" integer DEFAULT 0 NOT NULL,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"replicado" boolean DEFAULT false NOT NULL,
	"operator_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recebimento"."recebimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pre_recebimento_id" uuid NOT NULL,
	"doca_id" uuid,
	"responsavel_id" integer NOT NULL,
	"data_inicio" timestamp with time zone NOT NULL,
	"data_fim" timestamp with time zone,
	"situacao" "recebimento_situacao_type" DEFAULT 'em_recebimento' NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque"."contagem_avarias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_endereco_id" uuid NOT NULL,
	"contagem_id" uuid,
	"motivo" varchar(255) NOT NULL,
	"quantidade_caixas" integer DEFAULT 0 NOT NULL,
	"quantidade_unidades" integer DEFAULT 0 NOT NULL,
	"photo_count" integer DEFAULT 0 NOT NULL,
	"operator_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque"."contagens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_endereco_id" uuid NOT NULL,
	"tipo" "contagem_tipo" NOT NULL,
	"operator_id" integer NOT NULL,
	"codigo_produto" varchar(100) NOT NULL,
	"produto_id" uuid,
	"quantidade_caixas" integer DEFAULT 0 NOT NULL,
	"quantidade_unidades" integer DEFAULT 0 NOT NULL,
	"lote" varchar(100),
	"peso" numeric(12, 3),
	"endereco_confirmado" varchar(100),
	"sscc" varchar(100),
	"endereco_vazio" boolean DEFAULT false NOT NULL,
	"anomalia_encontrada" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque"."demanda_enderecos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"demanda_id" uuid NOT NULL,
	"endereco_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"status" "demanda_endereco_status" DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "demanda_enderecos_demanda_endereco_unique" UNIQUE("demanda_id","endereco_id"),
	CONSTRAINT "demanda_enderecos_demanda_sequence_unique" UNIQUE("demanda_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "estoque"."demandas_contagem" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventario_id" uuid NOT NULL,
	"nome" varchar(255) NOT NULL,
	"tipo" "demanda_contagem_tipo" NOT NULL,
	"prioridade" "demanda_contagem_prioridade" DEFAULT 'media' NOT NULL,
	"status" "demanda_contagem_status" DEFAULT 'aguardando_inicio' NOT NULL,
	"responsavel_id" integer NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"filtros" jsonb NOT NULL,
	"observacoes" text DEFAULT '' NOT NULL,
	"alerta_fragilidade" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estoque"."inventarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"tipo" "inventario_tipo" NOT NULL,
	"status" "inventario_status" DEFAULT 'agendado' NOT NULL,
	"data_programada" timestamp with time zone NOT NULL,
	"centro_id" uuid NOT NULL,
	"responsavel_gestor_id" integer,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventarios_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "estoque"."movement_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" varchar(100) NOT NULL,
	"lot_number" varchar(100),
	"serial_number" varchar(100),
	"from_location" varchar(100),
	"to_location" varchar(100),
	"movement_type" "movement_type" NOT NULL,
	"quantity" numeric(18, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"operator_id" uuid NOT NULL,
	"document_ref" varchar(255),
	"notes" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documento"."documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(255) NOT NULL,
	"chave" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"tamanho" integer NOT NULL,
	"entidade_tipo" varchar(50),
	"entidade_id" varchar(100),
	"status" "documento_status" DEFAULT 'pending' NOT NULL,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documentos_chave_unique" UNIQUE("chave")
);
--> statement-breakpoint
ALTER TABLE "auth"."funcionarios" ADD CONSTRAINT "funcionarios_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD CONSTRAINT "users_funcionario_id_funcionarios_id_fk" FOREIGN KEY ("funcionario_id") REFERENCES "auth"."funcionarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cadastro"."centros" ADD CONSTRAINT "centros_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "armazenagem"."enderecos" ADD CONSTRAINT "enderecos_centro_id_centros_id_fk" FOREIGN KEY ("centro_id") REFERENCES "cadastro"."centros"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doca"."docas" ADD CONSTRAINT "docas_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doca"."operacoes_doca" ADD CONSTRAINT "operacoes_doca_doca_id_docas_id_fk" FOREIGN KEY ("doca_id") REFERENCES "doca"."docas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."checklist_recebimento" ADD CONSTRAINT "checklist_recebimento_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" ADD CONSTRAINT "divergencias_recebimento_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" ADD CONSTRAINT "divergencias_recebimento_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" ADD CONSTRAINT "itens_pre_recebimento_pre_recebimento_id_pre_recebimentos_id_fk" FOREIGN KEY ("pre_recebimento_id") REFERENCES "recebimento"."pre_recebimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" ADD CONSTRAINT "itens_pre_recebimento_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ADD CONSTRAINT "pre_recebimentos_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "cadastro"."unidades"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD CONSTRAINT "recebimento_avarias_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD CONSTRAINT "recebimento_avarias_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD CONSTRAINT "recebimento_avarias_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" ADD CONSTRAINT "recebimentos_pre_recebimento_id_pre_recebimentos_id_fk" FOREIGN KEY ("pre_recebimento_id") REFERENCES "recebimento"."pre_recebimentos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" ADD CONSTRAINT "recebimentos_doca_id_docas_id_fk" FOREIGN KEY ("doca_id") REFERENCES "doca"."docas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" ADD CONSTRAINT "recebimentos_responsavel_id_funcionarios_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "auth"."funcionarios"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagem_avarias" ADD CONSTRAINT "contagem_avarias_demanda_endereco_id_demanda_enderecos_id_fk" FOREIGN KEY ("demanda_endereco_id") REFERENCES "estoque"."demanda_enderecos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagem_avarias" ADD CONSTRAINT "contagem_avarias_contagem_id_contagens_id_fk" FOREIGN KEY ("contagem_id") REFERENCES "estoque"."contagens"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagem_avarias" ADD CONSTRAINT "contagem_avarias_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD CONSTRAINT "contagens_demanda_endereco_id_demanda_enderecos_id_fk" FOREIGN KEY ("demanda_endereco_id") REFERENCES "estoque"."demanda_enderecos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD CONSTRAINT "contagens_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD CONSTRAINT "contagens_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "cadastro"."produtos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."demanda_enderecos" ADD CONSTRAINT "demanda_enderecos_demanda_id_demandas_contagem_id_fk" FOREIGN KEY ("demanda_id") REFERENCES "estoque"."demandas_contagem"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."demanda_enderecos" ADD CONSTRAINT "demanda_enderecos_endereco_id_enderecos_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "armazenagem"."enderecos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."demandas_contagem" ADD CONSTRAINT "demandas_contagem_inventario_id_inventarios_id_fk" FOREIGN KEY ("inventario_id") REFERENCES "estoque"."inventarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."demandas_contagem" ADD CONSTRAINT "demandas_contagem_responsavel_id_users_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "auth"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventarios" ADD CONSTRAINT "inventarios_centro_id_centros_id_fk" FOREIGN KEY ("centro_id") REFERENCES "cadastro"."centros"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estoque"."inventarios" ADD CONSTRAINT "inventarios_responsavel_gestor_id_users_id_fk" FOREIGN KEY ("responsavel_gestor_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;