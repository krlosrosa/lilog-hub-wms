UPDATE "devolucao"."devolucao_faltas_peso"
SET
  "status" = 'validada',
  "validado_em" = COALESCE("validado_em", "registrado_em"),
  "updated_at" = NOW()
WHERE "status" = 'pendente';
