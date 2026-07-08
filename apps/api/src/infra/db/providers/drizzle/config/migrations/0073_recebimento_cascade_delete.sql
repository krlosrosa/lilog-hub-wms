DELETE FROM "armazenagem"."itens_armazenagem" ia
USING "armazenagem"."demandas_armazenagem" da
WHERE ia."demanda_id" = da."id"
  AND NOT EXISTS (
    SELECT 1
    FROM "recebimento"."recebimentos" r
    WHERE r."id" = da."recebimento_id"
  );
--> statement-breakpoint
DELETE FROM "armazenagem"."demandas_armazenagem" da
WHERE NOT EXISTS (
  SELECT 1
  FROM "recebimento"."recebimentos" r
  WHERE r."id" = da."recebimento_id"
);
--> statement-breakpoint
UPDATE "armazenagem"."unitizadores" u
SET "recebimento_id" = NULL
WHERE u."recebimento_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "recebimento"."recebimentos" r
    WHERE r."id" = u."recebimento_id"
  );
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" DROP CONSTRAINT IF EXISTS "recebimentos_pre_recebimento_id_pre_recebimentos_id_fk";
--> statement-breakpoint
ALTER TABLE "recebimento"."recebimentos" ADD CONSTRAINT "recebimentos_pre_recebimento_id_pre_recebimentos_id_fk" FOREIGN KEY ("pre_recebimento_id") REFERENCES "recebimento"."pre_recebimentos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "armazenagem"."demandas_armazenagem" ADD CONSTRAINT "demandas_armazenagem_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "armazenagem"."unitizadores" ADD CONSTRAINT "unitizadores_recebimento_id_recebimentos_id_fk" FOREIGN KEY ("recebimento_id") REFERENCES "recebimento"."recebimentos"("id") ON DELETE set null ON UPDATE no action;
