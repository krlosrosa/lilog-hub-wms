DROP INDEX IF EXISTS recebimento.recebimento_avarias_recebimento_client_damage_uidx;

ALTER TABLE recebimento.recebimento_avarias
  ADD CONSTRAINT recebimento_avarias_recebimento_client_damage_uidx
  UNIQUE (recebimento_id, client_damage_id);
