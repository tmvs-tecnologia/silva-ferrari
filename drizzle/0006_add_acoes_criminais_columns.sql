ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "reu_name" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "autor_name" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "numero_processo" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "responsavel_name" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "responsavel_date" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "resumo" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "acompanhamento" text;
ALTER TABLE "acoes_criminais" ADD COLUMN IF NOT EXISTS "contratado" text;
