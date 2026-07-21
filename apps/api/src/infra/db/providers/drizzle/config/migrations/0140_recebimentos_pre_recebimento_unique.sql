CREATE UNIQUE INDEX IF NOT EXISTS recebimentos_pre_recebimento_id_unique_idx
  ON recebimento.recebimentos (pre_recebimento_id);
