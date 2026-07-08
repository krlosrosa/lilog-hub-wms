-- Add operational structure types for non-rack addresses (area_operacional, recebimento, etc.)
DO $$ BEGIN
  ALTER TYPE "public"."endereco_tipo_estrutura_type" ADD VALUE 'piso';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."endereco_tipo_estrutura_type" ADD VALUE 'staging';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."endereco_tipo_estrutura_type" ADD VALUE 'area-delimitada';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TYPE "public"."endereco_tipo_estrutura_type" ADD VALUE 'patio';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
