CREATE TABLE IF NOT EXISTS "auth"."usuario_unidades" (
  "user_id" integer NOT NULL,
  "unidade_id" varchar(50) NOT NULL,
  CONSTRAINT "usuario_unidades_user_id_unidade_id_pk" PRIMARY KEY("user_id","unidade_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth"."usuario_unidades" ADD CONSTRAINT "usuario_unidades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth"."usuario_unidades" ADD CONSTRAINT "usuario_unidades_unidade_id_unidades_id_fk" FOREIGN KEY ("unidade_id") REFERENCES "master_data"."unidades"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usuario_unidades_user_id_idx" ON "auth"."usuario_unidades" USING btree ("user_id");
