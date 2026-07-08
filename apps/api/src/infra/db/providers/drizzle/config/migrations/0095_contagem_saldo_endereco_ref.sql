ALTER TABLE "estoque"."contagens" ADD COLUMN "saldo_endereco_id" uuid;--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD COLUMN "corresponde_ao_esperado" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "estoque"."contagens" ADD CONSTRAINT "contagens_saldo_endereco_id_saldos_endereco_id_fk" FOREIGN KEY ("saldo_endereco_id") REFERENCES "estoque"."saldos_endereco"("id") ON DELETE set null ON UPDATE no action;
