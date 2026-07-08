-- Migration 0050: produtos.produto_id vira PK; FKs filhas passam a referenciar produto_id (varchar)

--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" DROP CONSTRAINT IF EXISTS "remessa_itens_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" DROP CONSTRAINT IF EXISTS "devolucao_itens_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" DROP CONSTRAINT IF EXISTS "produto_enderecos_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" DROP CONSTRAINT IF EXISTS "itens_armazenagem_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "estoque"."saldos" DROP CONSTRAINT IF EXISTS "saldos_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" DROP CONSTRAINT IF EXISTS "movimentacoes_estoque_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "estoque"."contagens" DROP CONSTRAINT IF EXISTS "contagens_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" DROP CONSTRAINT IF EXISTS "itens_pre_recebimento_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" DROP CONSTRAINT IF EXISTS "itens_recebimento_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" DROP CONSTRAINT IF EXISTS "divergencias_recebimento_produto_id_produtos_id_fk";
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" DROP CONSTRAINT IF EXISTS "recebimento_avarias_produto_id_produtos_id_fk";

--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "expedicao"."remessa_itens" ri SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE ri."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "devolucao"."devolucao_itens" di SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE di."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "master_data"."produto_enderecos" pe SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE pe."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "armazenagem"."itens_armazenagem" ia SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE ia."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "estoque"."saldos" s SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE s."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "estoque"."saldos" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "estoque"."saldos" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "estoque"."movimentacoes_estoque" m SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE m."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "estoque"."contagens" c SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE c."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "estoque"."contagens" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "estoque"."contagens" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "recebimento"."itens_pre_recebimento" ipr SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE ipr."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "recebimento"."itens_recebimento" ir SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE ir."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "recebimento"."divergencias_recebimento" dr SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE dr."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD COLUMN "produto_id_new" varchar(50);
--> statement-breakpoint
UPDATE "recebimento"."recebimento_avarias" ra SET "produto_id_new" = p."produto_id" FROM "master_data"."produtos" p WHERE ra."produto_id" = p."id";
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" DROP COLUMN "produto_id";
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" RENAME COLUMN "produto_id_new" TO "produto_id";

--> statement-breakpoint
ALTER TABLE "master_data"."produtos" DROP CONSTRAINT "produtos_pkey";
--> statement-breakpoint
ALTER TABLE "master_data"."produtos" DROP CONSTRAINT "produtos_produto_id_unique";
--> statement-breakpoint
ALTER TABLE "master_data"."produtos" DROP COLUMN "id";
--> statement-breakpoint
ALTER TABLE "master_data"."produtos" ADD PRIMARY KEY ("produto_id");

--> statement-breakpoint
ALTER TABLE "expedicao"."remessa_itens" ADD CONSTRAINT "remessa_itens_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "devolucao"."devolucao_itens" ADD CONSTRAINT "devolucao_itens_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "master_data"."produto_enderecos" ADD CONSTRAINT "produto_enderecos_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "armazenagem"."itens_armazenagem" ADD CONSTRAINT "itens_armazenagem_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "estoque"."saldos" ADD CONSTRAINT "saldos_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "estoque"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD CONSTRAINT "contagens_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_pre_recebimento" ADD CONSTRAINT "itens_pre_recebimento_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recebimento"."divergencias_recebimento" ADD CONSTRAINT "divergencias_recebimento_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimento_avarias" ADD CONSTRAINT "recebimento_avarias_produto_id_produtos_produto_id_fk" FOREIGN KEY ("produto_id") REFERENCES "master_data"."produtos"("produto_id") ON DELETE set null ON UPDATE no action;
