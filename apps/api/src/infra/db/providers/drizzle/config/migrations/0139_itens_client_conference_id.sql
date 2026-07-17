ALTER TABLE "recebimento"."itens_recebimento" ADD COLUMN "client_conference_id" varchar(128);--> statement-breakpoint
ALTER TABLE "recebimento"."itens_recebimento" ADD CONSTRAINT "itens_recebimento_rec_client_conf_uidx" UNIQUE("recebimento_id","client_conference_id");
