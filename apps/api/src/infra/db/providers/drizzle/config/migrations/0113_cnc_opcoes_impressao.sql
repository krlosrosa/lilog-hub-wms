ALTER TABLE "cnc"."nao_conformidades"
  ADD COLUMN IF NOT EXISTS "opcoes_impressao" jsonb;
