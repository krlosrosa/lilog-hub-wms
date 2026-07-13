ALTER TYPE "public"."pre_recebimento_situacao_type" ADD VALUE IF NOT EXISTS 'impedido';--> statement-breakpoint
CREATE TABLE "recebimento"."impedimentos_recebimento" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "pre_recebimento_id" uuid NOT NULL,
  "tipo" varchar(50) NOT NULL,
  "descricao" text NOT NULL,
  "photo_count" integer DEFAULT 0 NOT NULL,
  "registrado_por_id" integer,
  "registrado_em" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "recebimento"."impedimentos_recebimento"
  ADD CONSTRAINT "impedimentos_recebimento_pre_recebimento_id_pre_recebimentos_id_fk"
  FOREIGN KEY ("pre_recebimento_id")
  REFERENCES "recebimento"."pre_recebimentos"("id")
  ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recebimento"."impedimentos_recebimento"
  ADD CONSTRAINT "impedimentos_recebimento_registrado_por_id_funcionarios_id_fk"
  FOREIGN KEY ("registrado_por_id")
  REFERENCES "auth"."funcionarios"("id")
  ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "impedimentos_recebimento_pre_id_idx"
  ON "recebimento"."impedimentos_recebimento" USING btree ("pre_recebimento_id");
