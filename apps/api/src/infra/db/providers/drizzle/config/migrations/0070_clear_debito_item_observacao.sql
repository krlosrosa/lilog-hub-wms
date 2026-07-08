UPDATE "cobranca_transportadora"."processo_debito_itens"
SET "observacao" = NULL
WHERE "observacao" IS NOT NULL;
