ALTER TABLE "devolucao"."devolucao_avarias"
ADD COLUMN IF NOT EXISTS "skus_afetados" varchar(50)[];
