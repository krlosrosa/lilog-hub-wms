ALTER TABLE "expedicao"."mapa_grupos" DROP CONSTRAINT "mapa_grupos_micro_uuid_processo_unique";--> statement-breakpoint
ALTER TABLE "expedicao"."mapa_grupos" ADD CONSTRAINT "mapa_grupos_lote_micro_uuid_processo_unique" UNIQUE("mapa_lote_id","micro_uuid","processo");
