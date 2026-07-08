-- Rename 'doca' to 'area_operacional' in the endereco_tipo_type enum.
-- PostgreSQL 10+ supports RENAME VALUE natively.
ALTER TYPE "public"."endereco_tipo_type" RENAME VALUE 'doca' TO 'area_operacional';
