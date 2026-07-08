CREATE TABLE "auth"."usuarios_terceiros" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(200) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(20) DEFAULT 'viewer' NOT NULL,
	"status" varchar(20) DEFAULT 'ativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_terceiros_email_unique" UNIQUE("email")
);
