ALTER TABLE "recebimento"."checklist_recebimento"
  ADD COLUMN "conditions" jsonb;

UPDATE "recebimento"."checklist_recebimento"
SET "conditions" = jsonb_build_object(
  'limpeza', condicao_limpeza,
  'odor', condicao_odor,
  'estrutura', condicao_estrutura,
  'vedacao', condicao_vedacao
);

ALTER TABLE "recebimento"."checklist_recebimento"
  ALTER COLUMN "conditions" SET DEFAULT '{}';
