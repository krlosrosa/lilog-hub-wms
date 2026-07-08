ALTER TABLE "recebimento"."pre_recebimentos" RENAME COLUMN "transportadora_id" TO "transportadora_nome";
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ALTER COLUMN "transportadora_nome" TYPE varchar(255);
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ALTER COLUMN "transportadora_nome" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ALTER COLUMN "placa" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ADD COLUMN "numero_ocr" varchar(100);
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ADD COLUMN "numero_transporte" varchar(100);
--> statement-breakpoint
ALTER TABLE "recebimento"."pre_recebimentos" ADD COLUMN "origem_dados" varchar(30) DEFAULT 'manual' NOT NULL;
--> statement-breakpoint
CREATE TABLE "recebimento"."notas_fiscais_pre_recebimento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pre_recebimento_id" uuid NOT NULL,
	"numero_nf" varchar(20) NOT NULL,
	"serie" varchar(5),
	"chave_acesso" varchar(44),
	"numero_remessa" varchar(100),
	"fornecedor_nome" varchar(255),
	"fornecedor_documento" varchar(20),
	"peso_total" numeric(12, 3),
	"volume_total" numeric(12, 3),
	"observacao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recebimento"."notas_fiscais_pre_recebimento" ADD CONSTRAINT "notas_fiscais_pre_recebimento_pre_recebimento_id_pre_recebimentos_id_fk" FOREIGN KEY ("pre_recebimento_id") REFERENCES "recebimento"."pre_recebimentos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "nfs_pre_recebimento_pre_id_idx" ON "recebimento"."notas_fiscais_pre_recebimento" USING btree ("pre_recebimento_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "nfs_pre_recebimento_chave_acesso_unique_idx" ON "recebimento"."notas_fiscais_pre_recebimento" USING btree ("chave_acesso") WHERE "chave_acesso" is not null;
