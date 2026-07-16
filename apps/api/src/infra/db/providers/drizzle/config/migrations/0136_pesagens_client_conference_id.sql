ALTER TABLE "recebimento"."pesagens_recebimento" ADD COLUMN "client_conference_id" varchar(128);--> statement-breakpoint
ALTER TABLE "recebimento"."pesagens_recebimento" ADD CONSTRAINT "pesagens_recebimento_item_client_conf_uidx" UNIQUE("recebimento_item_id","client_conference_id");
