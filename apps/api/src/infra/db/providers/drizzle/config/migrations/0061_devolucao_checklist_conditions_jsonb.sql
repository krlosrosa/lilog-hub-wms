ALTER TABLE "devolucao"."devolucao_checklist"
  ADD COLUMN "conditions" jsonb;

UPDATE "devolucao"."devolucao_checklist"
SET "conditions" = jsonb_build_object(
  'limpeza', condicao_limpeza,
  'odor', condicao_odor,
  'estrutura', condicao_estrutura,
  'vedacao', condicao_vedacao
);

ALTER TABLE "devolucao"."devolucao_checklist"
  ALTER COLUMN "conditions" SET NOT NULL,
  ALTER COLUMN "conditions" SET DEFAULT '{}',
  DROP COLUMN "condicao_limpeza",
  DROP COLUMN "condicao_odor",
  DROP COLUMN "condicao_estrutura",
  DROP COLUMN "condicao_vedacao";
