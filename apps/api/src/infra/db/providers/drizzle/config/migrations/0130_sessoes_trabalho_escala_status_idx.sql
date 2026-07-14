CREATE INDEX "sessoes_trabalho_escala_status_idx" ON "sessao_operacao"."sessoes_trabalho" USING btree ("escala_id","status");
