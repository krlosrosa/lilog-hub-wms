ALTER TABLE recebimento.recebimento_avarias
  ADD COLUMN client_damage_id VARCHAR(128);

CREATE UNIQUE INDEX recebimento_avarias_recebimento_client_damage_uidx
  ON recebimento.recebimento_avarias (recebimento_id, client_damage_id)
  WHERE client_damage_id IS NOT NULL;
