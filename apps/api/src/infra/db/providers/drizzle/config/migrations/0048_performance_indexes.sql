CREATE INDEX IF NOT EXISTS "transportes_unidade_data_rota_idx" ON "expedicao"."transportes" USING btree ("unidade_id","data_transporte","rota");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transportes_unidade_upload_lote_idx" ON "expedicao"."transportes" USING btree ("unidade_id","upload_lote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transportes_unidade_idx" ON "expedicao"."transportes" USING btree ("unidade_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "remessas_upload_lote_idx" ON "expedicao"."remessas" USING btree ("upload_lote_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transporte_remessas_remessa_idx" ON "expedicao"."transporte_remessas" USING btree ("remessa_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit"."audit_logs" USING btree ("created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit"."audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_resource_idx" ON "audit"."audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saldos_unidade_produto_idx" ON "estoque"."saldos" USING btree ("unidade_id","produto_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "funcionarios_email_lower_idx" ON "auth"."funcionarios" USING btree (lower("email"));
